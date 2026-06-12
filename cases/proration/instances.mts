/** Held-out instances for the proration billing engine. Each instance is a fresh batch of accounts that PLANTS
 *  the edge cases (credit-exceeds-subtotal, per-segment-rounding divergence, multi-change chains, mid-cycle
 *  cancel). Gold = the hidden reference implementation (validated against hand-computed cases). verify() finds
 *  the produced invoices.json and checks EVERY account's total exactly — so a script that misses the credit
 *  floor or rounds once (instead of per-segment) fails on the planted traps. The compiler never sees reference.mjs. */
import { rng, int, pick } from "../../instances-lib.mts";
import { invoice } from "./reference.mjs";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { resolve } from "path";

export const count = 4;

function makeAccounts(seed: number, n: number) {
  const r = rng(seed);
  const accts: any[] = [];
  for (let id = 1; id <= n; id++) {
    const kind = id <= 4 ? ["credit-exceeds", "two-change", "cancel", "rounding-trap"][id - 1] : pick(r, ["plain", "credit-exceeds", "two-change", "cancel", "rounding-trap", "upgrade"], 1)[0];
    const tax = pick(r, [0, 8, 10, 20], 1)[0];
    let a: any = { account: id, monthly_price: int(r, 1000, 9900), tax_rate_percent: tax, credits: 0, events: [] };
    if (kind === "credit-exceeds") a.credits = a.monthly_price + int(r, 500, 3000);          // base must floor to 0
    else if (kind === "two-change") a.events = [{ day: int(r, 6, 12), type: "change", new_price: int(r, 1000, 9900) }, { day: int(r, 18, 25), type: "change", new_price: int(r, 1000, 9900) }];
    else if (kind === "cancel") a.events = [{ day: int(r, 5, 25), type: "cancel" }];
    else if (kind === "rounding-trap") { a.monthly_price = 1000; a.events = [{ day: 11, type: "change", new_price: 2000 }]; a.tax_rate_percent = 0; } // per-seg=1666 vs round-once=1667
    else if (kind === "upgrade") a.events = [{ day: int(r, 8, 22), type: "change", new_price: int(r, 1000, 9900) }];
    accts.push(a);
  }
  return accts;
}

function findNewest(dir: string, name: string, pre: Set<string>): string | undefined {
  let best: string | undefined, bestM = 0;
  const walk = (d: string) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === "reharness") continue;
      const p = resolve(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === name && !pre.has(p)) { const m = statSync(p).mtimeMs; if (m >= bestM) { bestM = m; best = p; } }
    }
  };
  walk(dir);
  return best;
}

export default function gen(i: number) {
  const n = [8, 8, 10, 12][i];
  const accts = makeAccounts(9100 + i, n);
  const gold = new Map<number, number>(accts.map(a => [a.account, invoice(a)]));
  return {
    files: { "accounts.json": JSON.stringify(accts, null, 2) + "\n", "rules.md": readFileSync(resolve(import.meta.dirname, "fixture/rules.md"), "utf-8") },
    verify(scanDir: string, pre: Set<string>) {
      const f = findNewest(scanDir, "invoices.json", pre);
      if (!f) return { pass: false, details: "no invoices.json produced" };
      let got: any[]; try { got = JSON.parse(readFileSync(f, "utf-8")); } catch { return { pass: false, details: "invoices.json not valid JSON" }; }
      const byAcct = new Map<number, number>(got.map((x: any) => [Number(x.account), Number(x.total)]));
      let correct = 0; const wrong: string[] = [];
      for (const [acct, want] of gold) { const g = byAcct.get(acct); if (g === want) correct++; else wrong.push(`a${acct}:${g}≠${want}`); }
      return { pass: correct === gold.size, details: `${correct}/${gold.size} exact${wrong.length ? ` [${wrong.slice(0, 4).join(" ")}]` : ""}` };
    },
  };
}
