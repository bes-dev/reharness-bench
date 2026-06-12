/**
 * Baselines for RC-Bench — what you'd do INSTEAD of compiling, measured on the SAME held-out instances and the
 * SAME verifiers as the compiled pipelines. The trace is the compile INPUT; baselines run on the instances.
 *
 *   live    — a fresh re-reasoning Pi agent on EACH instance (no compilation). The amortization baseline:
 *             measures per-run cost + correctness of "re-derive the whole task every time".
 *   oneshot — ONE script written by the model from the trace ("write a script for any input"), then run on every
 *             instance ($0 after generation). The naive-codegen baseline: tests whether reharness's compilation
 *             beats just asking for a script. Expected to pass mechanical, fail judgment — that asymmetry is the point.
 *
 * Model is PINNED (claude-opus-4-7, reharness's Pi default) for apples-to-apples with the compiled leaves.
 * Usage: node --import tsx baseline.mts <live|oneshot> [family ...]
 */
import { spawn, execFileSync } from "child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CASES = resolve(ROOT, "cases");
const WORK = resolve(ROOT, ".work/baseline");
const MODEL = process.env.RCBENCH_MODEL || "claude-opus-4-7";   // PINNED — record in results

/** Same presence-based scoring the bench uses (verifyText), replicated here to score baseline outputs identically. */
function collectText(dir: string, skip: Set<string>): string {
  let text = "";
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "reharness" || e.name.startsWith(".")) continue;
    const p = resolve(dir, e.name);
    if (e.isDirectory()) text += collectText(p, skip);
    else if (!skip.has(p) && /\.(md|txt|json|csv|html|tsv|log)$/i.test(e.name) && statSync(p).size < 2_000_000) {
      try { text += "\n" + readFileSync(p, "utf-8"); } catch { /* skip */ }
    }
  }
  return text;
}
function score(dir: string, exp: string[], decoy: string[], skip: Set<string>): { pass: boolean; details: string } {
  const text = collectText(dir, skip).toLowerCase();
  const present = exp.filter(k => text.includes(k.toLowerCase()));
  const leaked = decoy.filter(k => text.includes(k.toLowerCase()));
  return { pass: present.length === exp.length, details: `found ${present.length}/${exp.length}${leaked.length ? ` | decoy leaked: ${leaked.join(",")}` : ""}` };
}
function snapshot(dir: string, acc = new Set<string>()): Set<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) snapshot(p, acc); else acc.add(p);
  }
  return acc;
}

/** Run a fresh Pi agent (pinned model) in `cwd` with `task`; returns observed cost summed from message_end events. */
function runAgent(cwd: string, task: string, timeoutMs = 600_000): Promise<{ costUSD: number }> {
  return new Promise((res) => {
    const p = spawn("pi", ["--mode", "json", "-p", "--no-session", "--model", MODEL, task], { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let buf = "", cost = 0;
    const onData = (d: Buffer) => {
      buf += d.toString();
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
        try { const e = JSON.parse(line); if (e.type === "message_end" && e.message?.usage?.cost?.total) cost += e.message.usage.cost.total; } catch { /* skip */ }
      }
    };
    p.stdout.on("data", onData);
    const t = setTimeout(() => p.kill("SIGKILL"), timeoutMs);
    p.on("close", () => { clearTimeout(t); res({ costUSD: cost }); });
  });
}

interface FamilyResult { family: string; mode: string; passed: number; total: number; costUSD: number; genScriptCost?: number }

async function runFamily(family: string, mode: "live" | "oneshot"): Promise<FamilyResult | null> {
  const dir = resolve(CASES, family);
  const genPath = resolve(dir, "instances.mts");
  if (!existsSync(genPath)) return null;
  const meta = JSON.parse(readFileSync(resolve(dir, "meta.json"), "utf-8"));
  const gen = await import(genPath);
  const K: number = gen.count ?? 5;
  const base = resolve(WORK, `${family}-${mode}`);
  rmSync(base, { recursive: true, force: true }); mkdirSync(base, { recursive: true });
  let passed = 0, cost = 0, genScriptCost = 0, scriptPath = "";

  // oneshot: write ONE script from the trace, once.
  if (mode === "oneshot") {
    const gdir = resolve(base, "_gen"); mkdirSync(gdir, { recursive: true });
    const trace = existsSync(resolve(dir, meta.session || "")) ? readFileSync(resolve(dir, meta.session), "utf-8").slice(0, 40_000) : "";
    const prompt = `Here is a recorded agent session solving a task:\n\n<session>\n${trace}\n</session>\n\nWrite a SINGLE standalone Node.js script \`solve.mjs\` (ESM, no extra deps beyond what npm provides) that performs the SAME task for ANY input. It takes the input path as process.argv[2] (a directory or file as the session implies) and writes the same kind of output files into that directory (or cwd). Write ONLY the file solve.mjs into the current directory. No prose.`;
    process.stdout.write(`[${family}/oneshot] generating script from trace…\n`);
    genScriptCost = (await runAgent(gdir, prompt)).costUSD;
    scriptPath = resolve(gdir, "solve.mjs");
    if (!existsSync(scriptPath)) { process.stdout.write(`  ⚠ no solve.mjs produced — oneshot fails this family\n`); return { family, mode, passed: 0, total: K, costUSD: 0, genScriptCost }; }
  }

  for (let i = 0; i < K; i++) {
    const spec = gen.default(i);
    const idir = resolve(base, `inst${i}`); mkdirSync(idir, { recursive: true });
    for (const [rel, content] of Object.entries(spec.files) as [string, string][]) {
      mkdirSync(dirname(resolve(idir, rel)), { recursive: true });
      writeFileSync(resolve(idir, rel), content);
    }
    const pre = snapshot(idir);
    if (mode === "live") {
      const task = `${meta.task.replace(/^MINED[^:]*:\s*/, "").replace(/^[A-Z-]+ (orchestra|partial-amortization|single-judgment)[^:]*:\s*/, "")}\n\nThe input files are in the current directory. Do the task and write all output files into the current directory.`;
      cost += (await runAgent(idir, task)).costUSD;
    } else {
      try { execFileSync("node", [scriptPath, idir], { cwd: idir, timeout: 120_000, stdio: "ignore" }); } catch { /* script may throw; score anyway */ }
    }
    const r = spec.verify ? spec.verify(idir, pre) : score(idir, spec.expectPresent ?? [], spec.decoyAbsent ?? [], pre);
    if (r.pass) passed++;
    process.stdout.write(`  [${family}/${mode}] inst${i}: ${r.pass ? "PASS" : "FAIL"} (${r.details})\n`);
  }
  return { family, mode, passed, total: K, costUSD: cost, genScriptCost };
}

async function main() {
  const mode = process.argv[2] as "live" | "oneshot";
  if (mode !== "live" && mode !== "oneshot") { console.error("usage: baseline.mts <live|oneshot> [family ...]"); process.exit(1); }
  const only = process.argv.slice(3);
  const families = readdirSync(CASES, { withFileTypes: true }).filter(e => e.isDirectory() && existsSync(resolve(CASES, e.name, "instances.mts"))).map(e => e.name).filter(f => !only.length || only.includes(f));
  const results: FamilyResult[] = [];
  for (const f of families) { const r = await runFamily(f, mode); if (r) results.push(r); }
  console.log(`\n══════════ baseline: ${mode} · model ${MODEL} ══════════`);
  for (const r of results) console.log(`${r.family.padEnd(24)} ${r.passed}/${r.total}  $${(r.costUSD + (r.genScriptCost || 0)).toFixed(4)}${mode === "oneshot" ? ` (gen $${(r.genScriptCost || 0).toFixed(4)})` : ""}`);
  const p = results.reduce((s, r) => s + r.passed, 0), t = results.reduce((s, r) => s + r.total, 0);
  const c = results.reduce((s, r) => s + r.costUSD + (r.genScriptCost || 0), 0);
  console.log(`──────────────────────────────────────────────`);
  console.log(`total ${p}/${t} instances · $${c.toFixed(4)} · ${mode === "live" ? `$${(c / t).toFixed(4)}/instance (re-reasoning every run)` : "script reused across instances"}`);
}
main().catch(e => { console.error(e); process.exit(1); });
