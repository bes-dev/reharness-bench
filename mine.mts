/**
 * bench/mine.mts — build a REAL-DATA benchmark by STRATIFYING a session corpus over our compiler's properties,
 * instead of hand-authoring cases. We read each raw agent session (julien-c/synthtraces schema: a JSONL of
 * `message` records whose assistant turns carry `toolCall` blocks and `toolResult` turns), extract cheap
 * structural features, and tag which property each session demonstrates:
 *
 *   multi-tool        — ≥4 distinct tools / bash-verbs (a many-tool workflow)
 *   external-service  — calls out of the box (curl/wget/gh/git push/http/api/npm publish/…) → bind-external axis
 *   iteration         — a revise/fix loop: edit→run→edit-same-file, or error-then-retry → bounded `loop`
 *   fan-out           — the SAME op over ≥4 distinct paths (a map over items) → `parallel`
 *   dir-scan          — ls/find/glob/tree then ≥3 reads → directory ingest
 *   routing           — (weak) explicit conditional branching in the narration → `switch`
 *
 * Pure heuristics, no LLM — this is a cheap classifier, not a judge. Output: a per-session tag table + a
 * per-property count + a stratified pick (the smallest session per property, cheapest to compile-test).
 *
 * Run:  node --import tsx mine.mts [corpusDir]
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const CORPUS = resolve(process.argv[2] || resolve(ROOT, "corpus/synthtraces"));

interface Sess { file: string; lines: number; kb: number; tools: Record<string, number>; bash: string[]; paths: string[]; errors: number; tags: string[] }

/** Extract structural features from one raw session file. */
function parse(file: string): Sess {
  const raw = readFileSync(file, "utf-8");
  const lines = raw.split("\n").filter(Boolean);
  const tools: Record<string, number> = {};
  const bash: string[] = [];
  const paths: string[] = [];
  let errors = 0;
  for (const l of lines) {
    let o: any; try { o = JSON.parse(l); } catch { continue; }
    const m = o.message || o;
    if (m.role === "toolResult" || o.type === "toolResult") {
      const c = JSON.stringify(m.content || o.content || "");
      if (/\b(error|failed|exception|traceback|not found|non-zero|exit code [1-9])\b/i.test(c)) errors++;
      continue;
    }
    if (!Array.isArray(m.content)) continue;
    for (const b of m.content) {
      // Two trace schemas: Pi (`toolCall`/`arguments`) and Claude Code / Anthropic (`tool_use`/`input`,
      // results as `tool_result` blocks with an `is_error` flag). The miner is format-agnostic like the compiler.
      if (b?.type === "tool_result") {
        if (b.is_error || /\b(error|failed|exception|traceback|not found|non-zero|exit code [1-9])\b/i.test(JSON.stringify(b.content || ""))) errors++;
        continue;
      }
      if (!b || (b.type !== "toolCall" && b.type !== "tool_use")) continue;
      const name = b.name || "?";
      tools[name] = (tools[name] || 0) + 1;
      const a = b.arguments || b.input || {};
      if (name.toLowerCase() === "bash" && a.command) bash.push(String(a.command));
      if (a.path) paths.push(String(a.path));
      if (a.file_path) paths.push(String(a.file_path));
    }
  }
  return { file: basename(file), lines: lines.length, kb: Math.round(statSync(file).size / 1024), tools, bash, paths, errors, tags: [] };
}

/** First bash verb of a command (git, npm, ls, grep, python, …) — bash is a tool multiplexer, so its verbs
 *  count toward tool diversity. */
const verb = (cmd: string): string => (cmd.trim().replace(/^\(*\s*/, "").split(/[\s|;&]+/)[0] || "").split("/").pop() || "";

function tag(s: Sess): string[] {
  const t: string[] = [];
  const verbs = new Set(s.bash.map(verb).filter(Boolean));
  const distinct = new Set([...Object.keys(s.tools), ...verbs]);
  if (distinct.size >= 4) t.push("multi-tool");

  const ext = s.bash.some(c => /\b(curl|wget|gh|npm publish|pip install|pip3 install|docker push)\b|https?:\/\/|\bgit\s+(push|pull|clone|fetch)\b|\bapi\./i.test(c)) ||
    Object.keys(s.tools).some(n => /fetch|web|http|slack|browser|search/i.test(n));
  if (ext) t.push("external-service");

  // iteration: same path edited/written ≥2× (revise loop), or ≥2 errors (error-then-retry).
  const editPaths = s.paths;
  const dup = editPaths.some((p, i) => editPaths.indexOf(p) !== i);
  const writeVerbs = s.bash.filter(c => /\b(npm test|pytest|jest|cargo (test|build)|make|tsc|node |python )\b/i.test(c)).length;
  if ((dup && writeVerbs >= 1) || s.errors >= 2) t.push("iteration");

  // fan-out: the same op over ≥4 DISTINCT paths.
  if (new Set(s.paths).size >= 4) t.push("fan-out");

  // dir-scan: a listing command + ≥3 reads.
  const scans = s.bash.some(c => /\b(ls|find|tree|glob|fd)\b/.test(c)) || s.tools["glob"] || s.tools["list"];
  if (scans && (s.tools["read"] || 0) >= 3) t.push("dir-scan");

  // routing (weak): the assistant narrates an explicit either/or branch.
  // (Detected from bash conditionals as a proxy — real branching is rarely explicit in coding traces.)
  if (s.bash.some(c => /\bif\b.*\b(then|else|fi)\b/.test(c))) t.push("routing?");

  return t;
}

function main() {
  const files = readdirSync(CORPUS).filter(f => f.endsWith(".jsonl")).map(f => resolve(CORPUS, f));
  if (!files.length) { console.error(`No .jsonl in ${CORPUS}`); process.exit(1); }
  const sessions = files.map(parse);
  for (const s of sessions) s.tags = tag(s);

  const PROPS = ["multi-tool", "external-service", "iteration", "fan-out", "dir-scan", "routing?"];
  console.log(`\n═══ corpus property-mining — ${sessions.length} real sessions from ${basename(CORPUS)} ═══\n`);
  console.log("session".padEnd(42) + "lines  KB   tools  properties");
  for (const s of sessions.sort((a, b) => b.tags.length - a.tags.length)) {
    const nt = new Set([...Object.keys(s.tools), ...s.bash.map(verb).filter(Boolean)]).size;
    console.log(s.file.slice(0, 40).padEnd(42) + String(s.lines).padStart(5) + String(s.kb).padStart(5) + String(nt).padStart(6) + "   " + (s.tags.join(", ") || "—"));
  }
  console.log("\n── property coverage (real sessions exhibiting each) ──");
  for (const p of PROPS) {
    const hits = sessions.filter(s => s.tags.includes(p));
    const pick = hits.sort((a, b) => a.lines - b.lines)[0];
    console.log(`  ${p.padEnd(18)} ${String(hits.length).padStart(2)}/${sessions.length}` + (pick ? `   cheapest: ${pick.file.slice(0, 36)} (${pick.lines} lines)` : ""));
  }
  const untagged = sessions.filter(s => !s.tags.length).length;
  console.log(`\n  untagged: ${untagged}/${sessions.length} (no property matched our heuristics)`);
}

main();
