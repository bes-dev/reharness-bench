/**
 * reharness-bench — does `compile --from-session` produce a pipeline that actually WORKS (not just compiles)?
 *
 * Layered, gated metrics (cheap → expensive), grounded in execution-based skill-generation benchmarks
 * (SkillGenBench / SkillsBench): "compiles green" is NOT the bar — the artifact must RUN and accomplish the task.
 *
 *   L0 ingest      — the session (ANY format) was read + staged (format-agnostic)
 *   L1 compile     — verify is green (tsc + structural + dataflow), no errors
 *   L2 non-hollow  — the lib isn't a verify-passing STUB (the fix_verify failure mode): no empty "= '' // upstream"
 *                    placeholders, no dangling c.dir('<non-state>')
 *   L3 fidelity    — the PRD captures the task (mentions gold terms) AND an external target is parameterised (<arg>)
 *   L4 execution   — the compiled command is RUN on a fixture; a deterministic verifier checks the real outcome
 *
 * Run:  npm install && node --import tsx run.mts [<case-id>]   (needs the `reharness` CLI on PATH — `npm link reharness`)
 * Each case is a full compile (~minutes + tokens). NOT in `npm test`.
 */
import { execFileSync, spawn } from "child_process";
import { existsSync, mkdirSync, rmSync, readFileSync, readdirSync, statSync, cpSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer, type Server } from "http";

/** Install the compiled command's derived npm deps (manifest.json) into the project so it can RUN — this also
 *  exercises the provisioning path end-to-end. No-op when the manifest lists none. */
function installDeps(proj: string): void {
  const mf = resolve(proj, "reharness/manifest.json");
  if (!existsSync(mf)) return;
  let npm: string[] = [];
  try { npm = JSON.parse(readFileSync(mf, "utf-8")).npm || []; } catch { /* no manifest deps */ }
  if (!npm.length) return;
  process.stdout.write(`  installing npm dep(s): ${npm.join(", ")}\n`);
  try { execFileSync("npm", ["install", "--no-save", "--no-audit", "--no-fund", ...npm], { cwd: proj, timeout: 240_000, stdio: "ignore" }); }
  catch (e: any) { process.stdout.write(`  ⚠ npm install failed: ${e.message}\n`); }
}

const ROOT = dirname(fileURLToPath(import.meta.url));            // this bench repo's root
const CASES = resolve(ROOT, "cases");
const WORK = resolve(ROOT, ".work");
// The compiler under test is the `npm link`-ed global `reharness` CLI (runs dist/). Override with REHARNESS_CLI
// to point at a dist/cli.js in a working tree (e.g. ../pi-fsm/dist/cli.js) when testing an unreleased build.
const CLI = process.env.REHARNESS_CLI || "";

/** Run the compiled CLI ASYNC (spawn, not execFileSync) so the harness event loop stays free — a network case
 *  serves its fixture from a local HTTP server IN THIS PROCESS, which a blocking execFileSync would deadlock. */
const run = (cwd: string, args: string[], timeoutMs: number): Promise<{ code: number; out: string }> =>
  new Promise(res => {
    const p = CLI ? spawn("node", [CLI, ...args], { cwd, stdio: ["ignore", "pipe", "pipe"] })
                  : spawn("reharness", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    p.stdout.on("data", d => { out += d; });
    p.stderr.on("data", d => { out += d; });
    const timer = setTimeout(() => p.kill("SIGKILL"), timeoutMs);
    p.on("close", code => { clearTimeout(timer); res({ code: code ?? 1, out }); });
    p.on("error", e => { clearTimeout(timer); res({ code: 1, out: String(e) }); });
  });

/** Newest run-work directory (a `logs/run-<id>/work` folder) anywhere under `root` — where a compiled command
 *  writes its artifacts. */
function newestRunWork(root: string): string | null {
  let best: string | null = null, bestMtime = 0;
  const walk = (dir: string, depth: number) => {
    if (depth > 6) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const p = resolve(dir, e.name);
      if (e.name.startsWith("run-") && existsSync(resolve(p, "work"))) {
        const m = statSync(p).mtimeMs;
        if (m > bestMtime) { bestMtime = m; best = resolve(p, "work"); }
      } else if (e.name !== "node_modules") walk(p, depth + 1);
    }
  };
  if (existsSync(root)) walk(root, 0);
  return best;
}

/** Concatenate every small text artifact a compiled command produced, recursively. Outputs land EITHER in a
 *  run's work tree (c.out()) OR at the project root / a config.output path (a user-facing report file), so we
 *  scan the whole project — skipping `reharness` (the compiler's own scratch: PRD, session, meta-run logs, so
 *  we don't read the answer out of the staged session) and `node_modules`. `skip` holds the input fixture's
 *  pre-existing files so an extract-style task can't trivially "pass" by us re-reading its own scanned input. */
function collectText(dir: string, skip: Set<string>): string {
  let text = "";
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "reharness" || e.name === "node_modules") continue;
    const p = resolve(dir, e.name);
    if (e.isDirectory()) text += collectText(p, skip);
    else if (!skip.has(p) && /\.(md|txt|json|csv|html|tsv|log)$/i.test(e.name) && statSync(p).size < 2_000_000) {
      try { text += "\n" + readFileSync(p, "utf-8"); } catch { /* skip */ }
    }
  }
  return text;
}

/** Built-in L4 verifier core — PASS iff the compiled command's output contains every `expectPresent` string (the
 *  task's real outcome). `decoyAbsent` is a precision-bonus: a leaked decoy is WARNED, not failed — accomplishing
 *  the task is the gate; perfect precision is a separate signal. A case with bespoke logic ships verify.mjs. */
function verifyText(workDir: string, exp: string[], decoy: string[], skip: Set<string>): { pass: boolean; details: string } {
  const text = collectText(workDir, skip).toLowerCase();
  const present = exp.filter(k => text.includes(k.toLowerCase()));
  const leaked = decoy.filter(k => text.includes(k.toLowerCase()));
  return {
    pass: present.length === exp.length,
    details: `found ${present.length}/${exp.length}` + (leaked.length ? ` | ⚠ decoy leaked (precision): ${leaked.join(", ")}` : (decoy.length ? " | decoy excluded" : "")),
  };
}
function defaultVerify(workDir: string, meta: any, skip: Set<string>): { pass: boolean; details: string } {
  return verifyText(workDir, meta.execution.expectPresent || [], meta.execution.decoyAbsent || [], skip);
}

/** Every file path collectText would consider — snapshotted BEFORE an instance run so each held-out instance is
 *  verified ONLY against what it newly produced (prior instances' outputs can't cross-contaminate). */
function listScanned(dir: string, acc: Set<string>): void {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "reharness" || e.name === "node_modules") continue;
    const p = resolve(dir, e.name);
    if (e.isDirectory()) listScanned(p, acc); else acc.add(p);
  }
}

/** L4 for a MINED self-verifying task — run the project's OWN test command in the (mutated) fixture and pass iff
 *  its pass-marker appears. Objective gold: the task carried its own verifier, so correctness needs no author. */
function testVerify(fixtureDir: string, meta: any): { pass: boolean; details: string } {
  const cmd: string = meta.execution.testCommand || "node test.mjs";
  const marker: string = meta.execution.passMarker || "ALL TESTS PASS";
  try {
    const out = execFileSync("bash", ["-c", cmd], { cwd: fixtureDir, timeout: 60_000, encoding: "utf-8" });
    return { pass: out.includes(marker), details: `test \`${cmd}\` → ${out.includes(marker) ? "PASS" : "ran, no marker"}` };
  } catch (e: any) {
    return { pass: false, details: `test \`${cmd}\` FAILED: ${String(e.stdout || e.message || "").trim().split("\n").slice(-1)[0]}` };
  }
}

/** L2 — the lib is a verify-passing STUB? Detects the fix_verify failure mode + dangling stage reads. */
function hollowSmells(lib: string, states: string[]): string[] {
  const smells: string[] = [];
  if (/=\s*(['"`]['"`]|\[\]|\{\})\s*;?\s*\/\/[^\n]*\b(upstream|provided|stage|stub|placeholder|TODO)\b/i.test(lib))
    smells.push("empty placeholder assignment with an upstream/stub comment");
  const dangling = [...lib.matchAll(/c\.dir\(\s*['"`]([^'"`]+)['"`]/g)].map(m => m[1]).filter(s => !states.includes(s));
  if (dangling.length) smells.push(`c.dir() reads a non-existent stage: ${[...new Set(dangling)].join(", ")}`);
  return smells;
}

/** Parse the compiler's own observed spend from its stdout — the self-hosted compile pipeline prints a verdict
 *  line `runtime: N agent run(s) · X tokens · $Y` at its terminal (cost is OBSERVED by the runtime, summed per
 *  agent leaf). This is the one-time numerator of the amortization story: break-even N = compileCost / per-run
 *  saving. Last match wins — the final verdict line is the outermost pipeline's aggregate. */
function parseCompileUsage(out: string): CompileUsage | undefined {
  const ms = [...out.matchAll(/runtime: (\d+) agent run\(s\) · ([\d.]+)(k?) tokens · \$([\d.]+)/g)];
  if (!ms.length) return undefined;
  const m = ms[ms.length - 1];
  return { agentRuns: Number(m[1]), tokens: Math.round(parseFloat(m[2]) * (m[3] === "k" ? 1000 : 1)), costUSD: Number(m[4]) };
}

interface CompileUsage { agentRuns: number; tokens: number; costUSD: number }

/** One held-out instance of a case family, produced by the case's `instances.mts` generator:
 *  `export const count = K; export default (i: number) => InstanceSpec`. `files` are written into the
 *  instance dir (keys relative to it — the same tail `runArgs` reference after `fixture/`); the gold is
 *  per-instance, so a pipeline that echoes the DEMO's answer fails the instances where the answer differs. */
interface InstanceSpec { files: Record<string, string>; expectPresent: string[]; decoyAbsent?: string[]; runArgs?: string[] }
interface CaseResult { id: string; layers: Record<string, boolean | null>; notes: string[]; compile?: CompileUsage; instances?: { passed: number; total: number } }

async function runCase(id: string): Promise<CaseResult> {
  const dir = resolve(CASES, id);
  const meta = JSON.parse(readFileSync(resolve(dir, "meta.json"), "utf-8"));
  const proj = resolve(WORK, id);
  rmSync(proj, { recursive: true, force: true }); mkdirSync(proj, { recursive: true });
  const layers: Record<string, boolean | null> = { L0_ingest: null, L1_compile: null, L2_nonhollow: null, L3_fidelity: null, L4_exec: null };
  const notes: string[] = [];
  const slug = id;

  // Two compile fronts: a recorded session (`--from-session`, the default) OR a natural-language request
  // (`compile "<request>"`, when meta.request is set — exercises the NL front, D2).
  const compileArgs = meta.request
    ? ["compile", meta.request, "--auto-approve", "--no-enhance", "--name", slug]
    : ["compile", "--from-session", resolve(dir, meta.session), "--auto-approve", "--no-enhance", "--name", slug];
  process.stdout.write(`\n[${id}] compiling from ${meta.request ? "NL request" : `session (${meta.format})`}…\n`);
  const c = await run(proj, compileArgs, 900_000);
  const compile = parseCompileUsage(c.out);
  if (compile) notes.push(`compile cost: ${compile.agentRuns} agent run(s) · ${(compile.tokens / 1000).toFixed(1)}k tok · $${compile.costUSD.toFixed(4)}`);

  // L0 ingest: a session front stages session.md; an NL-request front has no session, so the request was
  // "ingested" iff distill produced a PRD.
  layers.L0_ingest = meta.request
    ? existsSync(resolve(proj, "reharness/.cache/scratch/prd.md"))
    : existsSync(resolve(proj, "reharness/.cache/scratch/session.md"));
  const vErr = resolve(proj, "reharness/.cache/scratch/verify-errors.md");
  layers.L1_compile = c.code === 0 && (!existsSync(vErr) || !readFileSync(vErr, "utf-8").trim());
  if (!layers.L1_compile) notes.push(`compile not green (exit ${c.code})` + (c.out ? `: ${c.out.trim().split("\n").slice(-3).join(" / ")}` : ""));

  // The PRD exists after distill, independent of whether compile succeeded — so the L3 keyword check works even
  // for the no-task edge (distill flags "no repeatable task" but nothing compiles).
  const prd = (() => { const p = resolve(proj, "reharness/.cache/scratch/prd.md"); return existsSync(p) ? readFileSync(p, "utf-8").toLowerCase() : ""; })();
  const hasKeywords = (meta.goldKeywords as string[]).filter(k => prd.includes(k.toLowerCase()));
  const skPath = resolve(proj, `reharness/skeletons/${slug}.xml`);
  const sk = existsSync(skPath) ? readFileSync(skPath, "utf-8") : "";

  if (layers.L1_compile && sk) {
    const states = [...sk.matchAll(/<state name="([^"]+)"/g)].map(m => m[1]);
    const libPath = resolve(proj, `reharness/lib/${slug}-states.ts`);
    const lib = existsSync(libPath) ? readFileSync(libPath, "utf-8") : "";
    const smells = hollowSmells(lib, states);
    layers.L2_nonhollow = smells.length === 0;
    if (smells.length) notes.push(`hollow: ${smells.join("; ")}`);
  }

  // L3 fidelity: the PRD captures the task's gold terms. An EXECUTION case must also declare an `<arg>` (the
  // external target); a no-task case (no execution) just needs the PRD to flag the absence of a task.
  const declaresInput = /<arg\b/.test(sk);
  // An external-tool case asserts the derived capability manifest names the capability it can't satisfy with
  // builtins (an MCP server / a npm dep / an env secret) — provisioning fidelity, checked even with no execution.
  const manifestExpect: string[] = meta.manifestExpect || [];
  let manifestOk = true;
  if (manifestExpect.length) {
    const mp = resolve(proj, "reharness/manifest.json");
    const mtext = existsSync(mp) ? readFileSync(mp, "utf-8").toLowerCase() : "";
    const miss = manifestExpect.filter(k => !mtext.includes(k.toLowerCase()));
    manifestOk = miss.length === 0;
    if (miss.length) notes.push(`manifest: missing ${miss.join(", ")}`);
  }
  layers.L3_fidelity = hasKeywords.length === (meta.goldKeywords as string[]).length && (!meta.execution || declaresInput) && manifestOk;
  if (!layers.L3_fidelity) notes.push(`fidelity: keywords ${hasKeywords.length}/${meta.goldKeywords.length}` + (meta.execution ? `, declares <arg>=${declaresInput}` : ""));

  if (meta.execution && layers.L1_compile) {
    process.stdout.write(`[${id}] executing compiled command on fixture…\n`);
    // Run on a COPY of the fixture INSIDE the project dir — so a command that writes its report relative to the
    // input (or to cwd, or to c.out()) lands somewhere under proj (scanned by the verifier), and never pollutes
    // the committed source fixture. runArgs are case-relative ("fixture/sales.csv" | "fixture"); remap to the copy.
    const srcFixture = resolve(meta.fixtureFrom ? resolve(CASES, meta.fixtureFrom) : dir, "fixture");
    const dstFixture = resolve(proj, "_fixture");
    cpSync(srcFixture, dstFixture, { recursive: true });
    // Snapshot the input files so the verifier counts only what the command NEWLY produced (a faithful L4 —
    // an extract task can't pass just because its expected tokens already sit in the scanned input).
    const preexisting = new Set<string>();
    const snap = (d: string) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = resolve(d, e.name); if (e.isDirectory()) snap(p); else preexisting.add(p); } };
    snap(dstFixture);
    installDeps(proj); // make the command's manifest npm deps resolvable (also tests provisioning)

    // Network cases: serve a fixture file over a local HTTP server; `__URL__` in runArgs becomes its URL.
    let server: Server | undefined, url = "";
    if (meta.execution.serveFixture) {
      const body = readFileSync(resolve(dstFixture, meta.execution.serveFixture), "utf-8");
      server = createServer((_req, res) => { res.setHeader("content-type", "application/json"); res.end(body); });
      await new Promise<void>(r => server!.listen(0, "127.0.0.1", r));
      url = `http://127.0.0.1:${(server.address() as { port: number }).port}/`;
    }
    const runArgs: string[] = (meta.execution.runArgs ?? ["fixture"]).map((a: string) =>
      a === "__URL__" ? url : resolve(proj, a.replace(/^fixture(\/|$)/, "_fixture$1")));
    await run(proj, [slug, ...runArgs], meta.execution.timeoutMs ?? 900_000);
    if (server) server.close();
    const ran = newestRunWork(proj); // confirm the command executed at all
    if (ran) {
      const verifyPath = resolve(dir, "verify.mjs");
      const res = meta.execution.verifyByTest
        ? testVerify(dstFixture, meta) // mined self-verifying task: run its own test for objective gold
        : (existsSync(verifyPath) ? (await import(verifyPath)).default : defaultVerify)(proj, meta, preexisting); // scan project minus input fixture
      layers.L4_exec = res.pass;
      notes.push(`exec: ${res.details}`);
    } else { layers.L4_exec = false; notes.push("exec: no run output found"); }
  }

  // Held-out instances (generalization): compile ONCE (above), then run the same compiled command on K
  // generated fixture variants with per-instance gold. This is the class's central metric — "one demonstration
  // → a family" — measured per case, not just in the experiments/ studies.
  let instances: CaseResult["instances"];
  const genPath = resolve(dir, "instances.mts");
  if (existsSync(genPath) && layers.L1_compile && meta.execution && !meta.execution.serveFixture && !meta.execution.verifyByTest) {
    const gen = await import(genPath);
    const K: number = gen.count ?? 5;
    let passed = 0;
    process.stdout.write(`[${id}] running ${K} held-out instances…\n`);
    for (let i = 0; i < K; i++) {
      const spec: InstanceSpec = gen.default(i);
      const idir = resolve(proj, `_inst${i}`);
      rmSync(idir, { recursive: true, force: true }); mkdirSync(idir, { recursive: true });
      for (const [rel, content] of Object.entries(spec.files)) {
        mkdirSync(dirname(resolve(idir, rel)), { recursive: true });
        writeFileSync(resolve(idir, rel), content);
      }
      const pre = new Set<string>(); listScanned(proj, pre);
      const rargs: string[] = (spec.runArgs ?? meta.execution.runArgs ?? ["fixture"]).map((a: string) =>
        resolve(proj, a.replace(/^fixture(\/|$)/, `_inst${i}$1`)));
      await run(proj, [slug, ...rargs], meta.execution.timeoutMs ?? 900_000);
      const res = verifyText(proj, spec.expectPresent, spec.decoyAbsent ?? [], pre);
      if (res.pass) passed++; else notes.push(`inst${i}: ${res.details}`);
    }
    instances = { passed, total: K };
    notes.push(`generalization: ${passed}/${K} held-out instances`);
  }
  return { id, layers, notes, compile, instances };
}

function fmt(v: boolean | null): string { return v === null ? "  –  " : v ? " PASS" : " FAIL"; }

/** Corpus mode — compile the N LARGEST real sessions from bench/corpus/synthtraces/ (a DIFFERENT JSONL schema),
 *  scoring the deterministic layers L0–L2 only (open-ended sessions → no fixture/gold, so no L3/L4). This is the
 *  "big multi-tool session" dimension: the biggest traces are long, many-tool real agent runs (up to ~290 KB). */
async function runCorpus(n: number): Promise<CaseResult[]> {
  const dir = resolve(ROOT, "corpus/synthtraces");
  if (!existsSync(dir)) { console.error("No corpus/synthtraces/ — download a slice first."); return []; }
  const files = readdirSync(dir).filter(f => f.endsWith(".jsonl"))
    .map(f => ({ f, size: statSync(resolve(dir, f)).size }))
    .sort((a, b) => b.size - a.size).slice(0, n).map(x => x.f);
  const out: CaseResult[] = [];
  for (const f of files) {
    const id = "corpus:" + f.replace(/\.jsonl$/, "").slice(0, 28);
    const slug = "corpus-" + out.length;
    const kb = Math.round(statSync(resolve(dir, f)).size / 1024);
    const proj = resolve(WORK, slug); rmSync(proj, { recursive: true, force: true }); mkdirSync(proj, { recursive: true });
    const layers: Record<string, boolean | null> = { L0_ingest: null, L1_compile: null, L2_nonhollow: null, L3_fidelity: null, L4_exec: null };
    const notes: string[] = [`${kb} KB session`];
    process.stdout.write(`\n[${id}] compiling real session (${kb} KB)…\n`);
    const c = await run(proj, ["compile", "--from-session", resolve(dir, f), "--auto-approve", "--no-enhance", "--name", slug], 900_000);
    const compile = parseCompileUsage(c.out);
    if (compile) notes.push(`compile cost: ${compile.agentRuns} agent run(s) · ${(compile.tokens / 1000).toFixed(1)}k tok · $${compile.costUSD.toFixed(4)}`);
    layers.L0_ingest = existsSync(resolve(proj, "reharness/.cache/scratch/session.md"));
    const vErr = resolve(proj, "reharness/.cache/scratch/verify-errors.md");
    layers.L1_compile = c.code === 0 && (!existsSync(vErr) || !readFileSync(vErr, "utf-8").trim());
    if (!layers.L1_compile) notes.push(`compile not green (exit ${c.code})` + (c.out ? `: ${c.out.trim().split("\n").slice(-2).join(" / ")}` : ""));
    const skPath = resolve(proj, `reharness/skeletons/${slug}.xml`);
    if (layers.L1_compile && existsSync(skPath)) {
      const states = [...readFileSync(skPath, "utf-8").matchAll(/<state name="([^"]+)"/g)].map(m => m[1]);
      const libPath = resolve(proj, `reharness/lib/${slug}-states.ts`);
      const smells = hollowSmells(existsSync(libPath) ? readFileSync(libPath, "utf-8") : "", states);
      layers.L2_nonhollow = smells.length === 0;
      if (smells.length) notes.push(`hollow: ${smells.join("; ")}`);
    }
    out.push({ id, layers, notes, compile });
  }
  return out;
}

async function main() {
  if (process.argv[2] === "corpus") {
    const results = await runCorpus(Number(process.argv[3]) || 3);
    report(results);
    return;
  }
  const only = process.argv[2];
  const ids = readdirSync(CASES, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).filter(id => !only || id === only);
  if (!ids.length) { console.error(only ? `No case '${only}'` : "No cases"); process.exit(1); }
  const results: CaseResult[] = [];
  for (const id of ids) results.push(await runCase(id));
  report(results);
}

function report(results: CaseResult[]) {
  console.log("\n══════════════ reharness-bench ══════════════");
  console.log("case                          L0    L1    L2    L3    L4");
  for (const r of results) {
    console.log(`${r.id.padEnd(29)}${fmt(r.layers.L0_ingest)} ${fmt(r.layers.L1_compile)} ${fmt(r.layers.L2_nonhollow)} ${fmt(r.layers.L3_fidelity)} ${fmt(r.layers.L4_exec)}`);
    for (const n of r.notes) console.log(`    · ${n}`);
  }
  const rate = (k: string) => { const xs = results.map(r => r.layers[k]).filter(v => v !== null) as boolean[]; return xs.length ? `${xs.filter(Boolean).length}/${xs.length}` : "–"; };
  console.log("──────────────────────────────────────────────────");
  console.log(`rates:  ingest ${rate("L0_ingest")}  compile ${rate("L1_compile")}  non-hollow ${rate("L2_nonhollow")}  fidelity ${rate("L3_fidelity")}  execution ${rate("L4_exec")}`);
  const fullPass = results.filter(r => Object.values(r.layers).every(v => v !== false)).length;
  console.log(`${fullPass}/${results.length} cases passed every applicable layer.`);
  const costs = results.map(r => r.compile?.costUSD).filter((c): c is number => c !== undefined).sort((a, b) => a - b);
  if (costs.length) {
    const total = costs.reduce((s, c) => s + c, 0);
    const median = costs[Math.floor(costs.length / 2)];
    console.log(`compile cost (observed): ${costs.length} compiles · total $${total.toFixed(2)} · mean $${(total / costs.length).toFixed(2)} · median $${median.toFixed(2)}`);
  }
  const fams = results.filter(r => r.instances);
  if (fams.length) {
    const p = fams.reduce((s, r) => s + r.instances!.passed, 0), t = fams.reduce((s, r) => s + r.instances!.total, 0);
    console.log(`generalization: ${fams.length} families · ${p}/${t} held-out instances passed`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
