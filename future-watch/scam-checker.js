/* Scam Message Checker: flags known scam signs in a pasted message or link.
   Rules are plain patterns, so every flag shows exactly which words triggered it. */
(function (root) {
  const C = "consumer-financial-security.html";
  const REPORT = { text: "Report it at ReportFraud.ftc.gov", href: "https://reportfraud.ftc.gov/" };

  // weight: 3 = strong scam sign, 2 = common scam sign, 1 = weak on its own
  const RULES = [
    { id: "safe-account", weight: 3, title: "Asks you to move money to a \"safe\" account",
      re: /\b(safe|secure|protected|new)\s+(bank\s+)?account\b|\bmove\s+(all\s+)?(your\s+)?(money|funds|savings)\b|\bprotect\s+your\s+(money|funds|savings)\b/i,
      why: "Banks and government agencies never ask you to move money to protect it. This is the core of bank-impersonation scams.",
      topic: "#bank-impersonation" },
    { id: "code", weight: 3, title: "Asks for a verification code",
      re: /\b(read|send|give|tell|share|provide|confirm|reply\s+with)\b[^.!?\n]{0,40}\b(code|otp|passcode|pin)\b|\b(verification|security|one[- ]?time|authentication|6[- ]digit)\s+(code|passcode)\b/i,
      why: "A one-time code lets someone sign in as you or approve a payment. Nobody legitimate will ask you to read one back.",
      topic: "#account-takeover" },
    { id: "pay-method", weight: 3, title: "Wants payment by gift card, crypto, wire or payment app",
      re: /\bgift\s*cards?\b|\b(bitcoin|btc|crypto(currency)?|usdt|tether|ethereum)\b|\bbitcoin\s+atm\b|\bwire\s+(the\s+)?(money|funds|payment|transfer)\b|\bwire\s+transfer\b|\b(zelle|cash\s*app|venmo|western\s+union|moneygram)\b/i,
      why: "These payments are fast and very hard to reverse, which is why scammers insist on them.",
      topic: "#wire-zelle-fraud" },
    { id: "secrecy", weight: 3, title: "Tells you to keep it secret or not contact your bank",
      re: /\b(don'?t|do\s+not)\s+(tell|inform|contact|call|speak\s+to)\b[^.!?\n]{0,30}\b(anyone|anybody|bank|family|teller|branch|staff)\b|\bkeep\s+(this|it)\s+(confidential|secret|between\s+us)\b/i,
      why: "Scammers isolate victims so that bank staff or family can't warn them.",
      topic: "#bank-impersonation" },
    { id: "remote", weight: 3, title: "Asks you to install an app or allow remote access",
      re: /\b(anydesk|teamviewer|ultraviewer|quick\s*support|logmein|screen\s*connect|rustdesk)\b|\bremote\s+(access|control|support)\b|\bshare\s+your\s+screen\b/i,
      why: "Remote access lets a scammer see your screen, open your bank account and move money.",
      topic: "#account-takeover" },
    { id: "courier", weight: 3, title: "Mentions a courier collecting cash, gold or your card",
      re: /\bcourier\b|\b(pick\s*up|collect)\b[^.!?\n]{0,25}\b(cash|gold|card|money)\b|\bsend\s+(cash|gold)\b/i,
      why: "Couriers sent to collect cash, gold or cards are a growing part of impersonation scams.",
      topic: "#bank-impersonation" },
    { id: "bec", weight: 3, title: "Changed bank or wire instructions",
      re: /\b(new|updated|changed|different)\s+(bank(ing)?|wire|payment|remittance|account)\s+(details|instructions|information|info)\b|\baccount\s+(number\s+)?has\s+changed\b/i,
      why: "Changed payment instructions by email are the signature of business email compromise and real estate closing fraud. Verify by phone using a number you already have.",
      topic: "#wire-zelle-fraud" },
    { id: "advance-fee", weight: 3, title: "Upfront fee to get a loan, prize or refund",
      re: /\b(processing|insurance|upfront|up-front|advance|application|release|activation|clearance)\s+fee\b|\bpay\b[^.!?\n]{0,40}\bbefore\b[^.!?\n]{0,40}\b(loan|funds|prize|refund|release)\b/i,
      why: "Legitimate lenders and prize programs do not charge a fee before paying you.",
      topic: "#loan-credit-scams" },
    { id: "guaranteed", weight: 2, title: "Guaranteed approval or no credit check",
      re: /\bguaranteed\s+(approval|loan|approved)\b|\bno\s+credit\s+check\b|\bpre-?approved\b|\bbad\s+credit\s+ok\b/i,
      why: "Lenders cannot guarantee a loan before reviewing your application. This is a common lure for advance-fee loan scams.",
      topic: "#loan-credit-scams" },
    { id: "bank-alert", weight: 2, title: "Claims to be your bank's fraud team or an account alert",
      re: /\bfraud\s+(department|team|alert|prevention|unit)\b|\bsuspicious\s+(activity|transaction|login|charge|sign-?in)\b|\baccount\s+(has\s+been\s+|is\s+|was\s+)?(locked|suspended|restricted|limited|frozen|compromised|on\s+hold)\b/i,
      why: "Real alerts exist, but scammers copy them. Don't use any number or link in the message; call the number on the back of your card.",
      topic: "#bank-impersonation" },
    { id: "credentials", weight: 2, title: "Asks you to confirm account details or personal information",
      re: /\b(confirm|verify|update|validate|re-?enter)\s+(your\s+)?(account|identity|details|information|info|password|login|card|billing|payment)\b|\bsocial\s+security\s+number\b|\bssn\b|\bmother'?s\s+maiden\b/i,
      why: "Messages that ask you to confirm details through a link are the most common way logins and card numbers are stolen.",
      topic: "#account-takeover" },
    { id: "id-upload", weight: 2, title: "Asks for a photo of your ID or a selfie",
      re: /\b(upload|send|submit|photo\s+of|picture\s+of|scan\s+of)\b[^.!?\n]{0,25}\b(driver'?s\s+licen[cs]e|id\b|id\s+card|passport|selfie|identification)\b/i,
      why: "ID photos let criminals open accounts in your name. Only upload ID through an app or site you opened yourself.",
      topic: "#id-upload-safety" },
    { id: "overpay", weight: 2, title: "Overpayment or refund you must send back",
      re: /\boverpa(id|yment)\b|\b(send|pay|refund)\s+(back\s+)?the\s+difference\b|\b(accidentally|mistakenly)\s+(sent|transferred|deposited)\b|\brefund\s+(department|team)\b/i,
      why: "The original payment is usually fake or stolen and will be reversed after you send real money back.",
      topic: "#merchant-scams" },
    { id: "prize", weight: 2, title: "Prize, lottery or sweepstakes win",
      re: /\byou('ve|\s+have)\s+(won|been\s+selected)\b|\b(lottery|sweepstakes|jackpot)\b|\bclaim\s+your\s+(prize|reward|winnings)\b/i,
      why: "You can't win a contest you didn't enter, and real prizes never require payment.",
      topic: "#loan-credit-scams" },
    { id: "toll-package", weight: 2, title: "Unpaid toll or failed delivery",
      re: /\bunpaid\s+toll\b|\btoll\s+(balance|charges?|violation)\b|\b(package|parcel|shipment)\b[^.!?\n]{0,40}\b(could\s+not|couldn'?t|unable\s+to|failed\s+to)\s+(be\s+)?deliver/i,
      why: "Fake toll and delivery texts are among the most reported text scams. Check by going to the toll agency or carrier website yourself.",
      topic: "#merchant-scams" },
    { id: "threat", weight: 2, title: "Threatens arrest, lawsuit or account closure",
      re: /\b(arrest|warrant|lawsuit|legal\s+action|deport|police\s+will)\b|\bwill\s+be\s+(closed|suspended|terminated|cancell?ed|deactivated)\b/i,
      why: "Threats are meant to make you act before you think. Government agencies don't demand immediate payment by phone or text.",
      topic: "#bank-impersonation" },
    { id: "urgency", weight: 1, title: "Pressure to act immediately",
      re: /\b(immediately|urgent(ly)?|right\s+away|act\s+now|final\s+(notice|warning)|last\s+chance|expires?\s+today)\b|\bwithin\s+(\d+|twenty[- ]four|one|two)\s+(hours?|minutes?)\b/i,
      why: "Real institutions give you time to check. Slow down and verify independently.",
      topic: "#bank-impersonation" },
    { id: "callback", weight: 1, title: "Gives you a number to call back",
      re: /\b(call|contact|dial|text)\s+(us|me|our\s+\w+|this\s+number|the\s+number)\b[^.!?\n]{0,40}\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b[^.!?\n]{0,25}\b(call|text)\b/i,
      why: "Scammers include their own phone number. Use the number on your card, statement or the company's real website instead.",
      topic: "#bank-impersonation" },
  ];

  // Official domains of brands often imitated in phishing.
  const BRANDS = {
    chase: "chase.com", bankofamerica: "bankofamerica.com", wellsfargo: "wellsfargo.com", citi: "citi.com",
    citibank: "citi.com", capitalone: "capitalone.com", usbank: "usbank.com", pnc: "pnc.com", truist: "truist.com",
    americanexpress: "americanexpress.com", amex: "americanexpress.com", discover: "discover.com",
    paypal: "paypal.com", venmo: "venmo.com", zelle: "zellepay.com", zellepay: "zellepay.com", cashapp: "cash.app",
    amazon: "amazon.com", apple: "apple.com", icloud: "icloud.com", microsoft: "microsoft.com", google: "google.com",
    netflix: "netflix.com", coinbase: "coinbase.com", usps: "usps.com", fedex: "fedex.com", ups: "ups.com",
    irs: "irs.gov", ssa: "ssa.gov", experian: "experian.com", equifax: "equifax.com", transunion: "transunion.com",
    ezpass: "e-zpassny.com", walmart: "walmart.com", costco: "costco.com", schwab: "schwab.com", fidelity: "fidelity.com",
  };
  const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "rb.gy", "is.gd", "cutt.ly", "shorturl.at", "ow.ly", "buff.ly", "t.ly", "tiny.cc", "s.id", "rebrand.ly"];
  const RISKY_TLDS = ["top", "xyz", "icu", "click", "live", "shop", "online", "site", "buzz", "cfd", "sbs", "rest", "lol", "mom", "cyou", "vip", "win", "loan", "support", "help"];
  const TWO_PART_SUFFIXES = ["co.uk", "org.uk", "ac.uk", "com.au", "net.au", "co.nz", "co.jp", "com.br", "co.in", "com.mx", "co.za"];

  function registrable(host) {
    const parts = host.split(".");
    const last2 = parts.slice(-2).join(".");
    if (TWO_PART_SUFFIXES.includes(last2) && parts.length >= 3) return parts.slice(-3).join(".");
    return last2;
  }
  function normalizeLookalike(s) {
    return s.replace(/0/g, "o").replace(/[1!|]/g, "l").replace(/3/g, "e").replace(/5/g, "s").replace(/\$/g, "s").replace(/rn/g, "m").replace(/vv/g, "w").replace(/-/g, "");
  }
  function editDistance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  function findUrls(text) {
    const out = [];
    const re = /\b((?:https?:\/\/|www\.)[^\s<>"')\]]+|(?:[a-z0-9-]+\.)+(?:com|net|org|info|biz|us|io|co|app|gov|top|xyz|icu|click|live|shop|online|site|buzz|cfd|sbs|rest|lol|mom|cyou|vip|win|loan|support|help|ly|gd|at|me)(?:\/[^\s<>"')\]]*)?)/gi;
    let m;
    while ((m = re.exec(text))) {
      let raw = m[1].replace(/[.,;:!?]+$/, "");
      if (/@/.test(text.slice(Math.max(0, m.index - 1), m.index))) continue; // part of an email address
      out.push(raw);
    }
    return [...new Set(out)];
  }

  function analyzeUrl(raw) {
    const flags = [];
    let url;
    try {
      url = new URL(/^https?:\/\//i.test(raw) ? raw : "http://" + raw);
    } catch (e) {
      return { raw, host: raw, flags: [{ weight: 1, text: "Could not be read as a web address." }] };
    }
    const host = url.hostname.toLowerCase();
    const reg = registrable(host);
    const regLabel = reg.split(".")[0];
    const tld = host.split(".").pop();

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) flags.push({ weight: 3, text: "Uses a raw IP address instead of a company's domain name." });
    if (host.split(".").some((p) => p.startsWith("xn--"))) flags.push({ weight: 3, text: "Contains encoded international characters (punycode), a common way to imitate real domains." });
    if (/@/.test(url.href.split("?")[0].replace(/^https?:\/\//, "").split("/")[0]) || url.username) flags.push({ weight: 3, text: "Has an @ before the domain, which hides the real destination." });
    if (SHORTENERS.includes(host)) flags.push({ weight: 2, text: "Uses a link shortener, which hides the real destination." });
    if (RISKY_TLDS.includes(tld)) flags.push({ weight: 1, text: `Ends in .${tld}, a domain ending that is frequently used in scam campaigns.` });
    if (url.protocol === "http:" && /^https?:\/\//i.test(raw)) flags.push({ weight: 1, text: "Not encrypted (http, not https)." });
    if ((host.match(/-/g) || []).length >= 3) flags.push({ weight: 1, text: "Has many hyphens, common in throwaway phishing domains." });

    const officialDomains = new Set(Object.values(BRANDS));
    if (!officialDomains.has(reg)) {
      // Brand name in the subdomain or path of an unrelated domain, e.g. chase.com.secure-login.top
      const outside = (host.slice(0, host.length - reg.length) + url.pathname).toLowerCase().replace(/[^a-z0-9]/g, " ");
      const named = Object.keys(BRANDS).find((b) => b.length >= 4 && new RegExp("(^|\\s)" + b + "(\\s|$)").test(outside));
      if (named) flags.push({ weight: 3, text: `Mentions "${named}" but the real domain is ${reg}, not ${BRANDS[named]}.` });
      // Lookalike of a brand's own domain, e.g. paypa1.com, chasse.com, wellsfargo-secure.com
      const WORDS = "secure|login|logon|signin|verify|verification|support|alert|alerts|online|account|accounts|help|service|services|update|billing|auth|my|web|app|mobile";
      const norm = normalizeLookalike(regLabel);
      for (const [brand, official] of Object.entries(BRANDS)) {
        const o = official.split(".")[0];
        if (o.length < 4 || regLabel === o) continue;
        const names = [...new Set([o, brand].filter((n) => n.length >= 4))];
        const combo = names.some((n) => new RegExp(`(^|-)${n}(-|$)|^(${WORDS})-?${n}$|^${n}-?(${WORDS})$`).test(regLabel));
        const swapped = norm === o.replace(/-/g, "");
        const dist = editDistance(norm, o);
        // Short names only count as lookalikes when a letter is added or dropped (chasse, amazn),
        // so ordinary words one letter apart (apply vs apple) are not flagged.
        const close = norm.length >= 5 && dist > 0 &&
          (o.length >= 8 ? dist <= 2 : o.length >= 6 ? dist <= 1 : dist === 1 && norm.length !== o.length);
        if (combo || swapped || close) {
          flags.push({ weight: 3, text: `Looks like ${official} but is actually ${reg}.` });
          break;
        }
      }
    }
    return { raw, host, reg, flags };
  }

  function analyze(text) {
    const input = String(text || "");
    const findings = [];
    for (const r of RULES) {
      const m = r.re.exec(input);
      if (m) findings.push({ id: r.id, weight: r.weight, title: r.title, why: r.why, match: m[0].trim(), topic: C + r.topic });
    }
    const urls = findUrls(input).map(analyzeUrl);
    const score = findings.reduce((s, f) => s + f.weight, 0) + urls.reduce((s, u) => s + u.flags.reduce((a, f) => a + f.weight, 0), 0);
    const strong = findings.some((f) => f.weight === 3) || urls.some((u) => u.flags.some((f) => f.weight === 3));
    let level = "none";
    if (strong || score >= 6) level = "high";
    else if (score >= 3) level = "medium";
    else if (score > 0) level = "low";
    return { level, score, findings, urls };
  }

  const Scam = { analyze, analyzeUrl, findUrls, RULES, REPORT };
  root.FWScam = Scam;
  if (typeof module !== "undefined") module.exports = Scam;

  // ---- Page wiring ----
  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("scam-form");
    if (!form) return;
    const input = document.getElementById("scam-input");
    const out = document.getElementById("scam-result");
    const FW = root.FW;

    const LEVELS = {
      high: ["Strong scam signs", "Do not reply, click, call the number in the message, or send money. Contact the company using a number or website you already know."],
      medium: ["Several warning signs", "Treat this as suspicious. Verify it by contacting the company yourself, not through anything in the message."],
      low: ["A weak warning sign", "One sign on its own is common in real messages too. Verify independently before you act."],
      none: ["No known scam signs found", "That does not prove it is safe: new scams use new wording. If anything asks for money, codes or personal details, verify it yourself first."],
    };

    function render(res) {
      const [head, advice] = LEVELS[res.level];
      let h = `<div class="verdict verdict-${res.level}" role="status"><strong>${head}</strong><p>${advice}</p></div>`;
      if (res.findings.length) {
        h += `<h3>What it found</h3><ul class="findings">`;
        for (const f of res.findings) {
          h += `<li class="sev-${f.weight}"><span class="chip chip-${f.weight}">${f.weight === 3 ? "Strong" : f.weight === 2 ? "Warning" : "Weak"}</span>
            <strong>${FW.esc(f.title)}</strong><br><span class="quote">“${FW.esc(f.match)}”</span><br>${FW.esc(f.why)}
            <a href="${f.topic}">Read more</a></li>`;
        }
        h += `</ul>`;
      }
      if (res.urls.length) {
        h += `<h3>Links in the message</h3><ul class="findings">`;
        for (const u of res.urls) {
          const worst = Math.max(0, ...u.flags.map((f) => f.weight));
          h += `<li class="sev-${worst}"><code>${FW.esc(u.raw)}</code><br>Domain: <strong>${FW.esc(u.reg || u.host)}</strong>`;
          h += u.flags.length ? `<ul>${u.flags.map((f) => `<li>${FW.esc(f.text)}</li>`).join("")}</ul>` : `<br><span class="muted">No link warning signs found.</span>`;
          h += `</li>`;
        }
        h += `</ul>`;
      }
      if (res.level !== "none") {
        h += `<h3>What to do</h3><ul>
          <li>If you already paid, gave a code or shared details, open the <a href="response-plan.html">Fraud Response Plan</a>.</li>
          <li><a href="${REPORT.href}" target="_blank" rel="noopener">${REPORT.text}</a>. Forward scam texts to 7726 (SPAM).</li></ul>`;
      }
      out.innerHTML = h;
      out.hidden = false;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!input.value.trim()) {
        out.hidden = false;
        out.innerHTML = `<p class="verdict verdict-low">Paste a message or link first.</p>`;
        return;
      }
      render(analyze(input.value));
    });
    document.getElementById("scam-clear").addEventListener("click", () => {
      input.value = "";
      out.hidden = true;
      input.focus();
    });
    document.querySelectorAll("[data-sample]").forEach((b) =>
      b.addEventListener("click", () => {
        input.value = b.dataset.sample;
        render(analyze(input.value));
      })
    );
  });
})(typeof window !== "undefined" ? window : globalThis);
