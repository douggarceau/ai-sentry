/* Subscription & Fee Tracker: totals recurring charges and flags renewals,
   ending free trials and price increases. Data stays in this browser. */
(function (root) {
  const FW = root.FW || (typeof require !== "undefined" ? require("./tools-common.js") : null);
  const PER_YEAR = { weekly: 52, monthly: 12, quarterly: 4, yearly: 1 };
  const STEP = { weekly: [0, 7], monthly: [1, 0], quarterly: [3, 0], yearly: [12, 0] };

  // Next charge on or after `from`, given the date of any past or future charge.
  function nextCharge(dateStr, cycle, from) {
    let d = FW.parseDate(dateStr);
    if (!d) return null;
    const [months, days] = STEP[cycle];
    const anchorDay = d.getDate();
    let i = 0;
    while (d < from && i++ < 2000) {
      if (days) d = FW.addDays(d, days);
      else {
        const m = d.getMonth() + months;
        const y = d.getFullYear() + Math.floor(m / 12);
        const mm = ((m % 12) + 12) % 12;
        const last = new Date(y, mm + 1, 0).getDate();
        d = new Date(y, mm, Math.min(anchorDay, last));
      }
    }
    return d;
  }

  function summarize(items, today) {
    let yearly = 0;
    const alerts = [];
    const rows = items.map((it) => {
      const amt = Number(it.amount) || 0;
      const perYear = amt * (PER_YEAR[it.cycle] || 0);
      if (!it.cancelled) yearly += perYear;
      const next = it.cancelled ? null : nextCharge(it.date, it.cycle, today);
      const days = next ? FW.daysBetween(today, next) : null;
      if (!it.cancelled) {
        if (it.trial && next && days <= 7) alerts.push({ level: 3, id: it.id, text: `${it.name}: free trial turns into a ${FW.money(amt)} charge ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`} (${FW.fmt(next)}). Cancel now if you don't want it.` });
        else if (next && days <= 7) alerts.push({ level: 2, id: it.id, text: `${it.name}: ${FW.money(amt)} renews ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`} (${FW.fmt(next)}).` });
        else if (it.cycle === "yearly" && next && days <= 30) alerts.push({ level: 2, id: it.id, text: `${it.name}: yearly renewal of ${FW.money(amt)} in ${days} days (${FW.fmt(next)}).` });
        const prev = Number(it.previous);
        if (prev && amt > prev) alerts.push({ level: 2, id: it.id, text: `${it.name}: price went up from ${FW.money(prev)} to ${FW.money(amt)} (${Math.round(((amt - prev) / prev) * 100)}% more, ${FW.money((amt - prev) * (PER_YEAR[it.cycle] || 0))} a year).` });
        if (!it.used) alerts.push({ level: 1, id: it.id, text: `${it.name}: marked as not used. Cancelling saves ${FW.money(perYear)} a year.` });
      }
      return { ...it, perYear, next, days };
    });
    alerts.sort((a, b) => b.level - a.level);
    return { rows, yearly, monthly: yearly / 12, alerts };
  }

  function toCSV(items) {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Name", "Amount", "Cycle", "Charge date", "Free trial", "Previous price", "Used", "Cancelled", "Cancel link"];
    return [head, ...items.map((i) => [i.name, i.amount, i.cycle, i.date, i.trial ? "yes" : "no", i.previous || "", i.used ? "yes" : "no", i.cancelled ? "yes" : "no", i.cancel || ""])]
      .map((r) => r.map(q).join(",")).join("\n");
  }

  const Subs = { nextCharge, summarize, toCSV };
  root.FWSubs = Subs;
  if (typeof module !== "undefined") module.exports = Subs;

  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("sub-form");
    if (!form) return;
    const out = document.getElementById("sub-result");
    let items = FW.load("subs", null);
    const example = items === null;
    if (example) {
      const t = FW.today();
      items = [
        { id: "ex1", name: "Example: streaming service", amount: "17.99", cycle: "monthly", date: FW.iso(FW.addDays(t, 3)), previous: "15.49", used: true, example: true },
        { id: "ex2", name: "Example: photo app free trial", amount: "59.99", cycle: "yearly", date: FW.iso(FW.addDays(t, 2)), trial: true, used: false, example: true },
        { id: "ex3", name: "Example: gym membership", amount: "40", cycle: "monthly", date: FW.iso(FW.addDays(t, -20)), used: false, example: true },
      ];
    }
    const save = () => FW.save("subs", items.filter((i) => !i.example));

    function render() {
      const s = summarize(items, FW.today());
      const hasExample = items.some((i) => i.example);
      let h = hasExample ? `<p class="note">These three rows are examples to show how the tracker works. They disappear when you add your first subscription, or <button type="button" class="linklike" id="sub-clear-ex">remove them now</button>.</p>` : "";
      h += `<div class="stats"><div><span class="stat">${FW.money(s.monthly)}</span><span class="muted">a month</span></div><div><span class="stat">${FW.money(s.yearly)}</span><span class="muted">a year</span></div><div><span class="stat">${items.filter((i) => !i.cancelled).length}</span><span class="muted">active</span></div></div>`;
      if (s.alerts.length) {
        h += `<h3>Needs attention</h3><ul class="findings">${s.alerts.map((a) => `<li class="sev-${a.level}"><span class="chip chip-${a.level}">${a.level === 3 ? "Act now" : a.level === 2 ? "Soon" : "Review"}</span> ${FW.esc(a.text)}</li>`).join("")}</ul>`;
      }
      if (s.rows.length) {
        h += `<h3>Your subscriptions</h3><div class="table-wrap"><table class="grid"><thead><tr><th scope="col">Name</th><th scope="col">Price</th><th scope="col">Per year</th><th scope="col">Next charge</th><th scope="col">Actions</th></tr></thead><tbody>`;
        for (const r of s.rows) {
          h += `<tr class="${r.cancelled ? "muted-row" : ""}"><th scope="row">${FW.esc(r.name)}${r.trial ? ' <span class="chip chip-2">trial</span>' : ""}${r.cancelled ? ' <span class="chip chip-ok">cancelled</span>' : ""}</th>
            <td class="num">${FW.money(r.amount)} / ${r.cycle.replace("ly", "").replace("dai", "day")}</td><td class="num">${r.cancelled ? "–" : FW.money(r.perYear)}</td>
            <td>${r.next ? FW.fmt(r.next) : "–"}</td>
            <td class="actions">${r.cancel ? `<a href="${FW.esc(r.cancel)}" target="_blank" rel="noopener">Cancel page</a> ` : ""}
              <button type="button" class="btn-quiet" data-toggle="${r.id}">${r.cancelled ? "Restore" : "Mark cancelled"}</button>
              <button type="button" class="btn-quiet" data-del="${r.id}" aria-label="Delete ${FW.esc(r.name)}">Delete</button></td></tr>`;
        }
        h += `</tbody></table></div>`;
        h += `<p><button type="button" class="btn-quiet" id="sub-csv">Copy as CSV</button> <span id="sub-copied" class="muted" aria-live="polite"></span></p><textarea id="sub-csv-out" class="csv" hidden readonly aria-label="CSV export"></textarea>`;
      }
      out.innerHTML = h;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = form;
      if (!f.sname.value.trim() || !f.amount.value || !f.date.value) return;
      let cancel = f.cancel.value.trim();
      if (cancel && !/^https?:\/\//i.test(cancel)) cancel = "https://" + cancel;
      items = items.filter((i) => !i.example);
      items.push({ id: "s" + Date.now().toString(36), name: f.sname.value.trim(), amount: f.amount.value, cycle: f.cycle.value, date: f.date.value,
        trial: f.trial.checked, previous: f.previous.value, used: f.used.checked, cancel });
      save();
      f.reset();
      f.used.checked = true;
      render();
      f.sname.focus();
    });
    out.addEventListener("click", (e) => {
      const t = e.target;
      if (t.id === "sub-clear-ex") { items = items.filter((i) => !i.example); save(); render(); }
      else if (t.dataset.toggle) { const it = items.find((i) => i.id === t.dataset.toggle); it.cancelled = !it.cancelled; save(); render(); }
      else if (t.dataset.del) { items = items.filter((i) => i.id !== t.dataset.del); save(); render(); }
      else if (t.id === "sub-csv") {
        FW.copy(toCSV(items.filter((i) => !i.example)), document.getElementById("sub-csv-out")).then((ok) => {
          document.getElementById("sub-copied").textContent = ok ? "Copied." : "Select the text below and copy it.";
        });
      }
    });
    render();
  });
})(typeof window !== "undefined" ? window : globalThis);
