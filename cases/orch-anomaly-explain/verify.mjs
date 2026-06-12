/** L4 for orch-anomaly-explain. The compiled command must produce an anomalies list (anomalies.json anywhere in
 *  the project, or ids inline in a report) flagging 104 + 105 + EXACTLY ONE of the AC-2207 pair {106, 109}
 *  (which row of a bounced-and-resubmitted pair you flag is a defensible judgment either way), with NO false
 *  positives among the legitimate rows (101,102,103,107,108,110). */
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { resolve } from "path";

function collect(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "reharness" || e.name === "node_modules") continue;
    const p = resolve(dir, e.name);
    if (e.isDirectory()) collect(p, out);
    else if (/\.(json|md|txt|csv)$/i.test(e.name) && statSync(p).size < 500_000) {
      try { out.push(readFileSync(p, "utf-8")); } catch { /* skip */ }
    }
  }
  return out;
}

export default function verify(proj, _meta, preexisting) {
  // only files the command newly produced (the input fixture rows must not count as "flagged")
  const texts = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "reharness" || e.name === "node_modules") continue;
      const p = resolve(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (!preexisting.has(p) && /\.(json|md|txt)$/i.test(e.name)) {
        try { texts.push(readFileSync(p, "utf-8")); } catch { /* skip */ }
      }
    }
  };
  walk(proj);
  const t = texts.join("\n");
  const flagged = (id) => new RegExp(`\\b${id}\\b`).test(t);
  const both = flagged(106) && flagged(109);
  const neither = !flagged(106) && !flagged(109);
  const falsePos = [101, 102, 103, 107, 108, 110].filter(id =>
    new RegExp(`(anomal|duplicate|double|personal|flag)[^\\n]{0,160}\\b${id}\\b|\\b${id}\\b[^\\n]{0,160}(anomal|duplicate|double|personal|flag)`, "i").test(t));
  const pass = flagged(104) && flagged(105) && !both && !neither && falsePos.length === 0;
  return {
    pass,
    details: `104:${flagged(104)} 105:${flagged(105)} pair(106|109):${both ? "BOTH" : neither ? "NEITHER" : "one ✓"}` +
      (falsePos.length ? ` | false positives: ${falsePos.join(",")}` : ""),
  };
}
