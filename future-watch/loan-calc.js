/* Loan cost calculator: payment and total cost from an APR, or the true APR
   hidden in an offer that only quotes a payment. */
(function (root) {
  const FW = root.FW || (typeof require !== "undefined" ? require("./tools-common.js") : null);

  function payment(principal, aprPct, n) {
    const r = aprPct / 100 / 12;
    return r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
  }
  // APR that makes n payments of `pay` (perYear payments a year) repay `cash` received (bisection).
  function impliedAPR(cash, pay, n, perYear = 12) {
    if (pay * n <= cash) return 0;
    let lo = 0, hi = 50; // periodic rate as a fraction
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      const pv = (pay * (1 - Math.pow(1 + mid, -n))) / mid;
      if (pv > cash) lo = mid; else hi = mid;
    }
    return ((lo + hi) / 2) * perYear * 100;
  }
  const Loan = { payment, impliedAPR };
  root.FWLoan = Loan;
  if (typeof module !== "undefined") module.exports = Loan;

  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", () => {
    const f1 = document.getElementById("lc-form");
    if (!f1) return;
    const o1 = document.getElementById("lc-out");
    const f2 = document.getElementById("lc2-form");
    const o2 = document.getElementById("lc2-out");
    const flag = (apr) => apr > 36
      ? `<div class="verdict verdict-high"><strong>APR above 36%</strong><p>Consumer advocates treat 36% as the line for high-cost credit, and federal law caps loans to active-duty service members at 36%. Look for a cheaper option, such as a credit union payday-alternative loan.</p></div>`
      : apr > 20 ? `<div class="verdict verdict-medium"><strong>High interest</strong><p>Compare offers from banks and credit unions before you accept.</p></div>` : "";

    function calc1() {
      const P = +f1.amount.value, apr = +f1.apr.value, n = +f1.months.value, fee = +f1.fee.value || 0;
      if (!(P > 0 && n > 0 && apr >= 0)) { o1.innerHTML = ""; return; }
      const pay = payment(P, apr, n), total = pay * n;
      const cash = P - fee;
      const trueApr = fee > 0 ? impliedAPR(cash, pay, n) : apr;
      o1.innerHTML = `<div class="stats"><div><span class="stat">${FW.money(pay)}</span><span class="muted">a month</span></div>
        <div><span class="stat">${FW.money(total - P + fee)}</span><span class="muted">total cost of borrowing</span></div>
        <div><span class="stat">${FW.money(total)}</span><span class="muted">total repaid</span></div></div>` +
        (fee > 0 ? `<p>With the ${FW.money(fee)} fee taken out, you receive ${FW.money(cash)}, so the real APR is about <strong>${trueApr.toFixed(1)}%</strong>.</p>` : "") + flag(trueApr);
    }
    function calc2() {
      const cash = +f2.cash.value, pay = +f2.pay.value, n = +f2.count.value, every = f2.every.value;
      if (!(cash > 0 && pay > 0 && n > 0)) { o2.innerHTML = ""; return; }
      const perYear = every === "weekly" ? 52 : every === "biweekly" ? 26 : 12;
      const apr = impliedAPR(cash, pay, n, perYear);
      o2.innerHTML = `<div class="stats"><div><span class="stat">${apr > 999 ? ">999" : apr.toFixed(0)}%</span><span class="muted">true APR</span></div>
        <div><span class="stat">${FW.money(pay * n - cash)}</span><span class="muted">you pay in interest and fees</span></div></div>` + flag(apr);
    }
    f1.addEventListener("input", calc1);
    f2.addEventListener("input", calc2);
    f1.addEventListener("submit", (e) => e.preventDefault());
    f2.addEventListener("submit", (e) => e.preventDefault());
    calc1(); calc2();
  });
})(typeof window !== "undefined" ? window : globalThis);
