// Shared PR-triage data generator. Risk depends on BOTH the semantic intent of the PR AND the blast-radius of
// the file it touches — so neither a keyword matcher nor a naive "big diff = risky" heuristic works; you need to
// read the intent AND join the impact table. Gold is planted from (intent_class, blast) via the documented rubric.
import { rng, int, pick } from "../../instances-lib.mts";

// Files with a blast-radius profile. `critical` = on the request/auth/payment hot path; `deps` = how many
// services import it. A trivial change to a critical high-dep file can still be HIGH; a big change to an
// isolated leaf file is LOW.
const FILES = [
  { path: "auth/token.ts", critical: true, deps: 14 },
  { path: "auth/session.ts", critical: true, deps: 11 },
  { path: "billing/capture.ts", critical: true, deps: 9 },
  { path: "gateway/ratelimit.ts", critical: true, deps: 12 },
  { path: "migrations/schema.sql", critical: true, deps: 20 },
  { path: "docs/payments.md", critical: false, deps: 0 },
  { path: "README.md", critical: false, deps: 0 },
  { path: "ui/button.css", critical: false, deps: 1 },
  { path: "reports/export.ts", critical: false, deps: 2 },
  { path: "scripts/seed-dev.ts", critical: false, deps: 0 },
];

// Intent templates with a SEMANTIC class: `behavior` = changes runtime behavior of the touched code;
// `surface` = docs/tests/comments/formatting — no behavior change. The keyword in each is deliberately
// misleading relative to the class.
const INTENTS = [
  // behavior-changing (the dangerous kind)
  { t: "refactor token TTL validation logic", cls: "behavior" },
  { t: "switch payment capture to async settlement", cls: "behavior" },
  { t: "make rate-limiter fail-open under overload", cls: "behavior" },
  { t: "drop the legacy role column", cls: "behavior" },
  { t: "rewrite cookie signing algorithm", cls: "behavior" },
  { t: "change retry backoff to exponential", cls: "behavior" },
  // surface-only (safe even on critical files)
  { t: "fix a typo in the doc comment", cls: "surface" },
  { t: "add unit tests for the helper", cls: "surface" },
  { t: "reword an error message", cls: "surface" },
  { t: "update a version number in a comment", cls: "surface" },
  { t: "reformat with prettier, no logic change", cls: "surface" },
  { t: "clarify a log line wording", cls: "surface" },
];

// RUBRIC (documented in rules.md, used to PLANT gold): HIGH iff the change is behavior-changing AND the file is
// critical (or deps>=10). MEDIUM iff behavior-changing on a non-critical low-dep file, OR surface change on a
// critical high-dep file (still worth a glance). LOW iff surface change on a non-critical file.
function risk(intentCls, file) {
  const hot = file.critical || file.deps >= 10;
  if (intentCls === "behavior") return hot ? "high" : "medium";
  return hot ? "medium" : "low";
}

export function makeBatch(seed, n) {
  const r = rng(seed);
  const prs = [], gold = {};
  for (let id = 1; id <= n; id++) {
    const intent = pick(r, INTENTS, 1)[0];
    const file = pick(r, FILES, 1)[0];
    const lines = intent.cls === "behavior" ? int(r, 30, 220) : int(r, 1, 12);
    prs.push({ id, title: intent.t, file: file.path, lines_changed: lines, description: `${intent.t} (${lines} lines in ${file.path})` });
    gold[id] = risk(intent.cls, file);
  }
  return { prs, impact: FILES, gold };
}
