/* Shared helpers for the Future Watch tools. Everything runs in the browser;
   nothing a visitor types is sent anywhere. */
(function (root) {
  const FW = {};

  // Local storage that never throws (private windows, blocked storage).
  FW.load = function (key, fallback) {
    try {
      const raw = localStorage.getItem("fw:" + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  };
  FW.save = function (key, value) {
    try {
      localStorage.setItem("fw:" + key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  };
  FW.clear = function (key) {
    try { localStorage.removeItem("fw:" + key); } catch (e) { /* ignore */ }
  };

  FW.esc = function (s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  };

  // ---- Dates (all calendar dates, local time, no time-of-day) ----
  FW.parseDate = function (str) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  FW.iso = function (d) {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  FW.addDays = function (d, n) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  };
  FW.today = function () {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  };
  FW.daysBetween = function (a, b) {
    return Math.round((b - a) / 86400000);
  };
  FW.fmt = function (d) {
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  // Federal Reserve holidays. A holiday on Sunday is observed Monday;
  // one on Saturday is not moved (Federal Reserve Banks are open the Friday before).
  function nthWeekday(year, month, weekday, n) {
    const first = new Date(year, month, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month, 1 + offset + (n - 1) * 7);
  }
  function lastWeekday(year, month, weekday) {
    const last = new Date(year, month + 1, 0);
    const offset = (last.getDay() - weekday + 7) % 7;
    return new Date(year, month, last.getDate() - offset);
  }
  FW.bankHolidays = function (year) {
    const fixed = [[0, 1], [5, 19], [6, 4], [10, 11], [11, 25]].map(([m, d]) => {
      const x = new Date(year, m, d);
      return x.getDay() === 0 ? new Date(year, m, d + 1) : x;
    });
    return [
      ...fixed,
      nthWeekday(year, 0, 1, 3),  // Martin Luther King Jr. Day
      nthWeekday(year, 1, 1, 3),  // Washington's Birthday
      lastWeekday(year, 4, 1),    // Memorial Day
      nthWeekday(year, 8, 1, 1),  // Labor Day
      nthWeekday(year, 9, 1, 2),  // Columbus Day
      nthWeekday(year, 10, 4, 4), // Thanksgiving
    ].map(FW.iso);
  };
  FW.isBusinessDay = function (d) {
    if (d.getDay() === 0 || d.getDay() === 6) return false;
    return !FW.bankHolidays(d.getFullYear()).includes(FW.iso(d));
  };
  FW.addBusinessDays = function (d, n) {
    let x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let left = n;
    while (left > 0) {
      x = FW.addDays(x, 1);
      if (FW.isBusinessDay(x)) left--;
    }
    return x;
  };

  FW.money = function (n) {
    return (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  // Copy text, falling back to selecting it when the clipboard is refused.
  FW.copy = function (text, fallbackEl) {
    const done = () => true;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(done, () => select());
    }
    return Promise.resolve(select());
    function select() {
      if (!fallbackEl) return false;
      fallbackEl.hidden = false;
      fallbackEl.value = text;
      fallbackEl.focus();
      fallbackEl.select();
      return false;
    }
  };

  root.FW = FW;
  if (typeof module !== "undefined") module.exports = FW;
})(typeof window !== "undefined" ? window : globalThis);
