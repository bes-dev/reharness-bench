/** SCALE instances: large ledgers (R regions × many rows). reharness compiles to 0-agent code → exact, $0, any
 *  size. A live agent must sum hundreds of rows in-context → cost climbs and arithmetic drifts. Gold = every
 *  region's exact total (substring-safe, demo-echo-proof). Instance i scales R and rows to probe the curve. */
import { rng, int, pick } from "../../instances-lib.mts";

export const count = 4;
const REGIONS = ["EMEA", "APAC", "AMER", "LATAM", "MEA", "ANZ", "NORDIC", "IBERIA", "DACH", "BENELUX", "SEA", "CHINA"];

export default function gen(i: number) {
  const r = rng(7000 + i);
  const R = [6, 8, 10, 12][i];                                   // scale the region count per instance
  const rowsPerRegion = [20, 30, 40, 50][i];                     // ...and the row count → up to 600 rows
  const regions = REGIONS.slice(0, R);
  let totals: number[] = [];
  do {
    totals = regions.map(() => int(r, 1000, 9000));
    const s = totals.map(String);
  } while (new Set(totals).size !== totals.length || totals.some((a, x) => totals.some((b, y) => x !== y && String(b).includes(String(a)))));
  const rows: string[] = [];
  regions.forEach((reg, k) => {
    let rest = totals[k];
    for (let p = rowsPerRegion; p > 1; p--) { const cut = int(r, 1, Math.max(1, Math.floor(rest / p) * 2)); rows.push(`${reg},${cut}`); rest -= cut; }
    rows.push(`${reg},${rest}`);
  });
  for (let k = rows.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [rows[k], rows[j]] = [rows[j], rows[k]]; }
  return { files: { "sales.csv": "region,amount\n" + rows.join("\n") + "\n" }, expectPresent: totals.map(String) };
}
