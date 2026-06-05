import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

/** The corrected COPY is the deliverable (the pipeline writes it to config.output, default `clean.md`, next to the
 *  draft). Gold = that file exists, has content, and carries none of the planted misspellings. We target the
 *  output file by name — NOT "no typo anywhere", because the error-report summary legitimately quotes the typos
 *  it fixed (e.g. "teh → the"). */
function findOutputs(dir, acc) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === ".reharness" || e.name === "node_modules") continue;
    const p = resolve(dir, e.name);
    if (e.isDirectory()) findOutputs(p, acc);
    else if (e.name === "clean.md") acc.push(p);
  }
}

export default function verify(proj) {
  const acc = [];
  findOutputs(proj, acc);
  if (!acc.length) return { pass: false, details: "no corrected copy (clean.md) produced" };
  const body = acc.map(p => readFileSync(p, "utf-8")).join("\n");
  const typos = [/\bteh\b/i, /recieve/i, /definately/i, /beleive/i].filter(re => re.test(body)).map(r => String(r));
  const hasContent = /\b(fox|package|team)\b/i.test(body);
  return {
    pass: hasContent && typos.length === 0,
    details: !hasContent ? "clean.md is empty/contentless" : (typos.length ? `typos survived in clean.md: ${typos.join(",")}` : "corrected clean.md, no planted typos ✓"),
  };
}
