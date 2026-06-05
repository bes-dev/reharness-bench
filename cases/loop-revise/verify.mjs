import { readFileSync, readdirSync, statSync } from "fs";
import { resolve } from "path";

/** The loop's job is a tagline that actually satisfies the constraint: a line ≤ 40 chars containing the product
 *  name. We scan every text file the command produced (skipping the input fixture + compiler scratch) and pass
 *  iff some line meets both rules — so the loop can't "pass" by emitting an over-length or off-brand tagline. */
function lines(dir, skip, acc) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === ".reharness" || e.name === "node_modules" || e.name === "_fixture") continue;
    const p = resolve(dir, e.name);
    if (e.isDirectory()) lines(p, skip, acc);
    else if (/\.(txt|md)$/i.test(e.name) && !skip.has(p) && statSync(p).size < 100_000) {
      for (const l of readFileSync(p, "utf-8").split("\n")) { const t = l.trim().replace(/^[#>*\-`\s]+|[`*\s]+$/g, ""); if (t) acc.push(t); }
    }
  }
}

export default function verify(proj, _meta, skip) {
  const acc = [];
  lines(proj, skip ?? new Set(), acc);
  const hit = acc.find(l => l.length <= 40 && /reharness/i.test(l));
  return hit
    ? { pass: true, details: `tagline "${hit}" len=${hit.length} ≤40 ✓, name ✓` }
    : { pass: false, details: `no line ≤40 chars containing the product name (saw ${acc.length} lines)` };
}
