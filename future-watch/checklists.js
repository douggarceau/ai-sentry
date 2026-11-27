/* Checklist tools: tick the warning signs that apply and get a verdict with next steps,
   or work through step-by-step checks. Progress is saved only in this browser. */
(function (root) {
  const FW = root.FW;
  const C = "consumer-financial-security.html";
  const S = "ai-surveillance-tracking.html";
  const ext = (t, u) => ({ t, u, ext: true });
  const int = (t, u) => ({ t, u });

  const LISTS = {
    tracker: {
      verdicts: {
        high: ["Strong signs you may be tracked", "Plan your next steps before removing anything. Taking off stalkerware or a tracker can alert the person who placed it. If you are in danger, call 911."],
        medium: ["Some warning signs", "Work through the checks for your phone below. They take about 15 minutes."],
        low: ["A weak sign", "On its own this is common, but run the checks below to be sure."],
        none: ["Tick any signs that apply", "If none apply, you can still run the checks below as a routine privacy review."],
      },
      signs: [
        { id: "alert", sev: 3, text: "My phone showed an alert about an unknown AirTag, tracker or \"Find My\" item moving with me" },
        { id: "knows", sev: 3, text: "Someone knows where I've been, or quotes my messages, when I didn't tell them" },
        { id: "phone-access", sev: 2, text: "Someone else has had my phone, knows my passcode, or set it up for me" },
        { id: "account-access", sev: 2, text: "Someone knows my Apple ID, Google account or email password" },
        { id: "sound", sev: 2, text: "I've heard an unexplained beeping or chirping from my bag, car or belongings" },
        { id: "battery", sev: 1, text: "My battery drains much faster than before, or the phone is hot when idle" },
        { id: "apps", sev: 2, text: "There are apps or settings on my phone I didn't install or change" },
        { id: "car", sev: 2, text: "Someone has had access to my car" },
      ],
      advice: {
        alert: "Use the alert to play a sound and find the tracker. Note the serial number shown, then turn the tracker off by removing its battery, or take it to the police.",
        knows: "Check location sharing, linked devices and forwarding (steps below) and change your account passwords from a device the other person has never had.",
        "phone-access": "Check for monitoring apps, device-management profiles and accessibility permissions (steps below), and change your passcode.",
        "account-access": "Change the password and turn on two-step verification, then sign out every device you don't recognise.",
        sound: "Search bags, coat pockets, the car's wheel wells, bumpers, seats and the diagnostic port under the dashboard.",
        car: "Check under the bumpers, inside wheel wells, under seats, in the trunk lining and the OBD diagnostic port under the steering wheel. A mechanic can help.",
      },
      steps: {
        iPhone: [
          "Run Safety Check: Settings › Privacy & Security › Safety Check. It shows who you share location and data with and lets you stop it (iOS 16 or later).",
          "Open Find My › People and stop sharing your location with anyone you don't want to.",
          "Settings › General › VPN & Device Management: remove any profile you don't recognise. Monitoring software often installs one.",
          "Settings › your name: review the list of devices signed in to your Apple ID and remove any you don't own.",
          "Change your Apple ID password and make sure two-factor authentication is on.",
          "Keep iOS updated: unknown-tracker alerts for both AirTags and Android-compatible trackers need iOS 17.5 or later.",
        ],
        Android: [
          "Scan for trackers: Settings › Safety & emergency › Unknown tracker alerts › Scan now (menu names vary slightly by phone maker).",
          "Google Maps › your profile picture › Location sharing: stop any sharing you didn't set up.",
          "Settings › Security (or Biometrics and security) › Device admin apps: turn off anything you don't recognise.",
          "Settings › Accessibility: check for apps with accessibility access you didn't grant. Spyware often uses it to read the screen.",
          "Open Google Play › your profile › Play Protect › Scan.",
          "Visit myaccount.google.com › Security › Your devices, and sign out devices you don't own. Change your Google password and turn on 2-Step Verification.",
        ],
      },
      links: [ext("Coalition Against Stalkerware: help and guides", "https://stopstalkerware.org/"), ext("National Domestic Violence Hotline: 1-800-799-7233", "https://www.thehotline.org/"), int("Wi-Fi & Bluetooth Tracking", S + "#wifi-bluetooth")],
    },

    idcheck: {
      verdicts: {
        high: ["Don't send your ID", "This request has strong signs of identity fraud. Stop, and contact the company through its official app or a phone number you already have."],
        medium: ["Verify before you upload", "Something about this request is unusual. Confirm it through the company's official app or website before sharing anything."],
        low: ["Probably fine, with care", "Upload only inside the official app or a site you typed in yourself, and cover any numbers that aren't needed if they allow it."],
        none: ["Tick anything that applies to the request", "If nothing applies and you started the process yourself on the official site or app, uploading is usually expected."],
      },
      signs: [
        { id: "link", sev: 3, text: "The request came as a link in a text, email, social media message or chat" },
        { id: "unsolicited", sev: 3, text: "I didn't start this. They contacted me first" },
        { id: "email", sev: 3, text: "They want the ID photo sent by email, text or a messaging app" },
        { id: "job", sev: 3, text: "It's for a job I haven't interviewed for in person or on a video call with a verified company" },
        { id: "rental", sev: 3, text: "It's for a rental I haven't seen in person, or the landlord is \"out of the country\"" },
        { id: "both-sides", sev: 2, text: "They also want my Social Security number, bank login, or a selfie holding the ID" },
        { id: "urgent", sev: 2, text: "They're rushing me or threatening to close an account" },
        { id: "unknown-site", sev: 2, text: "The web address isn't the company's usual one, or I'm not sure" },
        { id: "payment", sev: 3, text: "They also want a payment, deposit or gift card" },
        { id: "official", sev: 0, text: "I opened the company's official app or typed its web address myself", good: true },
      ],
      advice: {
        link: "Close the link. Open the company's app or type its address yourself and see if the request is there.",
        unsolicited: "Real verification requests happen when you open an account or apply for something. Unexpected ones are a common scam.",
        email: "Never email or text images of your ID. Legitimate companies use a secure upload inside their own app or website.",
        job: "Fake employers collect IDs during \"onboarding\" for jobs that don't exist. Verify the company and the recruiter independently first.",
        rental: "Rental scammers collect IDs and deposits for homes they don't own. Never send either before seeing the property.",
        "both-sides": "Combined with your ID, these let criminals open accounts in your name.",
        payment: "A request for ID plus payment is the pattern of fake rentals, jobs and loans.",
      },
      links: [int("Identity Document Upload Safety", C + "#id-upload-safety"), ext("IdentityTheft.gov (if you already sent it)", "https://www.identitytheft.gov/"), int("Credit Freeze Tracker", "freeze-tracker.html")],
    },

    skimmer: {
      verdicts: {
        high: ["Don't use this machine", "Cancel, take your card and use another machine, ideally one inside a bank branch. Tell the bank or store staff."],
        medium: ["Be careful here", "Something looks off. Use tap to pay if it's available, cover the keypad, or find another machine."],
        low: ["Probably fine", "Cover the keypad with your hand when typing your PIN and check your account for the next few days."],
        none: ["Tick anything you notice at the machine", "Check before you insert your card: the reader, the keypad and the area around them."],
      },
      signs: [
        { id: "loose", sev: 3, text: "The card slot or reader wiggles, sticks out, or comes loose when I tug it" },
        { id: "keypad", sev: 3, text: "The keypad feels thick, spongy or raised compared with normal" },
        { id: "camera", sev: 3, text: "There's a small hole, strip or extra panel above the keypad that could hide a camera" },
        { id: "mismatch", sev: 2, text: "Parts of the front are a different color, material or style" },
        { id: "seal", sev: 3, text: "At a gas pump: the security tape on the panel is broken or the panel is open" },
        { id: "glue", sev: 2, text: "Glue residue, scratches or tape around the card slot" },
        { id: "stuck", sev: 2, text: "The machine kept my card or asked for my PIN twice" },
        { id: "outside", sev: 1, text: "It's an outdoor or standalone machine (not inside a bank branch)" },
        { id: "tap", sev: 0, text: "The machine supports tap to pay or a phone wallet", good: true },
      ],
      advice: {
        loose: "Card readers are fixed firmly. A loose or bulky reader is the classic sign of an overlay skimmer.",
        keypad: "A fake keypad overlay records your PIN.",
        camera: "Pinhole cameras record PINs. Always cover the keypad with your other hand.",
        seal: "Pump skimmers are installed inside the panel. Pay inside or use another pump, and tell the attendant.",
        stuck: "Call your bank right away to block the card. Don't accept help from strangers at the machine.",
        tap: "Tap to pay or a phone wallet never exposes your card's magnetic stripe, so skimmers can't copy it.",
      },
      links: [int("Fraud Response Plan (if your card was used)", "response-plan.html"), ext("FBI: skimming", "https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-scams-and-crimes/skimming"), int("ATM Fraud & Card Skimming", C + "#atm-skimming")],
    },

    loan: {
      verdicts: {
        high: ["This looks like a loan scam", "Don't pay anything or share account details. Check the lender's license before going further."],
        medium: ["Proceed with caution", "This offer has warning signs. Check the license, read the full terms and compare the total cost."],
        low: ["Some things to check", "Compare the total cost with other offers before you agree."],
        none: ["Tick anything that applies to the offer", "Then check the lender's license and the total cost with the calculator below."],
      },
      signs: [
        { id: "fee", sev: 3, text: "They want a fee before I get the money (insurance, processing, \"first payment\")" },
        { id: "giftcard", sev: 3, text: "They want that fee by gift card, wire, payment app or crypto" },
        { id: "guaranteed", sev: 3, text: "Approval is guaranteed, or they don't care about my credit" },
        { id: "unsolicited", sev: 2, text: "The offer came by text, call or social media message I didn't ask for" },
        { id: "nolicense", sev: 3, text: "I can't find the lender on NMLS Consumer Access or my state regulator's list" },
        { id: "pressure", sev: 2, text: "They're pushing me to decide today" },
        { id: "noaddress", sev: 2, text: "No physical address, or the website is new or full of errors" },
        { id: "terms", sev: 2, text: "They won't show the APR and total cost in writing before I sign" },
        { id: "bankinfo", sev: 2, text: "They want my online banking password or to \"test\" deposits into my account" },
      ],
      advice: {
        fee: "Legitimate lenders take fees out of the loan or include them in the payments. Charging upfront to get a loan is the classic advance-fee scam.",
        giftcard: "No real lender takes gift cards or crypto. Stop now.",
        guaranteed: "Real lenders check your ability to repay. A guarantee is bait.",
        nolicense: "Lenders and brokers must be licensed in most states. Search the name on NMLS Consumer Access.",
        terms: "Federal law (the Truth in Lending Act) requires the APR and finance charge to be disclosed before you're committed.",
        bankinfo: "Never give your banking password. \"Test deposits\" are often used to launder money or set up fake-check scams.",
      },
      links: [ext("NMLS Consumer Access: check a lender's license", "https://www.nmlsconsumeraccess.org/"), ext("Report it at ReportFraud.ftc.gov", "https://reportfraud.ftc.gov/"), int("Loan & Credit Offer Scams", C + "#loan-credit-scams")],
    },
  };

  function verdictFor(list, ticked) {
    const sevs = list.signs.filter((s) => ticked.includes(s.id)).map((s) => s.sev);
    const top = Math.max(0, ...sevs);
    return top === 3 ? "high" : top === 2 ? (sevs.filter((x) => x === 2).length >= 2 ? "high" : "medium") : top === 1 ? "low" : "none";
  }

  root.FWChecklists = { LISTS, verdictFor };
  if (typeof module !== "undefined") module.exports = root.FWChecklists;

  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", () => {
    const box = document.querySelector("[data-checklist]");
    if (!box) return;
    const key = box.dataset.checklist;
    const list = LISTS[key];
    const state = FW.load("check-" + key, { ticked: [], device: "iPhone", done: [] });
    const link = (l) => `<a href="${l.u}"${l.ext ? ' target="_blank" rel="noopener"' : ""}>${FW.esc(l.t)}</a>`;

    function render() {
      const v = verdictFor(list, state.ticked);
      const [head, text] = list.verdicts[v];
      let h = `<fieldset class="plain"><legend class="field">Tick everything that applies</legend><div class="checks">` +
        list.signs.map((s) => `<label class="check"><input type="checkbox" data-sign="${s.id}" ${state.ticked.includes(s.id) ? "checked" : ""}> <span>${FW.esc(s.text)}</span></label>`).join("") +
        `</div></fieldset>`;
      h += `<div class="verdict verdict-${v}" role="status" aria-live="polite"><strong>${head}</strong><p>${text}</p></div>`;
      const adv = list.signs.filter((s) => state.ticked.includes(s.id) && list.advice[s.id]);
      if (adv.length) h += `<h3>What to do</h3><ul class="findings">${adv.map((s) => `<li class="sev-${s.sev}">${s.good ? '<span class="chip chip-ok">Good</span> ' : ""}${FW.esc(list.advice[s.id])}</li>`).join("")}</ul>`;

      if (list.steps) {
        const devs = Object.keys(list.steps);
        h += `<h3>Step-by-step checks</h3><div class="buttons" role="group" aria-label="Choose your phone">` +
          devs.map((d) => `<button type="button" class="${state.device === d ? "btn" : "btn-quiet"}" data-device="${d}" aria-pressed="${state.device === d}">${d}</button>`).join("") + `</div>`;
        const steps = list.steps[state.device];
        const done = steps.filter((_, i) => state.done.includes(state.device + i)).length;
        h += `<p class="progress">${done} of ${steps.length} checks done</p><ol class="plan">` +
          steps.map((s, i) => { const id = state.device + i, d = state.done.includes(id); return `<li class="${d ? "done" : ""}"><label class="check"><input type="checkbox" data-step="${id}" ${d ? "checked" : ""}> <span>${FW.esc(s)}</span></label></li>`; }).join("") + `</ol>`;
      }
      h += `<h3>Help and resources</h3><ul>${list.links.map((l) => `<li>${link(l)}</li>`).join("")}</ul>`;
      h += `<div class="buttons"><button type="button" class="btn-quiet" data-reset>Start over</button></div>`;
      box.innerHTML = h;
    }

    box.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.sign) state.ticked = t.checked ? [...new Set([...state.ticked, t.dataset.sign])] : state.ticked.filter((x) => x !== t.dataset.sign);
      if (t.dataset.step) state.done = t.checked ? [...new Set([...state.done, t.dataset.step])] : state.done.filter((x) => x !== t.dataset.step);
      FW.save("check-" + key, state);
      const id = t.dataset.sign ? `[data-sign="${t.dataset.sign}"]` : `[data-step="${t.dataset.step}"]`;
      render();
      const again = box.querySelector(id);
      if (again) again.focus();
    });
    box.addEventListener("click", (e) => {
      const t = e.target;
      if (t.dataset.device) { state.device = t.dataset.device; FW.save("check-" + key, state); render(); box.querySelector(`[data-device="${t.dataset.device}"]`).focus(); }
      if (t.hasAttribute("data-reset")) { state.ticked = []; state.done = []; FW.clear("check-" + key); render(); }
    });
    render();
  });
})(typeof window !== "undefined" ? window : globalThis);
