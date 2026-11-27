import html
import build  # writes the four topic pages
from build import OUT, HEADER, FONTS

CATS = {
    "consumer": ("CONSUMER FINANCIAL SECURITY", "consumer-financial-security.html"),
    "cyber": ("AI CYBERSECURITY", "ai-cybersecurity.html"),
    "surv": ("AI SURVEILLANCE & TRACKING", "ai-surveillance-tracking.html"),
}

# Every finished tool: (file, name, category, one-line description)
TOOL_LIST = [
    ("scam-checker.html", "Scam Message Checker", "consumer", "Check a text, email or link for scam signs."),
    ("response-plan.html", "Fraud Response Plan", "consumer", "Step-by-step plan and legal deadlines after fraud."),
    ("freeze-tracker.html", "Credit Freeze Tracker", "consumer", "Track freezes at all three credit bureaus."),
    ("subscriptions.html", "Subscription & Fee Tracker", "consumer", "Total your subscriptions and catch renewals."),
    ("injection-scanner.html", "Prompt-Injection Scanner", "cyber", "Find hidden AI instructions in text or web pages."),
    ("email-headers.html", "Email Header Analyzer", "cyber", "Check whether an email really came from its sender."),
    ("password-tool.html", "Password Checker & Generator", "cyber", "Test a password and generate strong ones."),
    ("file-hash.html", "File Hash Verifier", "cyber", "Confirm a download hasn't been tampered with."),
    ("id-check.html", "ID Request Check", "consumer", "Check a request for your ID before you upload it."),
    ("skimmer-check.html", "Skimmer Check", "consumer", "Spot a skimmer at an ATM or gas pump."),
    ("loan-check.html", "Loan Offer Check", "consumer", "Spot loan scams and see an offer's true cost."),
    ("photo-privacy.html", "Photo Location Remover", "surv", "See and remove the location hidden in a photo."),
    ("browser-exposure.html", "Browser Exposure Check", "surv", "See what websites learn about your device."),
    ("tracker-check.html", "Unwanted Tracker Check", "surv", "Check your phone and belongings for tracking."),
    ("code-word.html", "Family Code Word Setup", "surv", "Protect your family from voice-clone scam calls."),
]

PRIVACY = '<p class="privacy">Runs in your browser. Nothing you enter is sent anywhere.</p>'
PRIVACY_SAVED = '<p class="privacy">Runs in your browser. Saved only on this device; nothing is sent anywhere.</p>'


def shell(fname, title, body, scripts=(), desc=""):
    scr = "\n".join(f'<script src="{s}"></script>' for s in ["menu.js", *scripts])
    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
{FONTS}
</head>
<body>
{HEADER}
<main id="main">
{body}
</main>
<footer>
  <p>Future Watch tools give general information, not legal or financial advice. They run in your browser and send nothing anywhere.</p>
</footer>
{scr}
</body>
</html>
"""
    (OUT / fname).write_text(doc)


def tool_page(fname, name, cat, lede, body, scripts, related):
    cname, cpage = CATS[cat]
    rel = " · ".join(f'<a href="{cpage}#{i}">{html.escape(t)}</a>' for t, i in related)
    shell(fname, f"{name} · Future Watch", f"""  <p class="crumb"><a href="index.html">Home</a> / <a href="{cpage}">{html.escape(cname)}</a> / Tool</p>
  <h1>{html.escape(name)}</h1>
  <p class="lede">{lede}</p>
{body}
  <p class="note">Related topics: {rel}</p>""", ["tools-common.js", *scripts], lede)


SAMPLE_1 = "Chase Fraud Dept: suspicious login detected. To protect your money, move your funds to a safe account today. Do not tell the bank teller why. Call 1-833-555-0199."
SAMPLE_2 = "USPS: Your package could not be delivered due to an incomplete address. Update within 24 hours: https://usps-redelivery.top/track"
SAMPLE_3 = "Hi Dana, it's Mark. Are we still on for lunch Thursday at noon?"

tool_page("scam-checker.html", "Scam Message Checker", "consumer",
    "Paste a text, email, voicemail transcript or link. The checker looks for the signs found in common scams and explains each one.",
    f"""  <form class="console" id="scam-form" novalidate>
    {PRIVACY}
    <label class="field" for="scam-input">Message or link</label>
    <textarea id="scam-input" name="message" placeholder="Paste the message here" spellcheck="false"></textarea>
    <div class="buttons">
      <button class="btn" type="submit">Check message</button>
      <button class="btn-quiet" type="button" id="scam-clear">Clear</button>
    </div>
    <div class="samples"><span class="muted">Try an example:</span>
      <button class="btn-quiet" type="button" data-sample="{html.escape(SAMPLE_1)}">Bank impersonation</button>
      <button class="btn-quiet" type="button" data-sample="{html.escape(SAMPLE_2)}">Fake delivery</button>
      <button class="btn-quiet" type="button" data-sample="{html.escape(SAMPLE_3)}">Normal message</button>
    </div>
    <div class="result" id="scam-result" hidden aria-live="polite"></div>
  </form>""",
    ["scam-checker.js"],
    [("Bank Impersonation", "bank-impersonation"), ("Wire Transfer & Zelle Fraud", "wire-zelle-fraud"), ("Merchant Scams", "merchant-scams"), ("Loan & Credit Offer Scams", "loan-credit-scams")])

tool_page("response-plan.html", "Fraud Response Plan", "consumer",
    "Tick what happened. You get an ordered checklist with the official places to report, and the legal deadlines for your dates.",
    f"""  <form class="console" id="plan-form" novalidate>
    {PRIVACY_SAVED}
    <h2 class="sr">What happened</h2>
    <fieldset class="plain"><legend class="field">What happened? Tick all that apply</legend>
      <div class="checks" id="plan-scenarios"></div>
    </fieldset>
    <div class="form-grid">
      <div><label class="field" for="learned">Date you found out</label><input type="date" id="learned" name="learned"></div>
      <div><label class="field" for="statement">Date of the statement showing it</label><input type="date" id="statement" name="statement"></div>
    </div>
    <div class="buttons"><button class="btn-quiet" type="button" id="plan-reset">Start over</button></div>
    <div class="result" id="plan-result" aria-live="polite"></div>
  </form>""",
    ["response-plan.js"],
    [("Account Recovery", "account-recovery"), ("Online Card Fraud", "online-card-fraud"), ("ATM Fraud & Card Skimming", "atm-skimming"), ("Wire Transfer & Zelle Fraud", "wire-zelle-fraud")])

tool_page("freeze-tracker.html", "Credit Freeze Tracker", "consumer",
    "A freeze only works when it is in place at all three bureaus. Record each one here, for yourself and your children.",
    f"""  <div class="console">
    {PRIVACY_SAVED}
    <div id="freeze-app"></div>
    <div class="buttons">
      <button class="btn" type="button" id="freeze-add">Add a person</button>
      <button class="btn-quiet" type="button" id="freeze-reset">Clear all</button>
    </div>
    <p class="note">Keep freeze PINs and bureau logins in a password manager, not here. Freezes are free by federal law, don't affect your credit score, and can be lifted for a set time when you apply for credit.</p>
  </div>""",
    ["freeze-tracker.js"],
    [("Credit Freezes", "credit-freezes"), ("Identity Document Upload Safety", "id-upload-safety")])

tool_page("subscriptions.html", "Subscription & Fee Tracker", "consumer",
    "List your recurring charges to see what they cost each year and get flagged before a renewal, a trial ending or a price increase.",
    f"""  <form class="console" id="sub-form" novalidate>
    {PRIVACY_SAVED}
    <h2 class="sr">Add a subscription</h2>
    <div class="form-grid">
      <div><label class="field" for="sname">Name</label><input id="sname" name="sname" required placeholder="e.g. Music streaming"></div>
      <div><label class="field" for="amount">Price ($)</label><input type="number" id="amount" name="amount" min="0" step="0.01" required placeholder="12.99"></div>
      <div><label class="field" for="cycle">Billed</label><select id="cycle" name="cycle"><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="quarterly">Quarterly</option><option value="weekly">Weekly</option></select></div>
      <div><label class="field" for="date">A charge date (past or next)</label><input type="date" id="date" name="date" required></div>
      <div><label class="field" for="previous">Previous price, if it went up</label><input type="number" id="previous" name="previous" min="0" step="0.01"></div>
      <div><label class="field" for="cancel">Cancel page link (optional)</label><input type="url" id="cancel" name="cancel" placeholder="https://"></div>
    </div>
    <label class="check"><input type="checkbox" id="trial" name="trial"> <span>This is a free trial (the date is when it starts charging)</span></label>
    <label class="check"><input type="checkbox" id="used" name="used" checked> <span>I still use this</span></label>
    <div class="buttons"><button class="btn" type="submit">Add subscription</button></div>
    <div class="result" id="sub-result" aria-live="polite"></div>
  </form>""",
    ["subscriptions.js"],
    [("Subscriptions & Hidden Fees", "subscriptions-hidden-fees")])


tool_page("injection-scanner.html", "Prompt-Injection Scanner", "cyber",
    "AI assistants and agents read text people can't see. Paste a web page, email or document, or load a file, to find instructions hidden for an AI before you ask one to work with it.",
    f"""  <form class="console" id="inj-form" novalidate>
    {PRIVACY}
    <label class="field" for="inj-input">Text or HTML</label>
    <textarea id="inj-input" spellcheck="false" placeholder="Paste text, an email, or a page's HTML source"></textarea>
    <label class="field" for="inj-file">Or load a file (.html, .txt, .md, .eml, .json, .csv)</label>
    <input type="file" id="inj-file" accept=".html,.htm,.txt,.md,.eml,.json,.csv,.xml,text/*">
    <div class="buttons">
      <button class="btn" type="submit">Scan</button>
      <button class="btn-quiet" type="button" id="inj-sample">Try an example</button>
      <button class="btn-quiet" type="button" id="inj-clear">Clear</button>
    </div>
    <div class="result" id="inj-result" hidden aria-live="polite"></div>
  </form>
  <p class="note">It checks for invisible Unicode characters (including hidden "tag" text), text hidden with CSS, HTML comments, instructions in alt text and metadata, phrases that try to override an AI's instructions, data-leaking image links and encoded blocks. To view a page's HTML, right-click it and choose View Page Source.</p>""",
    ["injection-scanner.js"],
    [("Vulnerability Management & Security Testing", "vulnerability-testing"), ("Threat Detection & Incident Response", "detection-response")])

tool_page("email-headers.html", "Email Header Analyzer", "cyber",
    "Paste an email's full headers to see whether it really came from who it claims, using the same SPF, DKIM and DMARC checks your mail server ran.",
    f"""  <form class="console" id="eh-form" novalidate>
    {PRIVACY}
    <label class="field" for="eh-input">Full email headers</label>
    <textarea id="eh-input" spellcheck="false" placeholder="Received: from …&#10;Authentication-Results: …&#10;From: …"></textarea>
    <div class="buttons">
      <button class="btn" type="submit">Analyze headers</button>
      <button class="btn-quiet" type="button" id="eh-sample">Try an example</button>
      <button class="btn-quiet" type="button" id="eh-clear">Clear</button>
    </div>
    <div class="result" id="eh-result" hidden aria-live="polite"></div>
  </form>
  <div class="console">
    <h2 class="eyebrow" style="margin:0">How to copy the headers</h2>
    <ul>
      <li><strong>Gmail (web):</strong> open the email, click the three dots next to Reply, choose <em>Show original</em>, then <em>Copy to clipboard</em>.</li>
      <li><strong>Outlook (web or new Outlook):</strong> open the email, click the three dots, choose <em>View</em>, then <em>View message source</em>.</li>
      <li><strong>Apple Mail (Mac):</strong> open the email, then choose <em>View</em>, <em>Message</em>, <em>All Headers</em>.</li>
      <li><strong>Yahoo Mail:</strong> open the email, click the three dots, choose <em>View raw message</em>.</li>
    </ul>
  </div>""",
    ["email-headers.js"],
    [("Threat Detection & Incident Response", "detection-response")])

tool_page("password-tool.html", "Password Checker & Generator", "cyber",
    "See how quickly a password could be cracked and what makes it weak, then generate a strong random one.",
    f"""  <div class="console">
    {PRIVACY}
    <h2 class="eyebrow" style="margin:14px 0 0">Check a password</h2>
    <label class="field" for="pw-input">Password</label>
    <input type="password" id="pw-input" autocomplete="off" spellcheck="false">
    <label class="check"><input type="checkbox" id="pw-show"> <span>Show password</span></label>
    <div id="pw-result" aria-live="polite"></div>
    <div class="buttons"><button class="btn-quiet" type="button" id="pw-breach">Check known breaches</button></div>
    <p class="note">The breach check is optional. It sends only the first 5 characters of the password's SHA-1 hash to the Have I Been Pwned service, which can't work out your password from that. The password itself never leaves this page.</p>
    <div id="pw-breach-out" aria-live="polite"></div>
  </div>
  <form class="console" id="gen-form" novalidate>
    <h2 class="eyebrow" style="margin:0">Generate a password</h2>
    <label class="field" for="gen-len">Length: <span id="gen-len-out">20</span> characters</label>
    <input type="range" id="gen-len" min="12" max="64" value="20">
    <div class="checks">
      <label class="check"><input type="checkbox" id="gen-upper" checked> <span>Capital letters</span></label>
      <label class="check"><input type="checkbox" id="gen-digits" checked> <span>Numbers</span></label>
      <label class="check"><input type="checkbox" id="gen-symbols" checked> <span>Symbols</span></label>
      <label class="check"><input type="checkbox" id="gen-simple"> <span>Easy to read (leave out l, I, O, 0 and 1)</span></label>
    </div>
    <label class="field" for="gen-out">Your new password</label>
    <div class="gen-row"><input id="gen-out" readonly spellcheck="false" aria-describedby="gen-strength"></div>
    <p class="muted" id="gen-strength"></p>
    <div class="buttons">
      <button class="btn" type="submit">Generate another</button>
      <button class="btn-quiet" type="button" id="gen-copy">Copy</button> <span id="gen-copied" class="muted" aria-live="polite"></span>
    </div>
    <p class="note">Use a password manager to store a different password for every account, and turn on two-step verification where you can.</p>
  </form>""",
    ["password-tool.js"],
    [("Identity, Endpoints & Infrastructure", "identity-endpoints-infrastructure")])

tool_page("file-hash.html", "File Hash Verifier", "cyber",
    "Software publishers list a checksum (a fingerprint) next to their downloads. Compare it with your copy to make sure the file is exactly the one they published.",
    f"""  <div class="console">
    {PRIVACY}
    <div class="dropzone" id="fh-drop">
      <label class="field" for="fh-file" style="margin-top:0">Choose or drop a file</label>
      <input type="file" id="fh-file">
      <p class="note">The file is read on your device and never uploaded.</p>
    </div>
    <label class="field" for="fh-expected">Checksum from the publisher (SHA-256, SHA-512 or SHA-1)</label>
    <input id="fh-expected" spellcheck="false" placeholder="Paste the long string of letters and numbers">
    <div class="result" id="fh-result" hidden aria-live="polite"></div>
    <h3>Or check from your computer's command line</h3>
    <ul>
      <li><strong>Windows (PowerShell):</strong> <code>Get-FileHash .\\file.exe -Algorithm SHA256</code></li>
      <li><strong>Mac:</strong> <code>shasum -a 256 file.dmg</code></li>
      <li><strong>Linux:</strong> <code>sha256sum file.iso</code></li>
    </ul>
    <p class="note">Only trust a checksum shown on the publisher's own website over HTTPS. A checksum next to a download on a third-party site proves nothing.</p>
  </div>""",
    ["file-hash.js"],
    [("Supply Chain, Privacy & Governance", "supply-chain-privacy-governance")])

def checklist_page(fname, name, cat, key, lede, related, extra=""):
    tool_page(fname, name, cat, lede, f"""  <div class="console">
    {PRIVACY_SAVED}
    <div data-checklist="{key}"></div>
  </div>{extra}""", ["checklists.js"] + (["loan-calc.js"] if key == "loan" else []), related)

checklist_page("id-check.html", "ID Request Check", "consumer", "idcheck",
    "Someone wants a photo of your driver's license, passport or a selfie. Tick what applies to find out whether it's safe to send.",
    [("Identity Document Upload Safety", "id-upload-safety"), ("Credit Freezes", "credit-freezes")])

checklist_page("skimmer-check.html", "Skimmer Check", "consumer", "skimmer",
    "Use this at the ATM or gas pump, before you insert your card.",
    [("ATM Fraud & Card Skimming", "atm-skimming")])

checklist_page("loan-check.html", "Loan Offer Check", "consumer", "loan",
    "Check a loan or credit offer for scam signs, then work out what it really costs.",
    [("Loan & Credit Offer Scams", "loan-credit-scams")],
    extra = """
  <form class="console" id="lc-form" novalidate>
    <h2 class="eyebrow" style="margin:0">Cost of an offer with an APR</h2>
    <div class="form-grid">
      <div><label class="field" for="lc-amount">Loan amount ($)</label><input type="number" id="lc-amount" name="amount" min="0" step="50" value="5000"></div>
      <div><label class="field" for="lc-apr">APR (%)</label><input type="number" id="lc-apr" name="apr" min="0" step="0.1" value="24"></div>
      <div><label class="field" for="lc-months">Length (months)</label><input type="number" id="lc-months" name="months" min="1" step="1" value="36"></div>
      <div><label class="field" for="lc-fee">Fee taken out of the loan ($)</label><input type="number" id="lc-fee" name="fee" min="0" step="10" value="0"></div>
    </div>
    <div id="lc-out" aria-live="polite"></div>
  </form>
  <form class="console" id="lc2-form" novalidate>
    <h2 class="eyebrow" style="margin:0">Find the true APR of an offer that only quotes payments</h2>
    <div class="form-grid">
      <div><label class="field" for="lc2-cash">Money you receive ($)</label><input type="number" id="lc2-cash" name="cash" min="0" step="10" value="500"></div>
      <div><label class="field" for="lc2-pay">Each payment ($)</label><input type="number" id="lc2-pay" name="pay" min="0" step="1" value="75"></div>
      <div><label class="field" for="lc2-count">Number of payments</label><input type="number" id="lc2-count" name="count" min="1" step="1" value="10"></div>
      <div><label class="field" for="lc2-every">Paid every</label><select id="lc2-every" name="every"><option value="biweekly">2 weeks</option><option value="weekly">Week</option><option value="monthly">Month</option></select></div>
    </div>
    <div id="lc2-out" aria-live="polite"></div>
    <p class="note">The example shows a typical installment payday loan. Results are estimates; your contract's disclosed APR is the legal figure.</p>
  </form>""")

checklist_page("tracker-check.html", "Unwanted Tracker Check", "surv", "tracker",
    "Worried someone is tracking your location through a hidden tracker, your phone or your accounts? Tick the signs, then work through the checks for your phone.",
    [("Wi-Fi & Bluetooth Tracking", "wifi-bluetooth"), ("Geofence Searches", "geofence")])

tool_page("photo-privacy.html", "Photo Location Remover", "surv",
    "Phone photos often hide the exact GPS location where they were taken, plus the camera and time. See what yours reveals and save a clean copy.",
    f"""  <div class="console">
    {PRIVACY}
    <div class="dropzone" id="ph-drop">
      <label class="field" for="ph-file" style="margin-top:0">Choose or drop a photo (JPEG or PNG)</label>
      <input type="file" id="ph-file" accept="image/jpeg,image/png,.jpg,.jpeg,.png,.heic,.heif">
      <p class="note">The photo is read on your device and never uploaded.</p>
    </div>
    <div class="result" id="ph-result" hidden aria-live="polite"></div>
    <h3>Stop new photos recording your location</h3>
    <ul>
      <li><strong>iPhone:</strong> Settings › Privacy &amp; Security › Location Services › Camera › Never. When sharing a photo, tap <em>Options</em> at the top of the share sheet and turn off <em>Location</em>.</li>
      <li><strong>Android:</strong> open the Camera app's settings and turn off <em>Location tags</em> (or <em>Save location</em>). Google Photos can also remove location when you share.</li>
    </ul>
  </div>""",
    ["photo-privacy.js"],
    [("Digital Forensics", "digital-forensics"), ("Geofence Searches", "geofence"), ("Identity Document Upload Safety", "id-upload-safety")])

tool_page("browser-exposure.html", "Browser Exposure Check", "surv",
    "Every website you visit can read these details about your device without asking. Together they form a fingerprint that can follow you across sites, even without cookies.",
    f"""  <div class="console">
    {PRIVACY}
    <div id="bx-result" aria-live="polite"><p class="muted">Reading what your browser shares…</p></div>
    <h3>How to share less</h3>
    <ul>
      <li>Use a browser with fingerprinting protection: Firefox (Enhanced Tracking Protection set to Strict), Brave, Safari, or Tor Browser for the strongest protection.</li>
      <li>Turn on Global Privacy Control. It tells sites not to sell or share your data, and some state privacy laws, including California's, require sites to honor it.</li>
      <li>Install fewer unusual fonts and extensions: every rare one makes you easier to single out.</li>
      <li>A VPN hides your IP address, but not anything on this page.</li>
    </ul>
  </div>""",
    ["browser-exposure.js"],
    [("Social Graph Analysis", "social-graph"), ("Wi-Fi & Bluetooth Tracking", "wifi-bluetooth")])

tool_page("code-word.html", "Family Code Word Setup", "surv",
    "AI can clone a voice from a short clip. Agree a secret code phrase with family so a panicked call asking for money can be checked in seconds.",
    f"""  <form class="console" id="cw-form" novalidate>
    <p class="privacy">Runs in your browser. Nothing is saved or sent.</p>
    <p class="field" id="cw-label">Your code phrase</p>
    <p class="stat mono" id="cw-phrase" aria-live="polite" aria-labelledby="cw-label" style="color:var(--accent)"></p>
    <div class="buttons"><button class="btn-quiet" type="button" id="cw-new">Pick a different phrase</button></div>
    <label class="field" for="cw-who">Who knows it (names, separated by commas)</label>
    <input id="cw-who" name="who" placeholder="e.g. Mom, Dad, Sam, Grandma">
    <label class="field" for="cw-out">Your plan</label>
    <textarea id="cw-out" class="output" readonly style="min-height:300px"></textarea>
    <div class="buttons"><button class="btn" type="button" id="cw-copy">Copy plan</button> <span id="cw-copied" class="muted" aria-live="polite"></span></div>
    <p class="note">Share the phrase in person or on a call, not by text or email. Pick a new one if you think someone else has heard it.</p>
  </form>""",
    ["code-word.js"],
    [("Voiceprint Recognition", "voiceprint")])

# ---- Homepage ----
groups = ""
for key, (cname, cpage) in CATS.items():
    items = [t for t in TOOL_LIST if t[2] == key]
    if not items:
        continue
    lis = "\n".join(f'      <li><a href="{f}">{html.escape(n)}</a></li>' for f, n, _, _ in items)
    groups += f'  <section aria-labelledby="t-{key}"><h2 id="t-{key}">{html.escape(cname)} tools</h2>\n    <ul>\n{lis}\n    </ul>\n  </section>\n'

shell("index.html", "Future Watch", f"""  <section class="home-intro">
    <p class="eyebrow">Scams · Security · Surveillance · Infrastructure</p>
    <h1>Future <span>Watch</span></h1>
    <p class="lede">Working tools to check scams, recover from fraud and protect your accounts, plus short sourced briefings on data centers, AI security and surveillance. Open a category above, or start with a tool.</p>
  </section>
  <div class="home-tools">
{groups}  </div>""", [], "Working tools and sourced briefings on scams, fraud, AI security, surveillance and data centers.")
print("tools:", len(TOOL_LIST))
