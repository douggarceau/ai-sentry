/* Browser Exposure Check: shows what any website can read about this device without
   asking, and combines it into a fingerprint ID. Nothing is stored or sent. */
(function (root) {
  const FW = root.FW;

  async function sha(s) {
    const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function canvasPrint() {
    try {
      const c = document.createElement("canvas");
      c.width = 280; c.height = 60;
      const g = c.getContext("2d");
      g.textBaseline = "top";
      g.font = "16px 'Arial'";
      g.fillStyle = "#f60"; g.fillRect(100, 1, 62, 20);
      g.fillStyle = "#069"; g.fillText("Future Watch ✓ 1.0 ñ", 2, 15);
      g.fillStyle = "rgba(102,204,0,.7)"; g.fillText("Future Watch ✓ 1.0 ñ", 4, 17);
      g.globalCompositeOperation = "multiply";
      g.fillStyle = "rgb(255,0,255)"; g.beginPath(); g.arc(50, 40, 18, 0, Math.PI * 2); g.fill();
      return c.toDataURL();
    } catch (e) { return ""; }
  }

  function webgl() {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) return null;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      };
    } catch (e) { return null; }
  }

  const FONTS = ["Arial", "Helvetica Neue", "Times New Roman", "Courier New", "Georgia", "Verdana", "Tahoma", "Trebuchet MS", "Segoe UI", "Calibri", "Cambria", "Consolas", "Candara", "Franklin Gothic Medium", "Garamond", "Gill Sans", "Lucida Grande", "Menlo", "Monaco", "Optima", "Palatino", "SF Pro Text", "Avenir", "Futura", "Roboto", "Noto Sans", "Ubuntu", "DejaVu Sans", "Liberation Sans", "Cantarell", "Comic Sans MS", "Impact", "Wingdings", "Bookman Old Style", "Century Gothic", "Baskerville", "Didot", "Hoefler Text", "Rockwell", "Arial Narrow"];
  function fonts() {
    const span = document.createElement("span");
    span.style.cssText = "position:absolute;left:-9999px;top:0;font-size:72px;visibility:hidden";
    span.textContent = "mmmmmmmmmmlli1WQ@";
    document.body.appendChild(span);
    const base = {};
    for (const b of ["monospace", "serif", "sans-serif"]) { span.style.fontFamily = b; base[b] = span.offsetWidth + "x" + span.offsetHeight; }
    const found = FONTS.filter((f) => ["monospace", "serif", "sans-serif"].some((b) => { span.style.fontFamily = `"${f}",${b}`; return span.offsetWidth + "x" + span.offsetHeight !== base[b]; }));
    span.remove();
    return found;
  }

  async function collect() {
    const n = navigator;
    const gl = webgl();
    const canvas = canvasPrint();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const items = [
      { group: "Device", label: "Browser and system", value: n.userAgent, why: "Names your browser, version and operating system." },
      { group: "Device", label: "Platform", value: (n.userAgentData && n.userAgentData.platform) || n.platform || "unknown" },
      { group: "Device", label: "Screen", value: `${screen.width} × ${screen.height}, ${devicePixelRatio}× pixel density, ${screen.colorDepth}-bit color`, why: "Screen size and density narrow down the device model." },
      { group: "Device", label: "Processor cores", value: String(n.hardwareConcurrency || "hidden") },
      { group: "Device", label: "Memory", value: n.deviceMemory ? `about ${n.deviceMemory} GB` : "hidden" },
      { group: "Device", label: "Touch screen", value: n.maxTouchPoints > 0 ? `yes (${n.maxTouchPoints} touch points)` : "no" },
      { group: "Device", label: "Graphics card", value: gl ? `${gl.renderer} (${gl.vendor})` : "hidden", why: "The exact graphics chip is one of the most identifying details." },
      { group: "Location and language", label: "Time zone", value: `${tz} (UTC${-new Date().getTimezoneOffset() / 60 >= 0 ? "+" : ""}${-new Date().getTimezoneOffset() / 60})`, why: "Reveals your rough region even through a VPN, unless the browser hides it." },
      { group: "Location and language", label: "Languages", value: (n.languages || [n.language]).join(", ") },
      { group: "Fingerprinting", label: "Canvas drawing", value: canvas ? (await sha(canvas)).slice(0, 16) : "blocked", why: "Tiny differences in how your device draws text and shapes create a stable ID." },
      { group: "Fingerprinting", label: "Installed fonts detected", value: "", why: "The set of fonts you have installed differs between people." },
      { group: "Privacy settings", label: "Global Privacy Control", value: n.globalPrivacyControl ? "on (sites are told not to sell or share your data)" : "off", good: !!n.globalPrivacyControl },
      { group: "Privacy settings", label: "Do Not Track", value: n.doNotTrack === "1" ? "on (most sites ignore it)" : "off" },
      { group: "Privacy settings", label: "Cookies", value: n.cookieEnabled ? "allowed" : "blocked" },
    ];
    const fontList = fonts();
    items.find((i) => i.label === "Installed fonts detected").value = fontList.length ? `${fontList.length} of ${FONTS.length} tested: ${fontList.join(", ")}` : "none detected (blocked or randomised)";
    const id = await sha(items.filter((i) => i.group !== "Privacy settings").map((i) => i.value).join("|"));
    return { items, id: id.slice(0, 20) };
  }

  root.FWExposure = { collect };

  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", async () => {
    const out = document.getElementById("bx-result");
    if (!out) return;
    const r = await collect();
    let h = `<div class="verdict verdict-medium" role="status"><strong>Your fingerprint ID: <span class="mono">${r.id}</span></strong>
      <p>Websites and ad networks can compute an ID like this without cookies and without asking. Open this page in a private window: if the ID is the same, sites can recognise you there too.</p></div>`;
    let group = "";
    for (const i of r.items) {
      if (i.group !== group) { if (group) h += `</dl>`; group = i.group; h += `<h3>${FW.esc(group)}</h3><dl class="kv">`; }
      h += `<dt>${FW.esc(i.label)}</dt><dd>${FW.esc(i.value)}${i.why ? `<br><span class="muted" style="font-family:var(--font-body)">${FW.esc(i.why)}</span>` : ""}</dd>`;
    }
    h += `</dl>`;
    out.innerHTML = h;
  });
})(typeof window !== "undefined" ? window : globalThis);
