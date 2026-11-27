/* Email Header Analyzer: reads raw email headers and checks sender
   authentication (SPF, DKIM, DMARC) and common spoofing signs. */
(function (root) {
  const FW = root.FW || (typeof require !== "undefined" ? require("./tools-common.js") : null);
  const FREEMAIL = ["gmail.com", "googlemail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com", "aol.com", "icloud.com", "me.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "yandex.com", "zoho.com"];
  const BRAND_WORDS = /\b(bank|chase|wells\s*fargo|citi|capital\s*one|paypal|amazon|apple|microsoft|google|netflix|irs|usps|fedex|ups|dhl|coinbase|venmo|zelle|support|security|billing|account|fraud|helpdesk|it\s+department|payroll|hr)\b/i;

  function parse(raw) {
    const text = String(raw || "").replace(/\r\n/g, "\n");
    const headerPart = text.split(/\n\s*\n/)[0];
    const lines = headerPart.split("\n");
    const fields = [];
    for (const line of lines) {
      if (/^[ \t]/.test(line) && fields.length) fields[fields.length - 1].value += " " + line.trim();
      else {
        const m = /^([!-9;-~]+):\s*(.*)$/.exec(line);
        if (m) fields.push({ name: m[1], lname: m[1].toLowerCase(), value: m[2] });
      }
    }
    return fields;
  }

  function addr(v) {
    if (!v) return null;
    // The real address is the last <…>; a display name can contain a fake one.
    const open = v.lastIndexOf("<"), close = v.lastIndexOf(">");
    const angle = open !== -1 && close > open ? v.slice(open + 1, close) : null;
    const email = (angle || (/[\w.+'-]+@[\w.-]+\.\w+/.exec(v) || [""])[0]).trim().toLowerCase();
    const display = angle !== null ? v.slice(0, open).replace(/["']/g, "").trim() : "";
    const domain = email.includes("@") ? email.split("@")[1] : "";
    return { email, display, domain };
  }
  function orgDomain(d) {
    if (!d) return "";
    const p = d.toLowerCase().split(".");
    const two = p.slice(-2).join(".");
    return ["co.uk", "com.au", "co.jp", "com.br", "co.nz", "org.uk"].includes(two) ? p.slice(-3).join(".") : two;
  }

  function analyze(raw) {
    const fields = parse(raw);
    const get = (n) => fields.filter((f) => f.lname === n).map((f) => f.value);
    const first = (n) => get(n)[0];
    const from = addr(first("from"));
    const replyTo = addr(first("reply-to"));
    const returnPath = addr(first("return-path"));
    const findings = [];
    const add = (sev, title, detail) => findings.push({ sev, title, detail });

    if (!fields.length || !from) return { ok: false, fields };

    // Authentication-Results (the receiving server's verdicts)
    const ar = get("authentication-results").join(" ; ") + " ; " + get("arc-authentication-results").join(" ; ");
    const res = (k) => { const m = new RegExp("\\b" + k + "=(\\w+)", "i").exec(ar); return m ? m[1].toLowerCase() : null; };
    let spf = res("spf");
    if (!spf) { const r = first("received-spf"); if (r) spf = (/^\s*(\w+)/.exec(r) || [])[1]?.toLowerCase() || null; }
    const dkim = res("dkim");
    const dmarc = res("dmarc");
    const headerD = (/header\.d=([\w.-]+)/i.exec(ar) || [])[1] || "";
    const sigD = get("dkim-signature").map((v) => (/\bd=([\w.-]+)/i.exec(v) || [])[1]).filter(Boolean);
    const dkimDomain = (headerD || sigD[0] || "").toLowerCase();

    const auth = { spf: spf || "not found", dkim: dkim || "not found", dmarc: dmarc || "not found" };
    if (dmarc === "fail") add(3, "DMARC failed", "The sending domain's own policy says this message did not come from them. This is the strongest sign of a spoofed sender.");
    else if (dmarc === "pass") add(0, "DMARC passed", `The message is authenticated for ${from.domain}. That proves the domain sent it, not that the domain is trustworthy: check the domain name itself carefully.`);
    if (spf && /fail|softfail/.test(spf)) add(2, `SPF ${spf}`, "The server that sent this is not listed as allowed to send for the sender's domain.");
    if (dkim && /fail|none|neutral|permerror|temperror/.test(dkim) && dkim !== "pass") add(dkim === "fail" ? 2 : 1, `DKIM ${dkim}`, "The message has no valid digital signature from the sending domain.");
    if (!ar.replace(/[ ;]/g, "") && !first("received-spf")) add(1, "No authentication results found", "These headers have no Authentication-Results line. Copy the full headers from your email app (instructions below) to get SPF, DKIM and DMARC checks.");
    if (dkimDomain && from.domain && orgDomain(dkimDomain) !== orgDomain(from.domain))
      add(1, "Signed by a different domain", `The DKIM signature is from ${dkimDomain}, not ${from.domain}. That is normal for mailing services, but check you expect mail from them.`);

    // Spoofing signs
    if (replyTo && replyTo.domain && orgDomain(replyTo.domain) !== orgDomain(from.domain))
      add(replyTo && FREEMAIL.includes(replyTo.domain) ? 3 : 2, "Replies go to a different domain", `Mail appears to come from ${from.email}, but replies would go to ${replyTo.email}. Scammers use this so your reply reaches them.`);
    if (returnPath && returnPath.domain && orgDomain(returnPath.domain) !== orgDomain(from.domain) && !(dmarc === "pass"))
      add(1, "Bounce address uses a different domain", `Return-Path is ${returnPath.email}. Common for newsletters, but combined with other signs it suggests spoofing.`);
    const dispEmail = /[\w.+-]+@[\w.-]+\.\w+/.exec(from.display || "");
    if (dispEmail && dispEmail[0].toLowerCase() !== from.email)
      add(3, "Display name shows a different email address", `The name shown is "${from.display}", but the real address is ${from.email}.`);
    if (FREEMAIL.includes(from.domain) && BRAND_WORDS.test(from.display || ""))
      add(3, "Company name sent from a free email account", `"${from.display}" is sending from ${from.domain}. Banks and companies don't email customers from free accounts.`);
    const msgId = first("message-id");
    const midDomain = msgId ? ((/@([\w.-]+)>?/.exec(msgId) || [])[1] || "").toLowerCase() : "";
    if (dmarc !== "pass" && midDomain && from.domain && orgDomain(midDomain) !== orgDomain(from.domain) && !/google|gmail|yahoo|icloud|apple|outlook|amazonses|sendgrid|mailgun|mailchimp|mcsv|salesforce|exacttarget|sparkpost|mandrill|protection\.outlook/i.test(midDomain))
      add(1, "Message ID from a different domain", `The Message-ID was created by ${midDomain}.`);

    // Delivery path, oldest hop first
    const received = get("received").reverse().map((v) => {
      const fromHost = (/\bfrom\s+([^\s(;]+)/i.exec(v) || [])[1] || "";
      const by = (/\bby\s+([^\s(;]+)/i.exec(v) || [])[1] || "";
      const ip = (/\[(\d{1,3}(?:\.\d{1,3}){3}|[0-9a-f:]{6,})\]/i.exec(v) || [])[1] || "";
      const date = new Date((v.split(";").pop() || "").trim());
      return { fromHost, by, ip, date: isNaN(date) ? null : date };
    });
    for (let i = 1; i < received.length; i++) {
      const a = received[i - 1].date, b = received[i].date;
      if (a && b && (b - a) / 60000 > 60) add(1, "Long delay in delivery", `About ${Math.round((b - a) / 60000)} minutes between two servers. Sometimes seen with bulk or queued spam.`);
    }

    const worst = Math.max(0, ...findings.map((f) => f.sev));
    const level = worst === 3 ? "high" : worst === 2 ? "medium" : worst === 1 ? "low" : "none";
    return { ok: true, fields, from, replyTo, returnPath, subject: first("subject") || "", date: first("date") || "", auth, dkimDomain, received, findings: findings.sort((a, b) => b.sev - a.sev), level };
  }

  const EH = { parse, analyze };
  root.FWHeaders = EH;
  if (typeof module !== "undefined") module.exports = EH;

  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("eh-form");
    if (!form) return;
    const input = document.getElementById("eh-input");
    const out = document.getElementById("eh-result");
    const LEVELS = {
      high: ["Likely spoofed or a scam", "Don't reply, click links or open attachments. Contact the sender through a website or number you already know."],
      medium: ["Authentication problems", "Something about who sent this doesn't add up. Treat links and requests in it with suspicion."],
      low: ["Minor notes", "Nothing clearly wrong. The notes below are common in legitimate bulk mail."],
      none: ["Sender checks passed", "The domain checks out. Still look closely at the domain name itself: scammers can pass these checks with lookalike domains they own."],
    };
    const chipFor = (v) => (v === "pass" ? "chip-ok" : /fail/.test(v) ? "chip-3" : "chip-2");
    function render(r) {
      if (!r.ok) { out.hidden = false; out.innerHTML = `<p class="verdict verdict-low">No From header found. Paste the full headers, starting with lines like "Received:" and "From:".</p>`; return; }
      const [head, advice] = LEVELS[r.level];
      let h = `<div class="verdict verdict-${r.level}" role="status"><strong>${head}</strong><p>${advice}</p></div>`;
      h += `<h3>Sender checks</h3><p>${["spf", "dkim", "dmarc"].map((k) => `<span class="chip ${chipFor(r.auth[k])}">${k.toUpperCase()} ${FW.esc(r.auth[k])}</span>`).join(" ")}</p>`;
      h += `<dl class="kv"><dt>From</dt><dd>${FW.esc((r.from.display ? r.from.display + " " : "") + "<" + r.from.email + ">")}</dd>`;
      if (r.replyTo) h += `<dt>Reply-To</dt><dd>${FW.esc(r.replyTo.email)}</dd>`;
      if (r.returnPath) h += `<dt>Return-Path</dt><dd>${FW.esc(r.returnPath.email)}</dd>`;
      if (r.dkimDomain) h += `<dt>Signed by</dt><dd>${FW.esc(r.dkimDomain)}</dd>`;
      if (r.subject) h += `<dt>Subject</dt><dd>${FW.esc(r.subject)}</dd>`;
      if (r.date) h += `<dt>Date</dt><dd>${FW.esc(r.date)}</dd>`;
      h += `</dl>`;
      if (r.findings.length) h += `<h3>Findings</h3><ul class="findings">` + r.findings.map((f) => `<li class="sev-${f.sev}"><strong>${FW.esc(f.title)}</strong><br>${FW.esc(f.detail)}</li>`).join("") + `</ul>`;
      if (r.received.length) {
        h += `<h3>Delivery path (first server first)</h3><div class="table-wrap"><table class="grid"><thead><tr><th scope="col">#</th><th scope="col">From server</th><th scope="col">IP</th><th scope="col">Received by</th><th scope="col">Time</th></tr></thead><tbody>`;
        r.received.forEach((x, i) => (h += `<tr><td class="num">${i + 1}</td><td>${FW.esc(x.fromHost)}</td><td class="num">${FW.esc(x.ip)}</td><td>${FW.esc(x.by)}</td><td class="num">${x.date ? FW.esc(x.date.toLocaleString()) : ""}</td></tr>`));
        h += `</tbody></table></div><p class="note">Only the lines added by your own mail provider (the last rows) can be fully trusted; a sender can fake earlier ones.</p>`;
      }
      out.innerHTML = h;
      out.hidden = false;
    }
    form.addEventListener("submit", (e) => { e.preventDefault(); render(analyze(input.value)); });
    document.getElementById("eh-clear").addEventListener("click", () => { input.value = ""; out.hidden = true; input.focus(); });
    document.getElementById("eh-sample").addEventListener("click", () => {
      input.value = [
        "Delivered-To: you@example.com",
        "Received: from mail-out.fastsender.top (mail-out.fastsender.top [203.0.113.45])",
        "        by mx.example.com with ESMTPS id abc123; Thu, 26 Nov 2026 09:14:02 -0500",
        "Authentication-Results: mx.example.com;",
        "       spf=softfail (domain of transitioning billing@chase.com does not designate 203.0.113.45 as permitted sender) smtp.mailfrom=billing@chase.com;",
        "       dkim=none;",
        "       dmarc=fail (p=REJECT sp=REJECT dis=QUARANTINE) header.from=chase.com",
        "Return-Path: <bounce@fastsender.top>",
        "From: \"Chase Security <security@chase.com>\" <alerts@chase.com>",
        "Reply-To: chase.verify.team@gmail.com",
        "Subject: Action required: unusual sign-in",
        "Date: Thu, 26 Nov 2026 09:13:58 -0500",
        "Message-ID: <20261126141358.1@fastsender.top>",
      ].join("\n");
      render(analyze(input.value));
    });
  });
})(typeof window !== "undefined" ? window : globalThis);
