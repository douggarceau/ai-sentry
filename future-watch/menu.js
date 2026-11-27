/* Future Watch: the single list that defines every menu label and destination,
   plus the dropdown behaviour (mouse, touch and keyboard). */

const MENU = [
  {
    label: "DATA CENTERS",
    items: [
      ["Grid & Substations", "data-centers.html#grid-substations"],
      ["Cooling & Water", "data-centers.html#cooling-water"],
      ["Owners & Operators", "data-centers.html#owners-operators"],
      ["AI & Cloud Tenants", "data-centers.html#ai-cloud-tenants"],
      ["Size & Capacity", "data-centers.html#size-capacity"],
      ["Permits & Zoning", "data-centers.html#permits-zoning"],
      ["Financing, Tax Incentives & Land", "data-centers.html#financing-tax-land"],
      ["Construction, Contractors & Delays", "data-centers.html#construction-delays"],
      ["Jobs, Training & Hiring", "data-centers.html#jobs-training-hiring"],
      ["Outages, Backup Power & Reliability", "data-centers.html#outages-backup-reliability"],
    ],
  },
  {
    label: "CONSUMER FINANCIAL SECURITY",
    items: [
      ["Bank & Credit Card Account Takeover", "consumer-financial-security.html#account-takeover"],
      ["Online Card Fraud", "consumer-financial-security.html#online-card-fraud"],
      ["Merchant Scams", "consumer-financial-security.html#merchant-scams"],
      ["Subscriptions & Hidden Fees", "consumer-financial-security.html#subscriptions-hidden-fees"],
      ["Wire Transfer & Zelle Fraud", "consumer-financial-security.html#wire-zelle-fraud"],
      ["Bank Impersonation", "consumer-financial-security.html#bank-impersonation"],
      ["Credit Freezes", "consumer-financial-security.html#credit-freezes"],
      ["Identity Document Upload Safety", "consumer-financial-security.html#id-upload-safety"],
      ["Loan & Credit Offer Scams", "consumer-financial-security.html#loan-credit-scams"],
      ["Account Recovery", "consumer-financial-security.html#account-recovery"],
      ["ATM Fraud & Card Skimming", "consumer-financial-security.html#atm-skimming"],
    ],
  },
  {
    label: "AI CYBERSECURITY",
    items: [
      ["Threat Detection & Incident Response", "ai-cybersecurity.html#detection-response"],
      ["Identity, Endpoints & Infrastructure", "ai-cybersecurity.html#identity-endpoints-infrastructure"],
      ["Vulnerability Management & Security Testing", "ai-cybersecurity.html#vulnerability-testing"],
      ["Supply Chain, Privacy & Governance", "ai-cybersecurity.html#supply-chain-privacy-governance"],
    ],
  },
  {
    label: "AI SURVEILLANCE & TRACKING",
    items: [
      ["Wi-Fi & Bluetooth Tracking", "ai-surveillance-tracking.html#wifi-bluetooth"],
      ["Thermal Imaging & Night Vision", "ai-surveillance-tracking.html#thermal-night-vision"],
      ["Acoustic Sensors", "ai-surveillance-tracking.html#acoustic-sensors"],
      ["Voiceprint Recognition", "ai-surveillance-tracking.html#voiceprint"],
      ["Gait Recognition", "ai-surveillance-tracking.html#gait"],
      ["Iris & Fingerprint Matching", "ai-surveillance-tracking.html#iris-fingerprint"],
      ["Digital Forensics", "ai-surveillance-tracking.html#digital-forensics"],
      ["Geofence Searches", "ai-surveillance-tracking.html#geofence"],
      ["Predictive Policing & Risk Scoring", "ai-surveillance-tracking.html#predictive-policing"],
      ["Social Graph Analysis", "ai-surveillance-tracking.html#social-graph"],
    ],
  },
];

(function buildMenu() {
  const nav = document.getElementById("site-menu");
  if (!nav) return;
  const list = document.createElement("ul");
  list.className = "menu";

  MENU.forEach((group, g) => {
    const li = document.createElement("li");
    li.className = "menu-group";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-button";
    btn.id = `menu-btn-${g}`;
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", `menu-panel-${g}`);
    btn.innerHTML = `<span>${group.label}</span><span class="chev" aria-hidden="true"></span>`;

    const panel = document.createElement("ul");
    panel.className = "menu-panel";
    panel.id = `menu-panel-${g}`;
    panel.setAttribute("aria-labelledby", btn.id);
    panel.hidden = true;

    group.items.forEach(([text, href]) => {
      const item = document.createElement("li");
      const a = document.createElement("a");
      a.href = href;
      a.textContent = text;
      item.appendChild(a);
      panel.appendChild(item);
    });

    li.append(btn, panel);
    list.appendChild(li);
  });
  nav.appendChild(list);

  const groups = [...list.querySelectorAll(".menu-group")];
  const buttonOf = (gEl) => gEl.querySelector(".menu-button");
  const panelOf = (gEl) => gEl.querySelector(".menu-panel");
  const linksOf = (gEl) => [...panelOf(gEl).querySelectorAll("a")];

  function close(gEl) {
    buttonOf(gEl).setAttribute("aria-expanded", "false");
    panelOf(gEl).hidden = true;
  }
  function closeAll(except) {
    groups.forEach((gEl) => gEl !== except && close(gEl));
  }
  function open(gEl, focusIndex) {
    closeAll(gEl);
    buttonOf(gEl).setAttribute("aria-expanded", "true");
    panelOf(gEl).hidden = false;
    if (focusIndex !== undefined) {
      const links = linksOf(gEl);
      links[(focusIndex + links.length) % links.length].focus();
    }
  }
  const isOpen = (gEl) => buttonOf(gEl).getAttribute("aria-expanded") === "true";

  groups.forEach((gEl, i) => {
    const btn = buttonOf(gEl);

    // Click covers mouse, touch and Enter/Space on a real <button>.
    btn.addEventListener("click", () => (isOpen(gEl) ? close(gEl) : open(gEl)));

    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); open(gEl, 0); }
      else if (e.key === "ArrowUp") { e.preventDefault(); open(gEl, -1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); buttonOf(groups[(i + 1) % groups.length]).focus(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); buttonOf(groups[(i - 1 + groups.length) % groups.length]).focus(); }
      else if (e.key === "Escape") { close(gEl); }
    });

    panelOf(gEl).addEventListener("keydown", (e) => {
      const links = linksOf(gEl);
      const idx = links.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); links[(idx + 1) % links.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); links[(idx - 1 + links.length) % links.length].focus(); }
      else if (e.key === "Home") { e.preventDefault(); links[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); links[links.length - 1].focus(); }
      else if (e.key === "Escape") { e.preventDefault(); close(gEl); btn.focus(); }
    });

    // Following a link to another section of the same page closes the menu.
    panelOf(gEl).addEventListener("click", (e) => {
      if (e.target.closest("a")) close(gEl);
    });

    // Close when keyboard focus leaves the whole group (e.g. Tab past the last link).
    gEl.addEventListener("focusout", (e) => {
      if (e.relatedTarget && !gEl.contains(e.relatedTarget)) close(gEl);
    });
  });

  // Click or tap outside closes any open menu.
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target)) closeAll();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
  // Restored from the back/forward cache: start with every menu closed.
  window.addEventListener("pageshow", () => closeAll());
})();
