/** Held-out instances for the 3-lens audit→merge orchestra. Fresh module with the SAME four planted issue
 *  classes (hardcoded secret, shell injection, O(n^2) loop, dead function) but rotated identifiers — so the
 *  demo's findUser/rank/API_KEY/unusedLegacyHandler never recur. Gold = each instance's four planted
 *  identifiers surface in REPORT.md, proving all three lenses + the merge generalize to unseen code. */
import { rng, pick } from "../../instances-lib.mts";

export const count = 5;

const SECRETS = ["DB_PASSWORD", "STRIPE_TOKEN", "JWT_SECRET", "AWS_KEY", "ADMIN_PASS"];
const INJECT = ["lookupRecord", "searchLogs", "findEntry", "queryFile", "grepUser"];
const SLOW = ["computeRanks", "pairwiseScore", "bruteSort", "tallyDupes", "scanPairs"];
const DEAD = ["legacyShutdown", "oldRouteHandler", "deprecatedInit", "unusedMigration", "staleCallback"];

export default function gen(i: number) {
  const r = rng(10000 + i);
  const secret = pick(r, SECRETS, 1)[0];
  const inject = pick(r, INJECT, 1)[0];
  const slow = pick(r, SLOW, 1)[0];
  const dead = pick(r, DEAD, 1)[0];
  const code = [
    `import { createServer } from "http";`,
    `import { execSync } from "child_process";`,
    `const ${secret} = "sk-live-${r().toString(36).slice(2, 12)}"; // hardcoded secret`,
    `export function ${inject}(name) {`,
    `  return execSync(\`grep -r "\${name}" ./data/records.txt\`).toString(); // shell injection from user input`,
    `}`,
    `export function ${slow}(scores) {`,
    `  const out = [];`,
    `  for (let a = 0; a < scores.length; a++)`,
    `    for (let b = 0; b < scores.length; b++)`,
    `      if (scores[b] > scores[a]) out[a] = (out[a] || 0) + 1; // O(n^2) where a sort would do`,
    `  return out;`,
    `}`,
    `function ${dead}(req, res) { res.end("gone"); } // dead code, never referenced`,
    `createServer((req, res) => { res.end("ok"); }).listen(8080);`,
    "",
  ].join("\n");
  return {
    files: { "src/server.mjs": code },
    expectPresent: [secret, inject, slow, dead],
  };
}
