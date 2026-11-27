import html, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent

HEADER = """<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="bar">
    <a class="brand" href="index.html">FUTURE WATCH</a>
    <nav id="site-menu" aria-label="Topics">
      <noscript>
        <ul class="menu">
          <li><a href="data-centers.html">DATA CENTERS</a></li>
          <li><a href="consumer-financial-security.html">CONSUMER FINANCIAL SECURITY</a></li>
          <li><a href="ai-cybersecurity.html">AI CYBERSECURITY</a></li>
          <li><a href="ai-surveillance-tracking.html">AI SURVEILLANCE &amp; TRACKING</a></li>
        </ul>
      </noscript>
    </nav>
  </div>
</header>"""


FONTS = """<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@500;700&display=swap">
<link rel="stylesheet" href="styles.css">"""

# Tools linked from topic sections: section id -> [(tool name, page)]
TOOLS = {
    "bank-impersonation": [("Scam Message Checker", "scam-checker.html"), ("Email Header Analyzer", "email-headers.html")],
    "wire-zelle-fraud": [("Scam Message Checker", "scam-checker.html"), ("Fraud Response Plan", "response-plan.html")],
    "merchant-scams": [("Scam Message Checker", "scam-checker.html")],
    "loan-credit-scams": [("Scam Message Checker", "scam-checker.html")],
    "account-takeover": [("Fraud Response Plan", "response-plan.html"), ("Password Checker & Generator", "password-tool.html"), ("Email Header Analyzer", "email-headers.html")],
    "online-card-fraud": [("Fraud Response Plan", "response-plan.html")],
    "account-recovery": [("Fraud Response Plan", "response-plan.html")],
    "atm-skimming": [("Fraud Response Plan", "response-plan.html")],
    "credit-freezes": [("Credit Freeze Tracker", "freeze-tracker.html")],
    "subscriptions-hidden-fees": [("Subscription & Fee Tracker", "subscriptions.html")],
    "detection-response": [("Email Header Analyzer", "email-headers.html")],
    "identity-endpoints-infrastructure": [("Password Checker & Generator", "password-tool.html")],
    "vulnerability-testing": [("Prompt-Injection Scanner", "injection-scanner.html")],
    "supply-chain-privacy-governance": [("File Hash Verifier", "file-hash.html")],
}

def links(pairs):
    return "\n".join(
        f'      <li><a href="{html.escape(u)}" rel="noopener" target="_blank">{html.escape(t)}</a></li>'
        for t, u in pairs
    )


def section(t):
    body = "\n".join(f"    <p>{p}</p>" for p in t["paras"])
    out = [f'  <section class="topic" id="{t["id"]}" aria-labelledby="{t["id"]}-h">',
           f'    <h2 id="{t["id"]}-h">{html.escape(t["title"])}</h2>', body]
    if TOOLS.get(t["id"]):
        out.append('    <div class="action tool-link">\n    <h3>Use the tool</h3>\n    <ul>\n'
                   + "\n".join(f'      <li><a href="{u}">{html.escape(n)}</a></li>' for n, u in TOOLS[t["id"]]) + "\n    </ul>\n    </div>")
    if t.get("action"):
        out.append('    <div class="action">\n    <h3>Take action</h3>\n    <ul>\n'
                   + links(t["action"]) + "\n    </ul>\n    </div>")
    out.append("    <h3>Sources</h3>\n    <ul>\n" + links(t["sources"]) + "\n    </ul>")
    out.append('    <a class="top" href="#main">Back to top</a>\n  </section>')
    return "\n".join(out)


def page(fname, title, lede, topics):
    toc = "\n".join(f'    <li><a href="#{t["id"]}">{html.escape(t["title"])}</a></li>' for t in topics)
    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title.title())} · Future Watch</title>
<meta name="description" content="{html.escape(lede)}">
{FONTS}
</head>
<body>
{HEADER}
<main id="main">
  <p class="crumb"><a href="index.html">Home</a> / {html.escape(title)}</p>
  <h1>{html.escape(title)}</h1>
  <p class="lede">{html.escape(lede)}</p>
  <ul class="toc" aria-label="On this page">
{toc}
  </ul>
{chr(10).join(section(t) for t in topics)}
</main>
<footer>
  <p>Future Watch summarizes published sources. Figures are as reported by the cited source on its publication date; follow the source links for current details. External links open in a new tab.</p>
</footer>
<script src="menu.js"></script>
</body>
</html>
"""
    (OUT / fname).write_text(doc)


# Shared official resources
REPORTFRAUD = ("FTC: ReportFraud.ftc.gov (report a scam or fraud)", "https://reportfraud.ftc.gov/")
IC3 = ("FBI Internet Crime Complaint Center (IC3): file a complaint", "https://www.ic3.gov/")
CFPB_COMPLAINT = ("CFPB: submit a complaint about a bank, card or lender", "https://www.consumerfinance.gov/complaint/")
IDTHEFT = ("IdentityTheft.gov: report identity theft and get a recovery plan (FTC)", "https://www.identitytheft.gov/")
FTC_DATA_2024 = ("FTC press release: new data show a big jump in reported losses to fraud, $12.5 billion in 2024 (March 2025)",
                 "https://www.ftc.gov/news-events/news/press-releases/2025/03/new-ftc-data-show-big-jump-reported-losses-fraud-125-billion-2024")
LBNL_2024 = ("Lawrence Berkeley National Laboratory: 2024 United States Data Center Energy Usage Report",
             "https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report")
DOE_LBNL = ("U.S. Department of Energy: DOE releases new report evaluating increase in electricity demand from data centers (Dec. 2024)",
            "https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers")
IEA_AI = ("International Energy Agency: Energy and AI (2025)", "https://www.iea.org/reports/energy-and-ai")
JLARC = ("Virginia Joint Legislative Audit and Review Commission: Data Centers in Virginia (2024)",
         "https://jlarc.virginia.gov/landing-2024-data-centers-in-virginia.asp")
QUEUED = ("Lawrence Berkeley National Laboratory: Queued Up, grid interconnection queue data", "https://emp.lbl.gov/queues")
ATLAS = ("Electronic Frontier Foundation: Atlas of Surveillance (database of U.S. police surveillance technology)",
         "https://atlasofsurveillance.org/")
EU_AI_ACT = ("EU Artificial Intelligence Act, Regulation (EU) 2024/1689 (official text)", "https://eur-lex.europa.eu/eli/reg/2024/1689/oj")
CARPENTER = ("Carpenter v. United States, 585 U.S. 296 (2018), opinion", "https://supreme.justia.com/cases/federal/us/585/16-402/")

data_centers = [
    dict(id="grid-substations", title="Grid & Substations", paras=[
        "U.S. data centers used about 176 terawatt-hours of electricity in 2023, roughly 4.4% of national consumption, and the Department of Energy's December 2024 report projects 6.7% to 12% by 2028, depending on how fast AI servers are deployed.",
        "Large campuses draw hundreds of megawatts, so they usually connect at transmission voltage through a dedicated substation built by the utility or the developer. Load growth on that scale has pushed utilities and grid operators to revise their load forecasts and to write new tariffs and interconnection rules for very large customers.",
        "New generation to serve that load waits in interconnection queues; Berkeley Lab tracks how long projects wait and how many are withdrawn.",
    ], sources=[LBNL_2024, DOE_LBNL, QUEUED]),
    dict(id="cooling-water", title="Cooling & Water", paras=[
        "Nearly all electricity a server uses becomes heat, so cooling is the largest non-IT energy load in most facilities. Efficiency is commonly reported as Power Usage Effectiveness (PUE): total facility energy divided by IT energy, where 1.0 is the ideal.",
        "Water use depends on the cooling design. Evaporative cooling towers and adiabatic systems consume water on site; closed-loop chillers and dry coolers use little water but more electricity. Berkeley Lab estimated that U.S. data centers directly consumed about 17 billion gallons of water in 2023, and that indirect water use at the power plants supplying them is several times larger.",
        "High-density AI racks are moving operators from air cooling toward direct-to-chip liquid cooling and immersion cooling, which remove heat more efficiently at the rack.",
    ], sources=[LBNL_2024,
                ("Environmental and Energy Study Institute: Data Centers and Water Consumption", "https://www.eesi.org/articles/view/data-centers-and-water-consumption")]),
    dict(id="owners-operators", title="Owners & Operators", paras=[
        "Three ownership models dominate. Hyperscalers such as Amazon, Microsoft, Google and Meta build and run their own campuses. Colocation and wholesale providers, many organized as real estate investment trusts such as Equinix and Digital Realty, own buildings and lease space, power and connectivity to tenants. Specialized GPU cloud providers such as CoreWeave lease or build capacity for AI workloads.",
        "Public operators disclose their portfolios, capacity under construction, major customers and risk factors in annual 10-K reports and IPO registration statements filed with the U.S. Securities and Exchange Commission.",
    ], sources=[
        ("SEC EDGAR: Equinix filings", "https://www.sec.gov/cgi-bin/browse-edgar?company=equinix&type=10-K&dateb=&owner=include&count=40"),
        ("SEC EDGAR: Digital Realty Trust filings", "https://www.sec.gov/cgi-bin/browse-edgar?company=digital+realty&type=10-K&dateb=&owner=include&count=40"),
        ("SEC EDGAR: CoreWeave filings", "https://www.sec.gov/cgi-bin/browse-edgar?company=coreweave&type=&dateb=&owner=include&count=40"),
        LBNL_2024]),
    dict(id="ai-cloud-tenants", title="AI & Cloud Tenants", paras=[
        "The largest tenants are cloud platforms and AI model developers. OpenAI, SoftBank, Oracle and MGX announced the Stargate project in January 2025, describing plans to invest up to $500 billion in U.S. AI infrastructure over four years, starting with a campus in Abilene, Texas.",
        "Microsoft said in January 2025 that it expected to spend about $80 billion in fiscal 2025 on AI-enabled data centers. CoreWeave's 2025 IPO filing reported that Microsoft accounted for 62% of its 2024 revenue, showing how concentrated AI tenancy can be.",
    ], sources=[
        ("OpenAI: Announcing The Stargate Project (Jan. 2025)", "https://openai.com/index/announcing-the-stargate-project/"),
        ("Microsoft On the Issues: The Golden Opportunity for American AI (Jan. 2025)", "https://blogs.microsoft.com/on-the-issues/2025/01/03/the-golden-opportunity-for-american-ai/"),
        ("SEC EDGAR: CoreWeave filings, including the Form S-1", "https://www.sec.gov/cgi-bin/browse-edgar?company=coreweave&type=S-1&dateb=&owner=include&count=40")]),
    dict(id="size-capacity", title="Size & Capacity", paras=[
        "Data centers are sized by power, in megawatts of IT load or of utility supply, more than by floor area. A traditional enterprise facility may draw a few megawatts; hyperscale and AI campuses are planned at hundreds of megawatts to more than a gigawatt.",
        "The International Energy Agency estimates data centers used about 415 TWh worldwide in 2024, around 1.5% of global electricity, and projects about 945 TWh by 2030 in its base case, with the United States the largest share. Berkeley Lab puts U.S. use at 176 TWh in 2023 and projects 325 to 580 TWh by 2028.",
    ], sources=[IEA_AI, LBNL_2024, DOE_LBNL]),
    dict(id="permits-zoning", title="Permits & Zoning", paras=[
        "Most siting decisions are local. Counties and cities decide whether data centers are allowed by right or only with a special exception or rezoning, and set rules on setbacks, noise, building height and screening. Virginia's JLARC study reviewed how local land-use rules, noise and transmission line routing have shaped community concerns in Northern Virginia.",
        "State air agencies permit the diesel backup generators most campuses install, and utilities and state commissions approve the transmission lines and substations that serve them. A July 23, 2025 executive order directed federal agencies to speed permitting for qualifying data center projects and supporting energy infrastructure, including on federal land.",
    ], sources=[JLARC,
                ("The White House: Accelerating Federal Permitting of Data Center Infrastructure (Executive Order, July 23, 2025)",
                 "https://www.whitehouse.gov/presidential-actions/2025/07/accelerating-federal-permitting-of-data-center-infrastructure/"),
                ("U.S. EPA: Stationary engines (NESHAP and NSPS rules covering backup generators)",
                 "https://www.epa.gov/stationary-engines")]),
    dict(id="financing-tax-land", title="Financing, Tax Incentives & Land", paras=[
        "Many states exempt data center equipment and electricity from sales and use tax, often tied to minimum investment and job thresholds. JLARC found Virginia's exemption is the state's largest economic development incentive by forgone revenue, and estimated that the industry still produced net positive economic effects for the state.",
        "Projects are financed through corporate balance sheets, REIT debt and equity, construction loans, joint ventures with private equity and infrastructure funds, and securitizations backed by lease payments. Land near high-voltage transmission and fiber routes is the scarcest input, and sites with existing power capacity command higher prices.",
    ], sources=[JLARC,
                ("Virginia Economic Development Partnership: Data center sales and use tax exemption", "https://www.vedp.org/incentive/data-center-sales-use-tax-exemption")]),
    dict(id="construction-delays", title="Construction, Contractors & Delays", paras=[
        "A campus involves general contractors, electrical and mechanical subcontractors, utility crews and equipment makers for transformers, switchgear, generators, UPS systems and chillers. The Census Bureau tracks the monthly value of data center construction put in place as a category of private nonresidential construction.",
        "The most common causes of delay are waiting for utility power and interconnection, long lead times for large power transformers and switchgear, and shortages of skilled electricians. Local permitting disputes and lawsuits can also delay or stop projects.",
    ], sources=[("U.S. Census Bureau: Construction Spending (value put in place)", "https://www.census.gov/construction/c30/c30index.html"),
                QUEUED, DOE_LBNL]),
    dict(id="jobs-training-hiring", title="Jobs, Training & Hiring", paras=[
        "Employment peaks during construction, when a large campus can employ hundreds to thousands of trade workers. Once operating, a facility needs far fewer people: technicians, electricians, mechanical engineers, security staff and network engineers.",
        "The trades in heaviest demand are electricians, HVAC and controls technicians and pipefitters. Registered apprenticeships pay wages while you train; the U.S. Department of Labor's finder lists openings by trade and location.",
    ], action=[("Apprenticeship.gov: find a registered apprenticeship (U.S. Department of Labor)", "https://www.apprenticeship.gov/apprenticeship-job-finder"),
               ("CareerOneStop: find local training programs (U.S. Department of Labor)", "https://www.careeronestop.org/FindTraining/find-training.aspx")],
       sources=[("U.S. Bureau of Labor Statistics: Occupational Outlook Handbook, Electricians", "https://www.bls.gov/ooh/construction-and-extraction/electricians.htm"),
                ("U.S. Bureau of Labor Statistics: Occupational Outlook Handbook, HVAC mechanics and installers", "https://www.bls.gov/ooh/installation-maintenance-and-repair/heating-air-conditioning-and-refrigeration-mechanics-and-installers.htm"),
                JLARC]),
    dict(id="outages-backup-reliability", title="Outages, Backup Power & Reliability", paras=[
        "Facilities protect against utility failures with uninterruptible power supplies (batteries) that carry the load for seconds to minutes, and on-site generators, usually diesel, that start within seconds and run for hours or days. Redundancy is often described with the Uptime Institute's Tier I to IV classification.",
        "Uptime Institute's annual outage surveys find power problems are the most common cause of serious outages. Backup generators are regulated as stationary engines under federal air rules, which limit how many hours they may run for testing and non-emergency use.",
    ], sources=[("Uptime Institute: research and reports, including the Annual Outage Analysis", "https://uptimeinstitute.com/resources/research-and-reports"),
                ("Uptime Institute: Tier Classification System", "https://uptimeinstitute.com/tiers"),
                ("U.S. EPA: Stationary engines (NESHAP and NSPS rules covering backup generators)", "https://www.epa.gov/stationary-engines")]),
]

consumer = [
    dict(id="account-takeover", title="Bank & Credit Card Account Takeover", paras=[
        "In an account takeover, a criminal gets your login, often through a phishing text or email, a fake sign-in page, a reused password from a breach, or a SIM swap that moves your phone number to their device, and then changes your contact details, adds payees or orders cards.",
        "Defenses: use a unique password for each financial account, turn on multi-factor authentication (an authenticator app or passkey is stronger than text codes), add a PIN or port-out lock with your mobile carrier, and turn on transaction alerts. If you see changes you did not make, call the number on the back of your card and ask the bank to lock the account.",
    ], action=[IDTHEFT, CFPB_COMPLAINT],
       sources=[("FTC Consumer Advice: How to recognize and avoid phishing scams", "https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams"),
                ("CISA: More than a password (multi-factor authentication)", "https://www.cisa.gov/MFA")]),
    dict(id="online-card-fraud", title="Online Card Fraud", paras=[
        "Stolen card numbers are used for card-not-present purchases online. Under the Fair Credit Billing Act, your liability for unauthorized credit card charges is capped at $50, and major networks offer $0 liability policies. Debit cards are covered by the Electronic Fund Transfer Act, where your liability depends on how quickly you report.",
        "Report unauthorized charges to the card issuer immediately and dispute billing errors in writing within 60 days of the statement. Using virtual card numbers or a digital wallet limits exposure because the merchant never stores your real number.",
    ], action=[REPORTFRAUD, CFPB_COMPLAINT],
       sources=[("FTC Consumer Advice: Using credit cards and disputing charges", "https://consumer.ftc.gov/articles/using-credit-cards-and-disputing-charges"),
                ("FTC Consumer Advice: Lost or stolen credit, ATM, and debit cards", "https://consumer.ftc.gov/articles/lost-or-stolen-credit-atm-and-debit-cards")]),
    dict(id="merchant-scams", title="Merchant Scams", paras=[
        "Fake online stores, often promoted through social media ads, take payment and then ship nothing, ship counterfeits, or vanish. Warning signs include prices far below market, a recently created site, no verifiable physical address or phone number, and requests to pay by wire, gift card, payment app or cryptocurrency.",
        "Pay with a credit card, which carries dispute rights, and research the seller and the exact web address before buying. If you paid a scammer, contact the payment provider right away and report it.",
    ], action=[REPORTFRAUD],
       sources=[("FTC Consumer Advice: Online shopping", "https://consumer.ftc.gov/articles/online-shopping"),
                ("FTC Consumer Advice: What to do if you were scammed", "https://consumer.ftc.gov/articles/what-do-if-you-were-scammed")]),
    dict(id="subscriptions-hidden-fees", title="Subscriptions & Hidden Fees", paras=[
        "The Restore Online Shoppers' Confidence Act (ROSCA) requires online sellers to disclose material terms, get express consent before charging, and provide a simple way to stop recurring charges. The FTC finalized a broader \"click-to-cancel\" rule in October 2024, but a federal appeals court vacated it in July 2025, so ROSCA and state auto-renewal laws remain the main protections.",
        "The FTC's rule on unfair or deceptive fees took effect on May 12, 2025, and requires the total price, including mandatory fees, to be shown up front for live-event tickets and short-term lodging. Review statements monthly for charges you do not recognize and cancel in writing or through the seller's account settings, keeping confirmation.",
    ], action=[REPORTFRAUD, CFPB_COMPLAINT],
       sources=[("eCFR: 16 CFR Part 464, Rule on Unfair or Deceptive Fees", "https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-464"),
                ("Restore Online Shoppers' Confidence Act, 15 U.S.C. 8403 (negative option rules), Cornell LII", "https://www.law.cornell.edu/uscode/text/15/8403")]),
    dict(id="wire-zelle-fraud", title="Wire Transfer & Zelle Fraud", paras=[
        "Bank wires and instant payment apps such as Zelle move money in minutes and are hard to reverse. Scammers exploit this by posing as your bank's fraud department, a utility, a romantic partner, a seller, or a title company sending changed closing instructions. FTC data for 2024 show bank transfers and payments were among the methods with the highest reported losses.",
        "Only send instant payments to people you know. Verify any change in payment instructions by calling a number you already have, not one in the message. If you sent money to a scammer, call your bank or the app immediately and ask for a recall, then file reports with the FBI and FTC.",
    ], action=[IC3, REPORTFRAUD, CFPB_COMPLAINT],
       sources=[FTC_DATA_2024,
                ("FTC Consumer Advice: What to do if you were scammed", "https://consumer.ftc.gov/articles/what-do-if-you-were-scammed"),
                ("FBI: Business email compromise", "https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-scams-and-crimes/business-email-compromise")]),
    dict(id="bank-impersonation", title="Bank Impersonation", paras=[
        "Impostors call, text or email pretending to be your bank's fraud team, often spoofing the bank's real phone number, and pressure you to \"protect\" your money by moving it, reading back a one-time code, or handing your card to a courier. Consumers reported $2.95 billion lost to imposter scams in 2024, according to the FTC.",
        "Your bank will not ask you to move money to a safe account or to share a verification code. Hang up and call the number on the back of your card. The FTC's Government and Business Impersonation Rule, in effect since April 2024, lets the agency seek money back from impersonators in court.",
    ], action=[REPORTFRAUD],
       sources=[FTC_DATA_2024,
                ("FTC Consumer Advice: Imposter scams", "https://consumer.ftc.gov/features/imposter-scams")]),
    dict(id="credit-freezes", title="Credit Freezes", paras=[
        "A credit freeze stops lenders from pulling your credit report, which blocks most new-account fraud. Freezes are free by federal law since September 21, 2018, do not affect your credit score, and can be lifted temporarily when you apply for credit. You must place a freeze separately with each of the three nationwide bureaus. Parents and guardians can also freeze a child's credit.",
    ], action=[("Equifax: place or lift a credit freeze", "https://www.equifax.com/personal/credit-report-services/credit-freeze/"),
               ("Experian: Freeze Center", "https://www.experian.com/freeze/center.html"),
               ("TransUnion: credit freeze", "https://www.transunion.com/credit-freeze"),
               ("AnnualCreditReport.com: free credit reports from all three bureaus", "https://www.annualcreditreport.com/")],
       sources=[("FTC Consumer Advice: Credit freezes and fraud alerts", "https://consumer.ftc.gov/articles/what-know-about-credit-freezes-fraud-alerts")]),
    dict(id="id-upload-safety", title="Identity Document Upload Safety", paras=[
        "Banks, employers, rental platforms and government services increasingly ask for a photo of your driver's license or passport and a selfie. Scammers copy this step with fake verification links, fake job onboarding, and rental listings that ask for ID to collect documents they can use to open accounts.",
        "Upload ID only through an app or website you opened yourself, never through a link in an unexpected text, email or chat, and never send ID images by email or messaging. Ask why the document is needed and how long it will be kept. If your ID was exposed, report it and consider a credit freeze.",
    ], action=[IDTHEFT],
       sources=[("FTC Consumer Advice: What to know about identity theft", "https://consumer.ftc.gov/articles/what-know-about-identity-theft"),
                ("FTC Consumer Advice: Job scams", "https://consumer.ftc.gov/articles/job-scams"),
                ("CISA: Secure Our World", "https://www.cisa.gov/secure-our-world")]),
    dict(id="loan-credit-scams", title="Loan & Credit Offer Scams", paras=[
        "Advance-fee loan scams promise guaranteed approval regardless of credit, then demand an upfront \"insurance,\" \"processing\" or \"first payment\" fee and disappear. Legitimate lenders do not guarantee a loan before reviewing your application. Credit repair companies may not charge before performing services under the Credit Repair Organizations Act.",
        "Lenders and loan brokers must be licensed in most states; you can look them up in the NMLS Consumer Access database run by state regulators before applying.",
    ], action=[("NMLS Consumer Access: check that a lender or broker is licensed", "https://www.nmlsconsumeraccess.org/"),
               REPORTFRAUD, CFPB_COMPLAINT],
       sources=[("Credit Repair Organizations Act, 15 U.S.C. 1679b (prohibited practices, including advance payment), Cornell LII", "https://www.law.cornell.edu/uscode/text/15/1679b"),
                ("FTC Consumer Advice: Fixing your credit FAQs", "https://consumer.ftc.gov/articles/fixing-your-credit-faqs")]),
    dict(id="account-recovery", title="Account Recovery", paras=[
        "If a financial or email account has been taken over: call the institution using the number on your card or statement, ask them to lock the account and reverse unauthorized transactions, change the password from a device you trust, and remove any forwarding rules, recovery phone numbers or linked devices you did not add.",
        "Secure your email first, because it resets everything else. Then use IdentityTheft.gov to report the theft and get a personalized recovery plan with pre-filled letters for creditors and the credit bureaus.",
    ], action=[IDTHEFT,
               ("FTC Consumer Advice: How to recover your hacked email or social media account", "https://consumer.ftc.gov/articles/how-recover-your-hacked-email-or-social-media-account")],
       sources=[("FTC Consumer Advice: What to know about identity theft", "https://consumer.ftc.gov/articles/what-know-about-identity-theft")]),
    dict(id="atm-skimming", title="ATM Fraud & Card Skimming", paras=[
        "Skimmers are devices placed over or inside ATM and fuel pump card readers to copy card data, often paired with a hidden camera or keypad overlay to capture PINs. Cover the keypad when entering your PIN, use tap-to-pay or chip where available, and prefer ATMs inside bank branches.",
        "Under the Electronic Fund Transfer Act and Regulation E, your liability for unauthorized debit or ATM transactions is limited to $50 if you report a lost or stolen card within two business days, up to $500 if later, and can be unlimited if you do not report within 60 days after your statement is sent.",
    ], action=[REPORTFRAUD, CFPB_COMPLAINT],
       sources=[("FBI: Skimming", "https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-scams-and-crimes/skimming"),
                ("FTC Consumer Advice: Lost or stolen credit, ATM, and debit cards", "https://consumer.ftc.gov/articles/lost-or-stolen-credit-atm-and-debit-cards"),
                ("CFPB: Regulation E, 12 CFR 1005.6 (liability of consumer for unauthorized transfers)", "https://www.consumerfinance.gov/rules-policy/regulations/1005/6/")]),
]

cyber = [
    dict(id="detection-response", title="Threat Detection & Incident Response", paras=[
        "Security teams use machine learning to sort large volumes of logs and alerts, flag anomalous behavior such as impossible-travel logins or unusual data transfers, and summarize incidents for analysts. These tools assist human responders; detections still need tuning, validation and clear escalation paths.",
        "NIST's incident response guidance (SP 800-61 Revision 3, April 2025) ties response to the six functions of the Cybersecurity Framework 2.0. MITRE ATLAS catalogs real-world tactics used against AI systems themselves, so defenders can add detections for them.",
    ], action=[("CISA: report a cyber incident", "https://www.cisa.gov/report"), IC3],
       sources=[("NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management", "https://csrc.nist.gov/pubs/sp/800/61/r3/final"),
                ("NIST Cybersecurity Framework 2.0", "https://www.nist.gov/cyberframework"),
                ("MITRE ATLAS: Adversarial Threat Landscape for AI Systems", "https://atlas.mitre.org/")]),
    dict(id="identity-endpoints-infrastructure", title="Identity, Endpoints & Infrastructure", paras=[
        "Attackers increasingly log in rather than break in, using stolen credentials, session tokens and phishing that AI makes more convincing. Zero trust architecture (NIST SP 800-207) treats every request as untrusted until the user, device and context are verified.",
        "Practical controls: phishing-resistant multi-factor authentication such as FIDO2 security keys and passkeys, endpoint detection and response on laptops and servers, least-privilege access for people and for AI agents and service accounts, and prompt patching of internet-facing systems.",
    ], sources=[("NIST SP 800-207: Zero Trust Architecture", "https://csrc.nist.gov/pubs/sp/800/207/final"),
                ("CISA: Zero Trust Maturity Model", "https://www.cisa.gov/zero-trust-maturity-model"),
                ("CISA: More than a password (multi-factor authentication)", "https://www.cisa.gov/MFA")]),
    dict(id="vulnerability-testing", title="Vulnerability Management & Security Testing", paras=[
        "CISA's Known Exploited Vulnerabilities catalog lists flaws attackers are actively using, and is the most practical list to patch from first. AI is now used to find bugs: Google's Big Sleep agent reported a previously unknown exploitable flaw in SQLite in 2024, and DARPA's AI Cyber Challenge had teams build systems that find and fix vulnerabilities in open-source code.",
        "AI applications need their own testing for prompt injection, insecure output handling and excessive agent permissions; the OWASP Top 10 for Large Language Model Applications is the common checklist. Test only systems you own or are authorized to assess.",
    ], sources=[("CISA: Known Exploited Vulnerabilities Catalog", "https://www.cisa.gov/known-exploited-vulnerabilities-catalog"),
                ("OWASP Top 10 for Large Language Model Applications", "https://genai.owasp.org/llm-top-10/"),
                ("Google Project Zero: From Naptime to Big Sleep (Oct. 2024)", "https://googleprojectzero.blogspot.com/2024/10/from-naptime-to-big-sleep.html"),
                ("DARPA AI Cyber Challenge (AIxCC)", "https://aicyberchallenge.com/")]),
    dict(id="supply-chain-privacy-governance", title="Supply Chain, Privacy & Governance", paras=[
        "AI systems depend on third-party models, datasets, libraries and plugins, each of which can be tampered with. Software supply-chain practices such as NIST's Secure Software Development Framework, software bills of materials and SLSA build provenance apply to models and their dependencies as well.",
        "For governance, the NIST AI Risk Management Framework gives a voluntary structure (Govern, Map, Measure, Manage), and the EU AI Act sets binding obligations in the EU that phase in from 2025 to 2027. Privacy risks include training on personal data and models leaking sensitive information they were given.",
    ], sources=[("NIST AI Risk Management Framework", "https://www.nist.gov/itl/ai-risk-management-framework"),
                ("NIST SP 800-218: Secure Software Development Framework", "https://csrc.nist.gov/pubs/sp/800/218/final"),
                ("SLSA: Supply-chain Levels for Software Artifacts", "https://slsa.dev/"),
                EU_AI_ACT]),
]

surveillance = [
    dict(id="wifi-bluetooth", title="Wi-Fi & Bluetooth Tracking", paras=[
        "Phones, watches, cars and earbuds broadcast Wi-Fi and Bluetooth signals with device identifiers. Retailers, airports and some cities have used sensors that log these signals to count and follow devices; modern phones randomize their Wi-Fi MAC addresses to limit this.",
        "Small Bluetooth item trackers can be misused to follow people. In May 2024 Apple and Google shipped a cross-platform standard that alerts iPhone and Android users when an unknown tracker is moving with them. EFF's Atlas of Surveillance documents police use of related tools, such as cell-site simulators.",
    ], sources=[("Apple Newsroom: Apple and Google deliver support for unwanted tracking alerts in iOS and Android (May 2024)",
                 "https://www.apple.com/newsroom/2024/05/apple-and-google-deliver-support-for-unwanted-tracking-alerts-in-ios-and-android/"),
                ("IETF DULT working group: Detecting Unwanted Location Trackers", "https://datatracker.ietf.org/wg/dult/about/"),
                ATLAS]),
    dict(id="thermal-night-vision", title="Thermal Imaging & Night Vision", paras=[
        "Thermal cameras detect infrared heat rather than visible light, and are used on police helicopters, drones and border sensors to find people in darkness or cover. Software can now classify and track heat signatures automatically.",
        "In Kyllo v. United States (2001), the Supreme Court held that using a thermal imager on a home to detect heat inside, with technology not in general public use, is a Fourth Amendment search that generally requires a warrant.",
    ], sources=[("Kyllo v. United States, 533 U.S. 27 (2001), opinion", "https://supreme.justia.com/cases/federal/us/533/27/"),
                ATLAS]),
    dict(id="acoustic-sensors", title="Acoustic Sensors", paras=[
        "Gunshot detection systems such as ShotSpotter (from SoundThinking) use networks of microphones and software to identify likely gunfire and send alerts to police. EFF's Atlas of Surveillance lists more than 100 U.S. jurisdictions that have used acoustic gunshot detection.",
        "A 2021 Chicago Office of Inspector General review found that most ShotSpotter alerts it studied did not lead to evidence of a gun-related crime. Chicago ended its contract in September 2024. Effectiveness and alert accuracy remain disputed between the vendor and independent researchers.",
    ], sources=[("City of Chicago Office of Inspector General: ShotSpotter reports (site search)",
                 "https://igchicago.org/?s=ShotSpotter"),
                ("EFF Street-Level Surveillance: Gunshot detection", "https://sls.eff.org/technologies/gunshot-detection"),
                ATLAS]),
    dict(id="voiceprint", title="Voiceprint Recognition", paras=[
        "Speaker recognition systems turn a voice into a mathematical template that can be matched against stored recordings. Banks use it for caller authentication; prisons and investigators have used it to identify speakers on calls. AI voice cloning now challenges voice-based authentication.",
        "Illinois' Biometric Information Privacy Act lists voiceprints as biometric identifiers that require written notice and consent before collection. NIST runs Speaker Recognition Evaluations that measure system accuracy.",
    ], sources=[("Illinois Biometric Information Privacy Act, 740 ILCS 14", "https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004&ChapterID=57"),
                ("NIST: Speaker Recognition evaluations", "https://www.nist.gov/itl/iad/mig/speaker-recognition"),
                ("FTC: Voice Cloning Challenge", "https://www.ftc.gov/news-events/contests/ftc-voice-cloning-challenge")]),
    dict(id="gait", title="Gait Recognition", paras=[
        "Gait recognition identifies people by how they walk, using body shape and movement in video. It can work at a distance and without a clear view of the face, which is why it is marketed for surveillance, but accuracy drops with changes in clothing, footwear, camera angle and walking surface.",
        "GAO has reviewed gait among other biometric technologies and noted gaps in accuracy data. Under the EU AI Act, real-time remote biometric identification in public spaces by police is prohibited except in narrow cases, and other remote biometric identification systems are classified as high-risk.",
    ], sources=[("U.S. GAO: Biometric Identification Technologies report (search on gao.gov)",
                 "https://www.gao.gov/search?keyword=%22Biometric%20Identification%20Technologies%22"),
                EU_AI_ACT]),
    dict(id="iris-fingerprint", title="Iris & Fingerprint Matching", paras=[
        "The FBI's Next Generation Identification (NGI) system holds fingerprints, palm prints, iris images and face photos and returns matches to authorized law enforcement and background-check users. DHS's biometric system stores records collected at borders and in immigration processing.",
        "NIST independently tests fingerprint and iris matching algorithms. Matches are probabilistic and are supposed to be reviewed by trained examiners; known misidentifications, such as the FBI's 2004 erroneous fingerprint match of Oregon attorney Brandon Mayfield, led to changes in examiner procedures.",
    ], sources=[("U.S. GAO-16-267: Face Recognition Technology, FBI should better ensure privacy and accuracy (describes the NGI system)", "https://www.gao.gov/products/gao-16-267"),
                ("NIST: Iris Exchange (IREX) program", "https://www.nist.gov/programs-projects/iris-exchange-irex-overview"),
                ("U.S. DOJ Office of the Inspector General: review of the FBI's handling of the Brandon Mayfield case (2006)", "https://oig.justice.gov/special/s0601/final.pdf")]),
    dict(id="digital-forensics", title="Digital Forensics", paras=[
        "Mobile device forensic tools from vendors such as Cellebrite and Magnet Forensics can extract messages, photos, location history and deleted data from phones, and AI features now sort and flag that content. Upturn's 2020 investigation found more than 2,000 U.S. law enforcement agencies had purchased such tools.",
        "In Riley v. California (2014), the Supreme Court held that police generally need a warrant to search a phone seized during an arrest. NIST's Computer Forensics Tool Testing program publishes test results on forensic tools.",
    ], sources=[("Riley v. California, 573 U.S. 373 (2014), opinion", "https://supreme.justia.com/cases/federal/us/573/373/"),
                ("Upturn: Mass Extraction (2020)", "https://www.upturn.org/work/mass-extraction/"),
                ("NIST: Computer Forensics Tool Testing Program", "https://www.nist.gov/itl/ssd/software-quality-group/computer-forensics-tool-testing-program-cftt")]),
    dict(id="geofence", title="Geofence Searches", paras=[
        "A geofence warrant asks a company for every device located within a defined area during a time window, rather than naming a suspect. Google received most such requests because of its Location History data; in December 2023 it announced it would store Location History on users' devices, limiting its ability to respond.",
        "Courts are split. In August 2024 the Fifth Circuit, in United States v. Smith, held geofence warrants unconstitutional general warrants, while the Fourth Circuit took a different view in United States v. Chatrie. Carpenter v. United States (2018) established that police generally need a warrant for historical cell-site location records.",
    ], sources=[("Google: Updates to Location History and new controls coming soon to Maps (Dec. 2023)",
                 "https://blog.google/products/maps/updates-to-location-history-and-new-controls-coming-soon-to-maps/"),
                ("U.S. Court of Appeals for the Fifth Circuit: United States v. Smith, No. 23-60321 (Aug. 2024)", "https://www.ca5.uscourts.gov/opinions/pub/23/23-60321-CR0.pdf"),
                CARPENTER]),
    dict(id="predictive-policing", title="Predictive Policing & Risk Scoring", paras=[
        "Place-based tools forecast where crime is likely, from past incident data; person-based tools score individuals' risk. Critics note that historical arrest data reflect where police already patrol, which can reinforce existing patterns. Los Angeles ended its LASER person-based program in 2019 after an inspector general review, and Santa Cruz, California banned predictive policing in 2020.",
        "In courts, risk assessment algorithms inform bail and sentencing. ProPublica's 2016 analysis of the COMPAS tool in Broward County, Florida, reported different false-positive rates for Black and white defendants; the vendor disputed the findings, and the debate shaped research on algorithmic fairness.",
    ], sources=[("Brennan Center for Justice: Predictive Policing Explained", "https://www.brennancenter.org/our-work/research-reports/predictive-policing-explained"),
                ("ProPublica: Machine Bias (2016)", "https://www.propublica.org/article/machine-bias-risk-assessments-in-criminal-sentencing"),
                ATLAS]),
    dict(id="social-graph", title="Social Graph Analysis", paras=[
        "Social graph analysis maps relationships among people from phone records, social media connections, co-arrest records and shared addresses, then uses network measures to flag people as central or at risk. Investigators use it to map criminal networks; data brokers and analytics platforms sell related tools.",
        "Chicago's Strategic Subject List scored people partly on their arrest networks. A RAND evaluation published in 2016 found that being on the list did not reduce a person's likelihood of being a shooting victim, though listed people were more likely to be arrested for a shooting. Chicago decommissioned the program in 2019. Carpenter v. United States limits warrantless access to some of the location records such analysis can draw on.",
    ], sources=[("Saunders, Hunt & Hollywood: Predictions put into practice, a quasi-experimental evaluation of Chicago's predictive policing pilot, Journal of Experimental Criminology (2016)",
                 "https://doi.org/10.1007/s11292-016-9272-0"),
                CARPENTER, ATLAS]),
]

page("data-centers.html", "DATA CENTERS",
     "Power, water, ownership, money, construction, jobs and reliability behind the buildings that run cloud and AI computing.", data_centers)
page("consumer-financial-security.html", "CONSUMER FINANCIAL SECURITY",
     "How common financial scams and frauds work, what the law protects, and the official places to freeze, report and recover.", consumer)
page("ai-cybersecurity.html", "AI CYBERSECURITY",
     "Defensive uses of AI in security, and how to secure AI systems, based on NIST, CISA and OWASP guidance.", cyber)
page("ai-surveillance-tracking.html", "AI SURVEILLANCE & TRACKING",
     "Documented surveillance and tracking technologies, how they are used, and the court rulings and laws that govern them.", surveillance)
print("ok", len(data_centers) + len(consumer) + len(cyber) + len(surveillance))
