/* Fraud Response Plan: builds an ordered checklist from what happened,
   with legal reporting deadlines worked out from the dates entered. */
(function (root) {
  const FW = root.FW || (typeof require !== "undefined" ? require("./tools-common.js") : null);
  const C = "consumer-financial-security.html";

  const L = {
    reportfraud: ["ReportFraud.ftc.gov", "https://reportfraud.ftc.gov/"],
    ic3: ["FBI IC3 complaint", "https://www.ic3.gov/"],
    cfpb: ["CFPB complaint", "https://www.consumerfinance.gov/complaint/"],
    idtheft: ["IdentityTheft.gov", "https://www.identitytheft.gov/"],
    equifax: ["Equifax freeze", "https://www.equifax.com/personal/credit-report-services/credit-freeze/"],
    experian: ["Experian freeze", "https://www.experian.com/freeze/center.html"],
    transunion: ["TransUnion freeze", "https://www.transunion.com/credit-freeze"],
    acr: ["AnnualCreditReport.com", "https://www.annualcreditreport.com/"],
    hacked: ["FTC: recover a hacked email or social media account", "https://consumer.ftc.gov/articles/how-recover-your-hacked-email-or-social-media-account"],
    ippin: ["IRS Identity Protection PIN", "https://www.irs.gov/identity-theft-fraud-scams/get-an-identity-protection-pin"],
  };

  const SCENARIOS = [
    ["credit", "A charge I didn't make on a credit card"],
    ["debit", "A debit card, ATM or bank transfer I didn't make, or a lost or stolen debit card"],
    ["skim", "I think my card was skimmed at an ATM or gas pump"],
    ["sent", "I sent money to a scammer (Zelle, wire, payment app, gift card or crypto)"],
    ["login", "Someone got into my bank or card account online"],
    ["email", "My email account was hacked"],
    ["identity", "I gave out my Social Security number or a photo of my ID"],
  ];

  // Each step: priority (lower first), id (dedupes across scenarios), text, links.
  function steps(sel, d) {
    const out = [];
    const add = (priority, id, text, links = []) => out.push({ priority, id, text, links: links.map((k) => (Array.isArray(k) ? k : L[k])) });
    const has = (k) => sel.includes(k);

    if (has("sent")) {
      add(1, "sent-call", "Call your bank or the payment app right now. Say the payment was fraud and ask them to stop, recall or reverse it. For a wire, ask the bank to send a recall request to the receiving bank. Speed matters most here.");
      add(1, "giftcard", "If you paid with gift cards, contact the card company using the number on the back of the card and ask for a refund. Keep the cards and receipts.");
      add(1, "crypto", "If you paid in cryptocurrency, contact the exchange or crypto ATM operator you used and ask them to freeze the transfer.");
    }
    if (has("credit") || has("debit") || has("skim") || has("login")) {
      add(1, "call-bank", "Call your bank or card issuer using the number on the back of your card or on your statement, not a number from a text, email or caller. Ask them to lock the card or account and issue a new card number.");
    }
    if (has("email")) {
      add(1, "email-recover", "Recover your email account first, because it can reset every other password. Use the provider's official recovery page, then change the password and sign out all other sessions.", ["hacked"]);
      add(2, "email-rules", "In your email settings, delete forwarding rules, filters, recovery addresses and phone numbers that you did not add.");
    }
    if (has("login") || has("email")) {
      add(2, "passwords", "From a device you trust, change the passwords for your bank and card accounts and any account that used the same password. Use a different password for each.", [["Password Checker & Generator", "password-tool.html"]]);
      add(2, "mfa", "Turn on two-step verification. An authenticator app or passkey is safer than text-message codes. Ask your mobile carrier to add a port-out PIN or SIM lock.");
      add(3, "payees", "Inside the bank account, check for payees, linked accounts, address, email or phone changes you didn't make, and remove them with the bank's help.");
    }
    if (has("identity") || has("login") || has("email")) {
      add(2, "freeze", "Freeze your credit at all three bureaus. It is free and stops new accounts being opened in your name.", ["equifax", "experian", "transunion", ["Credit Freeze Tracker", "freeze-tracker.html"]]);
    }
    if (has("identity")) {
      add(2, "idtheft", "Report identity theft at IdentityTheft.gov to get an official report and a recovery plan with ready-made letters.", ["idtheft"]);
      add(3, "ippin", "Get an IRS Identity Protection PIN so nobody else can file a tax return with your Social Security number.", ["ippin"]);
    }
    if (has("credit")) {
      const stmt = FW.parseDate(d.statement);
      const deadline = stmt ? FW.addDays(stmt, 60) : null;
      add(2, "credit-dispute",
        "Dispute the charge with the card issuer. To keep your rights under the Fair Credit Billing Act, send the dispute in writing so it arrives within 60 days after the first statement showing the charge was sent. Your liability for unauthorized credit card use is capped at $50, and most issuers charge $0." +
          (deadline ? ` Written dispute deadline: ${FW.fmt(deadline)}.` : " Enter the statement date above to work out the deadline."),
        [["FTC: using credit cards and disputing charges", "https://consumer.ftc.gov/articles/using-credit-cards-and-disputing-charges"]]);
      if (deadline) out[out.length - 1].deadline = deadline;
    }
    if (has("debit") || has("skim")) {
      const learned = FW.parseDate(d.learned);
      const stmt = FW.parseDate(d.statement);
      const two = learned ? FW.addBusinessDays(learned, 2) : null;
      const sixty = stmt ? FW.addDays(stmt, 60) : null;
      let t = "Report it to the bank in a way you can prove (phone, then confirm in writing or through secure messaging). Under the Electronic Fund Transfer Act and Regulation E: if your card or PIN was lost or stolen and you tell the bank within two business days of learning about it, your loss is limited to $50; after that it can be up to $500. If you don't report unauthorized transfers that appear on a statement within 60 days after it was sent, you can lose everything taken after that point.";
      if (two) t += ` Two-business-day deadline: ${FW.fmt(two)}.`;
      if (sixty) t += ` 60-day statement deadline: ${FW.fmt(sixty)}.`;
      if (!two && !sixty) t += " Enter the dates above to work out the deadlines.";
      add(2, "reg-e", t, [["CFPB: Regulation E, 12 CFR 1005.6", "https://www.consumerfinance.gov/rules-policy/regulations/1005/6/"]]);
      const s = out[out.length - 1];
      s.deadline = two || sixty;
    }
    if (has("skim")) {
      add(3, "skim-report", "Tell the store, gas station or bank that owns the machine, and file a police report. Mention the exact location, date and time.", [["FBI: skimming", "https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-scams-and-crimes/skimming"]]);
    }
    if (has("sent")) {
      add(3, "sent-report", "Report the scam to the FBI and the FTC. Include dates, amounts, account or wallet numbers, usernames and screenshots.", ["ic3", "reportfraud"]);
      add(3, "recovery-scam", "Watch for recovery scams: anyone who contacts you offering to get your money back for a fee is almost certainly a second scammer.");
    }
    if (has("credit") || has("debit") || has("skim") || has("sent") || has("login")) {
      add(4, "cfpb", "If the bank or card company doesn't resolve it, submit a complaint to the Consumer Financial Protection Bureau. The company must respond.", ["cfpb"]);
      add(4, "reportfraud", "Report fraud to the FTC so it can be tracked and investigated.", ["reportfraud"]);
    }
    add(5, "monitor", "Check your credit reports for accounts you don't recognize, and turn on transaction alerts for every account.", ["acr"]);
    add(5, "records", "Keep a log: who you spoke to, when, what they said, and reference numbers. Save letters, emails and screenshots.");

    const seen = new Set();
    return out.filter((s) => (seen.has(s.id) ? false : seen.add(s.id))).sort((a, b) => a.priority - b.priority);
  }

  const Plan = { steps, SCENARIOS };
  root.FWPlan = Plan;
  if (typeof module !== "undefined") module.exports = Plan;

  // ---- Page wiring ----
  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("plan-form");
    if (!form) return;
    const box = document.getElementById("plan-scenarios");
    const out = document.getElementById("plan-result");
    const state = FW.load("plan", { sel: [], learned: "", statement: "", done: [] });

    box.innerHTML = SCENARIOS.map(([id, label]) =>
      `<label class="check"><input type="checkbox" id="sc-${id}" value="${id}"> <span>${FW.esc(label)}</span></label>`).join("");
    SCENARIOS.forEach(([id]) => (document.getElementById("sc-" + id).checked = state.sel.includes(id)));
    form.learned.value = state.learned;
    form.statement.value = state.statement;

    function render() {
      state.sel = SCENARIOS.map(([id]) => id).filter((id) => document.getElementById("sc-" + id).checked);
      state.learned = form.learned.value;
      state.statement = form.statement.value;
      FW.save("plan", state);
      if (!state.sel.length) {
        out.innerHTML = `<p class="muted">Tick at least one box above to see your plan.</p>`;
        return;
      }
      const list = steps(state.sel, state);
      const today = FW.today();
      const done = list.filter((s) => state.done.includes(s.id)).length;
      let h = `<p class="progress" aria-live="polite"><strong>${done} of ${list.length}</strong> steps done</p><ol class="plan">`;
      for (const s of list) {
        const checked = state.done.includes(s.id);
        let due = "";
        if (s.deadline) {
          const left = FW.daysBetween(today, s.deadline);
          const cls = left < 0 ? "chip-3" : left <= 7 ? "chip-2" : "chip-1";
          due = `<span class="chip ${cls}">${left < 0 ? `${-left} days past` : left === 0 ? "Due today" : `${left} days left`}</span> `;
        }
        h += `<li class="${checked ? "done" : ""}"><label class="check"><input type="checkbox" data-step="${s.id}" ${checked ? "checked" : ""}>
          <span>${due}${FW.esc(s.text)}</span></label>`;
        if (s.links.length) h += `<p class="step-links">${s.links.map(([t, u]) => `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ""}>${FW.esc(t)}</a>`).join(" · ")}</p>`;
        h += `</li>`;
      }
      h += `</ol><p class="note">Deadlines count weekends and federal bank holidays as non-business days. Your bank's own business days can differ, so act before the earliest date. This is general information, not legal advice.</p>`;
      out.innerHTML = h;
    }

    form.addEventListener("change", (e) => {
      if (e.target.dataset.step) {
        const id = e.target.dataset.step;
        state.done = e.target.checked ? [...new Set([...state.done, id])] : state.done.filter((x) => x !== id);
        FW.save("plan", state);
      }
      render();
    });
    form.addEventListener("submit", (e) => e.preventDefault());
    document.getElementById("plan-reset").addEventListener("click", () => {
      state.sel = []; state.done = []; state.learned = ""; state.statement = "";
      FW.clear("plan");
      SCENARIOS.forEach(([id]) => (document.getElementById("sc-" + id).checked = false));
      form.learned.value = ""; form.statement.value = "";
      render();
    });
    render();
  });
})(typeof window !== "undefined" ? window : globalThis);
