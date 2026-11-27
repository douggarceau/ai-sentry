/* Photo Location Remover: shows the hidden metadata in a JPEG or PNG (GPS location,
   camera, time) and makes a clean copy without it. Everything happens on the device. */
(function (root) {
  const FW = root.FW;

  // ---------- EXIF reading ----------
  const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  const IFD0_TAGS = { 0x010f: "Camera maker", 0x0110: "Camera model", 0x0112: "Orientation", 0x0131: "Software", 0x0132: "Date modified", 0x013b: "Artist", 0x8298: "Copyright" };
  const EXIF_TAGS = { 0x9003: "Date taken", 0xa430: "Camera owner name", 0xa431: "Camera serial number", 0xa434: "Lens model", 0x9010: "Time zone offset" };

  function readTIFF(view, t) {
    const le = view.getUint16(t) === 0x4949;
    const u16 = (o) => view.getUint16(o, le);
    const u32 = (o) => view.getUint32(o, le);
    if (u16(t + 2) !== 42) return null;

    function readValue(entry) {
      const type = u16(entry + 2), count = u32(entry + 4);
      const size = (TYPE_SIZE[type] || 1) * count;
      const at = size <= 4 ? entry + 8 : t + u32(entry + 8);
      if (at + size > view.byteLength) return null;
      if (type === 2) { let s = ""; for (let i = 0; i < count; i++) { const c = view.getUint8(at + i); if (!c) break; s += String.fromCharCode(c); } return s.trim(); }
      if (type === 3) return count === 1 ? u16(at) : Array.from({ length: count }, (_, i) => u16(at + i * 2));
      if (type === 4 || type === 9) return count === 1 ? u32(at) : Array.from({ length: count }, (_, i) => u32(at + i * 4));
      if (type === 5 || type === 10) return Array.from({ length: count }, (_, i) => { const d = u32(at + i * 8 + 4); return d ? u32(at + i * 8) / d : 0; });
      if (type === 1 || type === 7) return Array.from({ length: Math.min(count, 64) }, (_, i) => view.getUint8(at + i));
      return null;
    }
    function readIFD(off) {
      const out = {};
      if (!off || t + off + 2 > view.byteLength) return out;
      const base = t + off, n = u16(base);
      for (let i = 0; i < n; i++) {
        const e = base + 2 + i * 12;
        if (e + 12 > view.byteLength) break;
        try { out[u16(e)] = readValue(e); } catch (err) { /* skip unreadable tag */ }
      }
      return out;
    }
    const ifd0 = readIFD(u32(t + 4));
    return { ifd0, exif: readIFD(ifd0[0x8769]), gps: readIFD(ifd0[0x8825]) };
  }

  function gpsToDecimal(gps) {
    const dms = (v) => (Array.isArray(v) && v.length >= 3 ? v[0] + v[1] / 60 + v[2] / 3600 : null);
    let lat = dms(gps[2]), lon = dms(gps[4]);
    if (lat === null || lon === null || (lat === 0 && lon === 0)) return null;
    if (/S/i.test(gps[1] || "")) lat = -lat;
    if (/W/i.test(gps[3] || "")) lon = -lon;
    const alt = Array.isArray(gps[6]) ? gps[6][0] * (Array.isArray(gps[5]) && gps[5][0] === 1 ? -1 : 1) : null;
    return { lat, lon, alt };
  }

  // ---------- JPEG segments ----------
  function jpegSegments(bytes) {
    const segs = [];
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
    let i = 2;
    while (i + 4 <= bytes.length) {
      if (bytes[i] !== 0xff) return null;
      const marker = bytes[i + 1];
      if (marker === 0xd9) break;
      if (marker === 0xda) { segs.push({ marker, start: i, end: bytes.length, scan: true }); break; }
      if (marker >= 0xd0 && marker <= 0xd7) { i += 2; continue; }
      const len = (bytes[i + 2] << 8) | bytes[i + 3];
      segs.push({ marker, start: i, end: i + 2 + len });
      i += 2 + len;
    }
    return segs;
  }
  const ascii = (bytes, a, n) => String.fromCharCode(...bytes.subarray(a, a + n));

  function inspectJPEG(buf) {
    const bytes = new Uint8Array(buf);
    const segs = jpegSegments(bytes);
    if (!segs) return null;
    const found = { type: "JPEG", tags: [], gps: null, orientation: 1, blocks: [] };
    for (const s of segs) {
      const body = s.start + 4;
      if (s.marker === 0xe1 && ascii(bytes, body, 6) === "Exif\0\0") {
        found.blocks.push("EXIF");
        const tiff = readTIFF(new DataView(buf), body + 6);
        if (tiff) {
          for (const [k, label] of Object.entries(IFD0_TAGS)) if (tiff.ifd0[k] !== undefined && k != 0x0112) found.tags.push([label, String(tiff.ifd0[k])]);
          for (const [k, label] of Object.entries(EXIF_TAGS)) if (tiff.exif[k] !== undefined) found.tags.push([label, String(tiff.exif[k])]);
          found.orientation = tiff.ifd0[0x0112] || 1;
          found.gps = gpsToDecimal(tiff.gps);
        }
      } else if (s.marker === 0xe1 && /^http:\/\/ns\.adobe\.com\/xap/.test(ascii(bytes, body, 28))) {
        found.blocks.push("XMP");
        const xmp = new TextDecoder().decode(bytes.subarray(body, s.end));
        if (!found.gps) {
          const la = /exif:GPSLatitude="([\d.]+),([\d.]+)([NS])"/.exec(xmp), lo = /exif:GPSLongitude="([\d.]+),([\d.]+)([EW])"/.exec(xmp);
          if (la && lo) found.gps = { lat: (+la[1] + la[2] / 60) * (la[3] === "S" ? -1 : 1), lon: (+lo[1] + lo[2] / 60) * (lo[3] === "W" ? -1 : 1), alt: null };
        }
      } else if (s.marker === 0xed) found.blocks.push("IPTC / Photoshop");
      else if (s.marker === 0xfe) found.blocks.push("Comment");
    }
    return found;
  }
  function stripJPEG(buf) {
    const bytes = new Uint8Array(buf);
    const segs = jpegSegments(bytes);
    const keep = [bytes.subarray(0, 2)];
    for (const s of segs) {
      const drop = s.marker === 0xe1 || s.marker === 0xed || s.marker === 0xfe || (s.marker >= 0xe3 && s.marker <= 0xef && s.marker !== 0xee);
      if (!drop) keep.push(bytes.subarray(s.start, s.end));
    }
    if (!segs.some((s) => s.scan)) keep.push(new Uint8Array([0xff, 0xd9]));
    return new Blob(keep, { type: "image/jpeg" });
  }

  // ---------- PNG chunks ----------
  const PNG_META = ["eXIf", "tEXt", "iTXt", "zTXt", "tIME"];
  function pngChunks(bytes) {
    const sig = [137, 80, 78, 71, 13, 10, 26, 10];
    if (!sig.every((b, i) => bytes[i] === b)) return null;
    const v = new DataView(bytes.buffer, bytes.byteOffset);
    const out = [];
    let i = 8;
    while (i + 12 <= bytes.length) {
      const len = v.getUint32(i), type = ascii(bytes, i + 4, 4);
      out.push({ type, start: i, end: i + 12 + len, data: i + 8, len });
      i += 12 + len;
      if (type === "IEND") break;
    }
    return out;
  }
  function inspectPNG(buf) {
    const bytes = new Uint8Array(buf);
    const ch = pngChunks(bytes);
    if (!ch) return null;
    const found = { type: "PNG", tags: [], gps: null, orientation: 1, blocks: [] };
    for (const c of ch) {
      if (!PNG_META.includes(c.type)) continue;
      found.blocks.push(c.type === "eXIf" ? "EXIF" : c.type === "tIME" ? "Timestamp" : "Text");
      if (c.type === "eXIf") {
        const tiff = readTIFF(new DataView(buf), c.data);
        if (tiff) { found.gps = gpsToDecimal(tiff.gps); for (const [k, label] of Object.entries(IFD0_TAGS)) if (tiff.ifd0[k] !== undefined && k != 0x0112) found.tags.push([label, String(tiff.ifd0[k])]); }
      } else if (c.type === "tEXt") {
        const s = ascii(bytes, c.data, Math.min(c.len, 300)).split("\0");
        found.tags.push([s[0], (s[1] || "").slice(0, 120)]);
      }
    }
    return found;
  }
  function stripPNG(buf) {
    const bytes = new Uint8Array(buf);
    const parts = [bytes.subarray(0, 8)];
    for (const c of pngChunks(bytes)) if (!PNG_META.includes(c.type)) parts.push(bytes.subarray(c.start, c.end));
    return new Blob(parts, { type: "image/png" });
  }

  root.FWPhoto = { inspectJPEG, stripJPEG, inspectPNG, stripPNG };

  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("ph-file");
    if (!input) return;
    const out = document.getElementById("ph-result");
    const drop = document.getElementById("ph-drop");
    let lastUrl = null;

    async function handle(file) {
      out.hidden = false;
      if (/heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
        out.innerHTML = `<p class="verdict verdict-low">HEIC photos can't be read in a browser. On iPhone, share the photo and tap <em>Options</em> at the top of the share sheet, then turn off <em>Location</em>. Or set Settings › Camera › Formats to <em>Most Compatible</em> so new photos are JPEG.</p>`;
        return;
      }
      const buf = await file.arrayBuffer();
      const isPNG = new Uint8Array(buf)[0] === 0x89;
      const info = isPNG ? inspectPNG(buf) : inspectJPEG(buf);
      if (!info) { out.innerHTML = `<p class="verdict verdict-low">This doesn't look like a JPEG or PNG photo.</p>`; return; }

      let clean;
      if (!isPNG && info.orientation !== 1) {
        // Removing EXIF would drop the rotation flag, so redraw the photo upright instead.
        const bmp = await createImageBitmap(new Blob([buf]), { imageOrientation: "from-image" });
        const c = document.createElement("canvas");
        c.width = bmp.width; c.height = bmp.height;
        c.getContext("2d").drawImage(bmp, 0, 0);
        clean = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.95));
      } else clean = isPNG ? stripPNG(buf) : stripJPEG(buf);

      const lvl = info.gps ? "high" : info.blocks.length ? "medium" : "none";
      let h = `<div class="verdict verdict-${lvl}" role="status"><strong>${info.gps ? "This photo reveals where it was taken" : info.blocks.length ? "Hidden details found" : "No hidden details found"}</strong><p>${info.gps
        ? "Anyone you send the original file to can see the exact location. Use the clean copy below instead."
        : info.blocks.length ? "No location, but the file carries other details about the camera or software." : "This file has no metadata. Many apps already strip it when you share."}</p></div>`;
      if (info.gps) {
        const { lat, lon, alt } = info.gps;
        const la = lat.toFixed(6), lo = lon.toFixed(6);
        h += `<dl class="kv"><dt>Location</dt><dd>${la}, ${lo}${alt !== null ? ` · altitude ${Math.round(alt)} m` : ""}</dd></dl>
          <p><a href="https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=17/${la}/${lo}" target="_blank" rel="noopener">See this spot on a map</a> <span class="muted">(opens OpenStreetMap; only you see it)</span></p>`;
      }
      if (info.tags.length) h += `<h3>Other details in the file</h3><dl class="kv">${info.tags.map(([k, v]) => `<dt>${FW.esc(k)}</dt><dd>${FW.esc(v)}</dd>`).join("")}</dl>`;
      if (info.blocks.length) h += `<p class="note">Metadata blocks found: ${[...new Set(info.blocks)].join(", ")}.</p>`;

      const check = isPNG ? inspectPNG(await clean.arrayBuffer()) : inspectJPEG(await clean.arrayBuffer());
      const ok = check && !check.gps && !check.blocks.length;
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(clean);
      const outName = file.name.replace(/(\.[^.]+)?$/, "-clean$1");
      h += `<h3>Clean copy</h3>
        <p>${ok ? '<span class="chip chip-ok">Checked</span> No location or metadata left.' : '<span class="chip chip-2">Check</span> Some metadata could not be removed.'} ${(clean.size / 1024).toFixed(0)} KB.</p>
        <img class="preview-img" src="${lastUrl}" alt="Clean copy of your photo">
        <div class="buttons"><a class="btn" href="${lastUrl}" download="${FW.esc(outName)}">Save clean photo</a></div>
        <p class="note">If the Save button does nothing, right-click the picture (or press and hold on a phone) and choose Save image.</p>`;
      out.innerHTML = h;
    }

    input.addEventListener("change", () => input.files[0] && handle(input.files[0]));
    ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("dragging"); }));
    ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("dragging")));
    drop.addEventListener("drop", (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handle(f); });
  });
})(typeof window !== "undefined" ? window : globalThis);
