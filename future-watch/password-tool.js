/* Password Checker & Generator. The password never leaves the page; the optional
   breach check sends only the first 5 characters of its SHA-1 hash (k-anonymity). */
(function (root) {
  const FW = root.FW;
  const COMMON = ("123456 password 123456789 12345678 12345 qwerty 1234567 111111 123123 abc123 password1 1234 iloveyou 1q2w3e4r 000000 qwerty123 zaq12wsx dragon sunshine princess letmein 654321 monkey 27653 1qaz2wsx 123321 qwertyuiop superman asdfghjkl trustno1 welcome login admin football baseball master michael shadow ashley jesus mustang hello 696969 charlie 666666 freedom whatever qazwsx ninja azerty solo loveme passw0rd starwars 121212 bailey access flower 555555 lovely 7777777 888888 hottie jennifer jordan computer hunter buster soccer harley batman andrew tigger summer pepper 11111111 donald killer george joshua taylor matthew 1234567890 robert daniel thomas hockey ranger daniel1 secret changeme welcome1 admin123 p@ssw0rd p@ssword qwerty1 abc12345 test123 password123 iloveyou1 football1 monkey1 letmein1")
    .split(" ");
  const SEQS = ["abcdefghijklmnopqrstuvwxyz", "qwertyuiopasdfghjklzxcvbnm", "01234567890", "1qaz2wsx3edc4rfv"];
  const WORDS = "love|pass|word|admin|user|login|welcome|summer|winter|spring|autumn|dragon|monkey|secret|qwerty|football|baseball|sunshine|princess|master|shadow|letmein|hello|freedom|money|angel|family|london|chicago|texas|july|june|march|april|august".split("|");

  function estimate(pw) {
    const notes = [];
    if (!pw) return { score: 0, bits: 0, notes };
    const lower = pw.toLowerCase();
    let pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/\d/.test(pw)) pool += 10;
    if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
    let bits = pw.length * Math.log2(Math.max(pool, 1));

    const unleet = lower.replace(/@/g, "a").replace(/0/g, "o").replace(/[1!]/g, "i").replace(/3/g, "e").replace(/\$/g, "s").replace(/5/g, "s").replace(/7/g, "t");
    if (COMMON.includes(lower) || COMMON.includes(unleet) || COMMON.includes(unleet.replace(/[^a-z]+$/, ""))) {
      notes.push("This is one of the most common passwords. Attackers try these first.");
      bits = Math.min(bits, 10);
    }
    const word = WORDS.find((w) => unleet.includes(w));
    if (word) {
      notes.push(`Contains the common word "${word}". Swapping letters for symbols (like @ for a) doesn't fool cracking tools.`);
      bits -= 12;
      // A dictionary word plus a few extra characters is guessed far faster than random characters.
      if (unleet.replace(/[^a-z]/g, "").length >= unleet.length - 6 && pw.length < 16) bits = Math.min(bits, 36);
    }
    if (/(.)\1{2,}/.test(pw)) { notes.push("Repeats the same character several times."); bits -= 8; }
    for (const s of SEQS) {
      for (let i = 0; i + 4 <= s.length; i++) {
        const chunk = s.slice(i, i + 4);
        if (lower.includes(chunk) || lower.includes([...chunk].reverse().join(""))) { notes.push("Contains a keyboard or alphabet sequence."); bits -= 10; i = s.length; }
      }
    }
    if (/(19[4-9]\d|20[0-4]\d)/.test(pw)) { notes.push("Contains what looks like a year. Birth years and dates are easy to guess."); bits -= 6; }
    if (/^[A-Z][a-z]+\d{1,4}[!@#$%^&*]?$/.test(pw)) { notes.push("Follows the most common pattern: a capitalised word, then numbers, then a symbol. Cracking tools try this pattern early."); bits = Math.min(bits - 10, 32); }
    if (pw.length < 12) notes.push("Shorter than 12 characters. Length matters more than symbols.");
    bits = Math.max(0, Math.round(bits));
    const score = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
    return { score, bits, notes };
  }

  function crackTime(bits) {
    // Offline attack on a fast hash at about 10 billion guesses a second; half the space on average.
    const s = Math.pow(2, bits) / 2 / 1e10;
    if (s < 1) return "instantly";
    const units = [[31557600 * 100, "centuries"], [31557600, "years"], [86400 * 30, "months"], [86400, "days"], [3600, "hours"], [60, "minutes"], [1, "seconds"]];
    for (const [n, u] of units) if (s >= n) { const v = s / n; return v > 1e6 ? "longer than the age of the universe" : `about ${Math.round(v).toLocaleString()} ${u}`; }
    return "seconds";
  }

  function generate(len, opts) {
    let chars = "abcdefghijkmnopqrstuvwxyz";
    if (opts.upper) chars += "ABCDEFGHJKLMNPQRSTUVWXYZ";
    if (opts.digits) chars += "23456789";
    if (opts.symbols) chars += "!#$%&*+-=?@^_~";
    // Look-alike characters (l, I, O, 0, 1) are left out only when "easy to read" is ticked.
    if (!opts.simple) {
      chars += "l";
      if (opts.upper) chars += "IO";
      if (opts.digits) chars += "01";
    }
    const out = [];
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / chars.length) * chars.length; // avoid modulo bias
    while (out.length < len) {
      crypto.getRandomValues(buf);
      if (buf[0] < limit) out.push(chars[buf[0] % chars.length]);
    }
    return out.join("");
  }

  async function sha1Hex(s) {
    const d = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
    return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  root.FWPass = { estimate, crackTime, generate };

  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", () => {
    const pw = document.getElementById("pw-input");
    if (!pw) return;
    const out = document.getElementById("pw-result");
    const show = document.getElementById("pw-show");
    const LABELS = [["Very weak", "chip-3", 10], ["Weak", "chip-3", 30], ["Fair", "chip-2", 55], ["Strong", "chip-ok", 80], ["Very strong", "chip-ok", 100]];

    function render() {
      const v = pw.value;
      if (!v) { out.innerHTML = `<p class="muted">Type a password to see how strong it is.</p>`; return; }
      const r = estimate(v);
      const [label, chip, pct] = LABELS[r.score];
      let h = `<p><span class="chip ${chip}">${label}</span> <span class="muted">${v.length} characters · about ${r.bits} bits · cracked ${crackTime(r.bits)} by an offline attack</span></p>
        <div class="meter" role="img" aria-label="Strength ${label}"><span style="width:${pct}%;background:var(--${r.score >= 3 ? "ok" : r.score === 2 ? "warn" : "bad"})"></span></div>`;
      if (r.notes.length) h += `<ul class="findings">${r.notes.map((n) => `<li class="sev-2">${FW.esc(n)}</li>`).join("")}</ul>`;
      else h += `<p class="muted">No common patterns found.</p>`;
      out.innerHTML = h;
    }
    pw.addEventListener("input", () => { render(); document.getElementById("pw-breach-out").innerHTML = ""; });
    show.addEventListener("change", () => (pw.type = show.checked ? "text" : "password"));

    document.getElementById("pw-breach").addEventListener("click", async () => {
      const box = document.getElementById("pw-breach-out");
      if (!pw.value) { box.innerHTML = `<p class="muted">Type a password first.</p>`; return; }
      box.innerHTML = `<p class="muted">Checking…</p>`;
      try {
        const hash = await sha1Hex(pw.value);
        const res = await fetch("https://api.pwnedpasswords.com/range/" + hash.slice(0, 5), { headers: { "Add-Padding": "true" } });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const body = await res.text();
        const line = body.split("\n").find((l) => l.startsWith(hash.slice(5)));
        const count = line ? parseInt(line.split(":")[1], 10) : 0;
        box.innerHTML = count
          ? `<div class="verdict verdict-high" role="status"><strong>Found in ${count.toLocaleString()} breaches</strong><p>Stop using this password everywhere you've used it, and change those accounts now.</p></div>`
          : `<div class="verdict verdict-none" role="status"><strong>Not found in known breaches</strong><p>That's good, but it doesn't make a weak password strong.</p></div>`;
      } catch (e) {
        box.innerHTML = `<p class="verdict verdict-low">The breach service couldn't be reached from this page (some viewers block outside connections). You can check at <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener">Have I Been Pwned</a>.</p>`;
      }
    });

    const len = document.getElementById("gen-len");
    const lenOut = document.getElementById("gen-len-out");
    const genOut = document.getElementById("gen-out");
    function gen() {
      lenOut.textContent = len.value;
      genOut.value = generate(+len.value, {
        upper: document.getElementById("gen-upper").checked,
        digits: document.getElementById("gen-digits").checked,
        symbols: document.getElementById("gen-symbols").checked,
        simple: document.getElementById("gen-simple").checked,
      });
      const r = estimate(genOut.value);
      document.getElementById("gen-strength").textContent = `${LABELS[r.score][0]}, about ${r.bits} bits`;
    }
    document.getElementById("gen-form").addEventListener("input", (e) => { if (e.target !== genOut) gen(); });
    document.getElementById("gen-form").addEventListener("submit", (e) => { e.preventDefault(); gen(); });
    document.getElementById("gen-copy").addEventListener("click", () =>
      FW.copy(genOut.value, genOut).then((ok) => (document.getElementById("gen-copied").textContent = ok ? "Copied." : "Selected: press Ctrl+C or Cmd+C.")));
    gen();
    render();
  });
})(typeof window !== "undefined" ? window : globalThis);
