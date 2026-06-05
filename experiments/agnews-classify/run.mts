/** Self-benchmark — JUDGMENT-HEAVY contrast to the mechanical τ-bench families (see ../SUMMARY.md). AG News
 *  topic classification (fancyzhx/ag_news): the workflow (read → classify → write) is compiled and REUSED, but
 *  its core is an AGENT leaf, so every run DOES pay an LLM call. This is the PARTIAL-amortization regime:
 *  structure is amortized, the judgment is not. We measure accuracy (= judgment quality, not 100% by
 *  construction) and the agent's determinism (pass^k), against third-party gold labels.
 *  Run:  node --import tsx experiments/agnews-classify/run.mts   (compile the agnews-classify case first) */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(HERE, "../../.work/agnews-classify");
const CLI = process.env.REHARNESS_CLI;
const K = 2;                                                       // determinism trials (each costs an LLM call)
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");  // "Sci/Tech" → "scitech"

/** One classification run: write the article to a workdir, run the pipeline, read its predicted label. */
function classify(text: string): string {
  const dir = mkdtempSync(join(tmpdir(), "agn-"));
  writeFileSync(join(dir, "article.txt"), text);
  CLI ? spawnSync("node", [CLI, "agnews-classify", dir], { cwd: PROJECT, encoding: "utf-8" })
      : spawnSync("reharness", ["agnews-classify", dir], { cwd: PROJECT, encoding: "utf-8" });
  const out = join(dir, "classification.txt");
  return existsSync(out) ? readFileSync(out, "utf-8").trim() : "";
}

function main() {
  const instances = JSON.parse(readFileSync(resolve(HERE, "instances.json"), "utf-8"));
  if (!existsSync(PROJECT)) { console.error(`No compiled pipeline at ${PROJECT} — compile the agnews-classify case first.`); process.exit(1); }
  console.log(`\n══ AG News topic classification (N=${instances.length}, k=${K}) — JUDGMENT-heavy, compile-once → replay ══\n`);
  console.log("gold        predicted     correct  stable(k)");
  let correct = 0, stable = 0;
  for (const inst of instances) {
    const preds: string[] = [];
    for (let i = 0; i < K; i++) preds.push(classify(inst.text));
    const same = preds.every(p => norm(p) === norm(preds[0]));
    const ok = norm(preds[0]) === norm(inst.label) || norm(preds[0]).includes(norm(inst.label));
    if (ok) correct++;
    if (same) stable++;
    console.log(`${inst.label.padEnd(11)} ${preds[0].slice(0, 12).padEnd(13)} ${ok ? "  ✓ " : "  ✗ "}    ${same ? "1.0" : "<1"}`);
  }
  const acc = (100 * correct / instances.length).toFixed(0);
  console.log("──────────────────────────────────────────────");
  console.log(`A·amortization: ~1 LLM call / run (the classify leaf is an AGENT) — PARTIAL: the workflow is`);
  console.log(`                amortized to a fixed pipeline, the judgment is NOT (contrast: τ families = 0 LLM/run)`);
  console.log(`B·determinism:  ${stable}/${instances.length} instances gave an identical label across k=${K} trials`);
  console.log(`C·cross-inst:   one compiled pipeline reused across all ${instances.length} articles`);
  console.log(`D·correctness:  ${correct}/${instances.length} = ${acc}% accuracy vs AG News gold (= judgment quality, not 100% by construction)`);
}
main();
