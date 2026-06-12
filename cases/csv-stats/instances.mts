/** Held-out instances: same task (count rows, total the amount column), fresh data. The gold is the
 *  instance's own total — a pipeline that echoes the demo's 180 fails every instance (no total is ever 180). */
import { rng, int } from "../../instances-lib.mts";

export const count = 8;

const PRODUCTS = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota", "kappa", "lambda", "mu"];

export default function gen(i: number) {
  const r = rng(1000 + i);
  let rows: number[] = [], total = 0;
  do { // never let an instance's total collide with the demo's gold (180)
    const n = int(r, 8, 14);
    rows = Array.from({ length: n }, () => int(r, 10, 99));
    total = rows.reduce((s, x) => s + x, 0);
  } while (total === 180);
  const csv = "id,product,amount\n" + rows.map((a, k) => `${k + 1},${PRODUCTS[k % PRODUCTS.length]},${a}`).join("\n") + "\n";
  return { files: { "sales.csv": csv }, expectPresent: [String(total)] };
}
