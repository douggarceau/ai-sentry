/* File Hash Verifier: computes a file's SHA-256 (and SHA-1, SHA-512) in the browser
   and compares it with the checksum the publisher lists. The file is never uploaded. */
(function (root) {
  const FW = root.FW;
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

  function normalize(s) {
    // Accept "sha256:abc…", "abc…  filename", spaces or uppercase.
    const m = /([a-f0-9]{40,128})/i.exec(String(s || "").replace(/\s+/g, " "));
    return m ? m[1].toLowerCase() : "";
  }

  root.FWHash = { normalize };

  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", () => {
    const fileIn = document.getElementById("fh-file");
    if (!fileIn) return;
    const expected = document.getElementById("fh-expected");
    const out = document.getElementById("fh-result");
    const drop = document.getElementById("fh-drop");
    let hashes = null, name = "";

    function compare() {
      if (!hashes) return;
      const want = normalize(expected.value);
      let h = `<dl class="kv"><dt>File</dt><dd>${FW.esc(name)}</dd>` +
        Object.entries(hashes).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("") + `</dl>`;
      if (want) {
        const hit = Object.entries(hashes).find(([, v]) => v === want);
        h = (hit
          ? `<div class="verdict verdict-none" role="status"><strong>Match (${hit[0]})</strong><p>This file is exactly the one the publisher listed. It hasn't been altered or corrupted.</p></div>`
          : `<div class="verdict verdict-high" role="status"><strong>Does not match</strong><p>Don't open or install this file. It is not the file the publisher listed: it may be corrupted, the wrong version, or tampered with. Download it again from the official site and check again.</p></div>`) + h;
      } else {
        h = `<p class="muted">Paste the checksum from the publisher's official download page to compare.</p>` + h;
      }
      out.innerHTML = h;
      out.hidden = false;
    }

    async function hashFile(f) {
      name = `${f.name} (${(f.size / 1048576).toFixed(f.size > 1048576 ? 1 : 3)} MB)`;
      if (f.size > 2 * 1024 * 1024 * 1024) { out.hidden = false; out.innerHTML = `<p class="verdict verdict-low">Files over 2 GB are too large to check in a browser. Use your computer's built-in command instead (listed below).</p>`; return; }
      out.hidden = false;
      out.innerHTML = `<p class="muted" role="status">Calculating checksums for ${FW.esc(f.name)}…</p>`;
      try {
        const buf = await f.arrayBuffer();
        const [a, b, c] = await Promise.all(["SHA-256", "SHA-512", "SHA-1"].map((alg) => crypto.subtle.digest(alg, buf)));
        hashes = { "SHA-256": hex(a), "SHA-512": hex(b), "SHA-1": hex(c) };
        compare();
      } catch (e) {
        out.innerHTML = `<p class="verdict verdict-low">This browser couldn't read the file (${FW.esc(e.message)}).</p>`;
      }
    }

    fileIn.addEventListener("change", () => fileIn.files[0] && hashFile(fileIn.files[0]));
    expected.addEventListener("input", compare);
    ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("dragging"); }));
    ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("dragging")));
    drop.addEventListener("drop", (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) hashFile(f); });
  });
})(typeof window !== "undefined" ? window : globalThis);
