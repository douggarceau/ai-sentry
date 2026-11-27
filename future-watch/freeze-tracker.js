/* Credit Freeze Tracker: records freeze status at each bureau, for each person
   in the household, in this browser only. */
(function (root) {
  const FW = root.FW;
  const BUREAUS = [
    { id: "equifax", name: "Equifax", href: "https://www.equifax.com/personal/credit-report-services/credit-freeze/", phone: "1-888-298-0045" },
    { id: "experian", name: "Experian", href: "https://www.experian.com/freeze/center.html", phone: "1-888-397-3742" },
    { id: "transunion", name: "TransUnion", href: "https://www.transunion.com/credit-freeze", phone: "1-888-909-8872" },
  ];
  const STATUS = { none: "Not frozen", frozen: "Frozen", lifted: "Temporarily lifted" };

  document.addEventListener("DOMContentLoaded", () => {
    const root_ = document.getElementById("freeze-app");
    if (!root_) return;
    let state = FW.load("freeze", { people: [{ id: "p1", name: "Me", rec: {} }] });

    function save() { FW.save("freeze", state); }

    function render() {
      const today = FW.today();
      let total = 0, frozen = 0;
      let h = "";
      for (const p of state.people) {
        h += `<section class="tool-card" aria-label="${FW.esc(p.name)}"><div class="row-head">
          <label class="inline-label" for="name-${p.id}">Person</label>
          <input id="name-${p.id}" data-name="${p.id}" value="${FW.esc(p.name)}" maxlength="40">
          ${state.people.length > 1 ? `<button type="button" class="btn-quiet" data-remove="${p.id}">Remove</button>` : ""}</div>
          <div class="table-wrap"><table class="grid"><thead><tr><th scope="col">Bureau</th><th scope="col">Status</th><th scope="col">Date</th><th scope="col">Lift ends</th><th scope="col">Go to</th></tr></thead><tbody>`;
        for (const b of BUREAUS) {
          const r = p.rec[b.id] || { status: "none", date: "", until: "" };
          total++;
          let st = r.status;
          // A temporary lift that has ended means the freeze is back on.
          if (st === "lifted" && r.until && FW.parseDate(r.until) < today) st = "frozen";
          if (st === "frozen") frozen++;
          const chip = st === "frozen" ? "chip-ok" : st === "lifted" ? "chip-2" : "chip-3";
          const sid = `${p.id}-${b.id}`;
          h += `<tr><th scope="row">${b.name}</th>
            <td><span class="chip ${chip}">${STATUS[st]}</span>
              <label class="sr" for="st-${sid}">Status at ${b.name}</label>
              <select id="st-${sid}" data-p="${p.id}" data-b="${b.id}" data-f="status">
                ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${r.status === k ? " selected" : ""}>${v}</option>`).join("")}
              </select></td>
            <td><label class="sr" for="dt-${sid}">Date placed or changed at ${b.name}</label><input type="date" id="dt-${sid}" data-p="${p.id}" data-b="${b.id}" data-f="date" value="${r.date || ""}"></td>
            <td><label class="sr" for="un-${sid}">Lift ends at ${b.name}</label><input type="date" id="un-${sid}" data-p="${p.id}" data-b="${b.id}" data-f="until" value="${r.until || ""}" ${r.status === "lifted" ? "" : "disabled"}></td>
            <td><a href="${b.href}" target="_blank" rel="noopener">${b.name} freeze</a><br><span class="muted">${b.phone}</span></td></tr>`;
        }
        h += `</tbody></table></div></section>`;
      }
      const all = frozen === total;
      h = `<p class="verdict ${all ? "verdict-none" : "verdict-medium"}" role="status"><strong>${frozen} of ${total}</strong> freezes in place${all ? ". Every bureau is frozen for everyone listed." : ". You need a freeze at all three bureaus for it to work."}</p>` + h;
      root_.innerHTML = h;
    }

    root_.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.name) {
        state.people.find((p) => p.id === t.dataset.name).name = t.value.trim() || "Unnamed";
      } else if (t.dataset.p) {
        const p = state.people.find((x) => x.id === t.dataset.p);
        const r = (p.rec[t.dataset.b] = p.rec[t.dataset.b] || { status: "none", date: "", until: "" });
        r[t.dataset.f] = t.value;
        if (t.dataset.f === "status" && t.value !== "none" && !r.date) r.date = FW.iso(FW.today());
        if (t.dataset.f === "status" && t.value !== "lifted") r.until = "";
      }
      save();
      const focusId = t.id;
      render();
      const again = document.getElementById(focusId);
      if (again) again.focus();
    });
    root_.addEventListener("click", (e) => {
      const id = e.target.dataset.remove;
      if (!id) return;
      state.people = state.people.filter((p) => p.id !== id);
      save();
      render();
    });
    document.getElementById("freeze-add").addEventListener("click", () => {
      const id = "p" + Date.now().toString(36);
      state.people.push({ id, name: "Child or family member", rec: {} });
      save();
      render();
      document.getElementById("name-" + id).select();
    });
    document.getElementById("freeze-reset").addEventListener("click", () => {
      state = { people: [{ id: "p1", name: "Me", rec: {} }] };
      FW.clear("freeze");
      render();
    });
    render();
  });
})(typeof window !== "undefined" ? window : globalThis);
