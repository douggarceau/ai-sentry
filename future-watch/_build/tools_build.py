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
