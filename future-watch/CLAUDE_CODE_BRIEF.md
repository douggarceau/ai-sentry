# Future Watch: build brief for Claude Code

## What the owner wants, in their own words

These are the owner's messages from the build conversation, in order:

1. The first instructions were drafted with ChatGPT. They asked for a standalone website named Future Watch with four dropdown menus and 35 subcategory links. Each link was to go to a short, factual page with sources, or to an official resource.
2. "the link doesnt work". The preview address only worked inside the cloud build machine. The owner needs a link they can open.
3. "i thought u were building actual software to fix these too"
4. When asked what "fix these" meant, the owner chose: **Tools for the consumer topics.**
5. "the instructions were confused by chat gpt"
6. "the more actusal tools the more useful in my opinion. obviously we are not building a data center tool"

**Summary:** Future Watch should be a website whose dropdown menus lead to working tools, not only to information pages. The more real tools, the better. Build tools for Consumer Financial Security, AI Cybersecurity and AI Surveillance & Tracking. Do not build a Data Centers tool; that category stays information only. The owner must be able to open the finished site from a real link.

## Dropdown menus and subcategories (exact labels, in this order)

**DATA CENTERS** (information pages only, no tools)
- Grid & Substations
- Cooling & Water
- Owners & Operators
- AI & Cloud Tenants
- Size & Capacity
- Permits & Zoning
- Financing, Tax Incentives & Land
- Construction, Contractors & Delays
- Jobs, Training & Hiring
- Outages, Backup Power & Reliability

**CONSUMER FINANCIAL SECURITY**
- Bank & Credit Card Account Takeover
- Online Card Fraud
- Merchant Scams
- Subscriptions & Hidden Fees
- Wire Transfer & Zelle Fraud
- Bank Impersonation
- Credit Freezes
- Identity Document Upload Safety
- Loan & Credit Offer Scams
- Account Recovery
- ATM Fraud & Card Skimming

**AI CYBERSECURITY**
- Threat Detection & Incident Response
- Identity, Endpoints & Infrastructure
- Vulnerability Management & Security Testing
- Supply Chain, Privacy & Governance

**AI SURVEILLANCE & TRACKING**
- Wi-Fi & Bluetooth Tracking
- Thermal Imaging & Night Vision
- Acoustic Sensors
- Voiceprint Recognition
- Gait Recognition
- Iris & Fingerprint Matching
- Digital Forensics
- Geofence Searches
- Predictive Policing & Risk Scoring
- Social Graph Analysis

**SOCIAL MEDIA (owner to decide):** The outline lists Social Media as a fifth dropdown with no subcategories ("The call excerpts only identify the parent category"). The first instructions said to leave it out. Leave it out until the owner supplies its subcategories.

## Technical requirements

- A plain HTML, CSS and JavaScript site with no build step, in the folder `future-watch/`.
- One JavaScript list (`MENU` in `menu.js`) sets every dropdown label and link.
- The dropdowns are real `<button>` elements and every subcategory is a real `<a>` link.
- The menus must work with a mouse, touch and keyboard: Enter, Space, arrow keys, Home/End, Escape and Tab out. On a phone the menus stack.
- The homepage is the category buttons plus lists of links. Do not add Yes/No boxes.
- The browser Back button must work after every link.
- Every subcategory goes somewhere useful and specific: a working tool, a short factual section with source links, or both. Do not use placeholder links or generic homepages.
- Tools run entirely in the visitor's browser. Nothing a visitor types or uploads is sent anywhere. The one exception is an optional, clearly labelled breach check that sends only a 5-character hash prefix. Anything saved stays in that browser, and every tool has a Clear or Reset button.
- Cybersecurity tools are defensive only: protecting your own accounts, devices and files. Surveillance content is factual and documented, and the surveillance tools help people protect themselves.
- Tools must not give legal advice. Where a tool calculates a deadline, say which law it comes from and that it is general information.

## Tools to build, mapped to subcategories

"Built" means the code is written in `future-watch/`. "To build" means not started.

### Consumer Financial Security

| Subcategory | Tool | Status |
|---|---|---|
| Bank Impersonation; Wire Transfer & Zelle Fraud; Merchant Scams; Loan & Credit Offer Scams | **Scam Message Checker**: paste a text, email or link. It flags scam signs such as "safe account", requests for codes, gift card, crypto or Zelle payment, secrecy, remote-access apps, couriers, changed wire instructions, upfront fees, fake tolls and deliveries, and lookalike or disguised web addresses. Each flag quotes the matching words and says what to do. | Built and tested, page live |
| Account Recovery; Bank & Credit Card Account Takeover; Online Card Fraud; ATM Fraud & Card Skimming | **Fraud Response Plan**: tick what happened and get an ordered checklist with official links. Deadlines are calculated: the credit card dispute (Fair Credit Billing Act, 60 days after the statement) and debit/ATM liability (Regulation E: 2 business days for the $50 cap, 60 days after the statement). Business days skip weekends and Federal Reserve holidays. Progress is saved. | Built and tested, page live |
| Credit Freezes | **Credit Freeze Tracker**: freeze status at Equifax, Experian and TransUnion for each household member (children included), with dates, end dates for temporary lifts, and each bureau's official link and phone number. | Built and tested, page live |
| Subscriptions & Hidden Fees | **Subscription & Fee Tracker**: monthly and yearly totals. It flags charges coming in the next 7 days, free trials about to start charging, price increases and unused subscriptions. Rows can be exported as CSV. | Built and tested, page live |
| Identity Document Upload Safety | **ID Request Check**: questions about who asked for your ID, how and why, leading to a safe, verify-first or stop verdict. | Built and tested |
| ATM Fraud & Card Skimming | **Skimmer Check**: an at-the-machine checklist (loose reader, keypad overlay, hidden camera, tap to pay), linked to the Fraud Response Plan. | Built and tested |
| Loan & Credit Offer Scams | **Loan Offer Check**: checks an offer for advance fees, guaranteed approval and pressure tactics, with a link to look up the lender's licence on NMLS Consumer Access. | Built and tested |

### AI Cybersecurity (defensive)

| Subcategory | Tool | Status |
|---|---|---|
| Threat Detection & Incident Response | **Email Header Analyzer**: paste the raw headers. It reads the SPF, DKIM and DMARC results and flags a From, Reply-To or Return-Path mismatch, display-name spoofing and the delivery path. Includes how to copy headers from Gmail, Outlook and Apple Mail. | Built and tested |
| Identity, Endpoints & Infrastructure | **Password Checker & Generator**: strength estimate, common-password and pattern checks, a random password generator, and an optional breach check that sends only a 5-character hash prefix. Also an **Account Security Checkup** listing your accounts with their MFA type and recovery setup. | Built and tested |
| Vulnerability Management & Security Testing | **Prompt-Injection Scanner**: paste text or HTML, or load a file. It finds hidden AI instructions: zero-width and invisible Unicode characters (decoding hidden "tag" text), text hidden with CSS, HTML comments, "ignore previous instructions"-style phrases, data-leaking image links and long base64 blobs. It produces a cleaned copy. This matches the AI Sentry scanner in this repo. | Built and tested |
| Supply Chain, Privacy & Governance | **File Hash Verifier**: computes the SHA-256 of a downloaded file in the browser and compares it with the publisher's hash. | Built and tested |

### AI Surveillance & Tracking (self-protection)

| Subcategory | Tool | Status |
|---|---|---|
| Digital Forensics; Geofence Searches | **Photo Location Remover**: load a JPEG to see its hidden GPS location, camera and timestamp, then save a clean copy with that data removed. | Built and tested |
| Social Graph Analysis; Wi-Fi & Bluetooth Tracking | **Browser Exposure Check**: shows what any website can learn about your device without asking (fingerprint details, time zone, screen, graphics card, fonts), plus how to reduce it. | Built and tested |
| Wi-Fi & Bluetooth Tracking | **Unwanted Tracker Check**: step-by-step checks for iPhone and Android tracker alerts, location sharing and stalkerware warning signs. | Built and tested |
| Voiceprint Recognition | **Family Code Word Setup**: a printable plan for checking a caller's identity against voice-clone scams. | Built and tested |
| Thermal Imaging & Night Vision; Acoustic Sensors; Gait Recognition; Iris & Fingerprint Matching; Predictive Policing & Risk Scoring | Information only: there is no useful consumer tool for these. Keep the sourced sections. | Done (sections exist) |

## Already done

- The site, `MENU`, four dropdowns, 35 links and the four topic pages with sourced sections, tested on desktop (mouse and keyboard) and on a phone (touch), including the Back button.
- Pushed to branch `claude/sweet-maxwell-aqno4c`.
- Published as a private claude.ai artifact so the owner can open it.

## Still to do

1. All 15 tools in the tables above are built, tested on desktop and phone, linked from their subcategories and listed on the homepage.
2. Check the outside source links once the build has internet access. The build machine blocks outside websites, so none have been opened yet.
3. Ask the owner whether Social Media should be added, and with which subcategories.
