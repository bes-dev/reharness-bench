/** Held-out instances: per-region revenue totals from a fresh CSV. Gold = ALL region totals (stronger than the
 *  demo's single number). Totals are regenerated until pairwise substring-safe (no "85" hiding inside "850")
 *  and never equal to the demo's 850 — so neither substring luck nor demo-echo can pass. */
import { rng, int, pick } from "../../instances-lib.mts";

export const count = 8;

const REGIONS = ["EMEA", "APAC", "AMER", "LATAM"];

export default function gen(i: number) {
  const r = rng(5000 + i);
  const regions = pick(r, REGIONS, 3);
  let totals: number[] = [];
  do {
    totals = regions.map(() => int(r, 120, 980));
    const strs = totals.map(String);
    const substringy = strs.some((a, x) => strs.some((b, y) => x !== y && b.includes(a)));
    if (!substringy && !totals.includes(850) && new Set(totals).size === totals.length) break;
  } while (true);
  // split each region's total into 2-4 rows that sum exactly to it
  const rows: string[] = [];
  regions.forEach((reg, k) => {
    let rest = totals[k];
    const parts = int(r, 2, 4);
    for (let p = parts; p > 1; p--) {
      const cut = int(r, 1, rest - (p - 1));
      rows.push(`${reg},${cut}`); rest -= cut;
    }
    rows.push(`${reg},${rest}`);
  });
  for (let k = rows.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [rows[k], rows[j]] = [rows[j], rows[k]]; }
  return { files: { "sales.csv": "region,amount\n" + rows.join("\n") + "\n" }, expectPresent: totals.map(String) };
}
