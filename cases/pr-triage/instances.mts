/** Held-out instances: 50-PR risk triage. Each PR needs the behavior-vs-surface SEMANTIC judgment (un-scriptable:
 *  no heuristic > 42%) JOINED with the file blast-radius. Gold planted from the rubric. verify() checks per-PR
 *  accuracy AND the dependent summary (counts, high_ids, high_lines_total) — at 50 items a one-shot monolith is
 *  prone to slip on borderline cases (surface-on-hot = medium), the compiler's scoped fan-out stays uniform. */
import { makeBatch } from "./gen-lib.mjs";
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";

export const count = 3;

function findNewest(dir: string, name: string, pre: Set<string>): string | undefined {
  let best: string | undefined, bestM = 0;
  const walk = (d: string) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === "reharness") continue;
      const p = resolve(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === name && !pre.has(p)) { const m = statSync(p).mtimeMs; if (m >= bestM) { bestM = m; best = p; } }
    }
  };
  walk(dir);
  return best;
}

export default function gen(i: number) {
  const { prs, impact, gold } = makeBatch(9200 + i, 50);
  const goldHigh = Object.entries(gold).filter(([, v]) => v === "high").map(([k]) => Number(k)).sort((a, b) => a - b);
  const highLines = prs.filter(p => gold[p.id] === "high").reduce((s, p) => s + p.lines_changed, 0);
  return {
    files: {
      "prs.json": JSON.stringify(prs, null, 2) + "\n",
      "impact.json": JSON.stringify(impact, null, 2) + "\n",
      "rules.md": readFileSync(resolve(import.meta.dirname, "fixture/rules.md"), "utf-8"),
    },
    verify(scanDir: string, pre: Set<string>) {
      const f = findNewest(scanDir, "report.json", pre);
      if (!f) return { pass: false, details: "no report.json" };
      let rep: any; try { rep = JSON.parse(readFileSync(f, "utf-8")); } catch { return { pass: false, details: "report.json invalid" }; }
      const byId = new Map<number, string>((rep.prs || []).map((x: any) => [Number(x.id), String(x.risk)]));
      let correct = 0; for (const p of prs) if (byId.get(p.id) === gold[p.id]) correct++;
      const s = rep.summary || {};
      const sumOk = JSON.stringify((s.high_ids || []).map(Number)) === JSON.stringify(goldHigh) && Number(s.high_lines_total) === highLines;
      return { pass: correct === 50 && sumOk, details: `risk ${correct}/50 · summary ${sumOk ? "ok" : `BAD(high_ids/lines)`}` };
    },
  };
}
