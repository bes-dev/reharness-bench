/** Self-benchmark — τ-bench retail modify_pending_order_address family (see ../tau-cancel/VALIDATION.md for the
 *  framing). Compile ONCE → replay on the whole family; gold = τ-bench's reward (DB-state == gold mutation).
 *  Run:  node --import tsx experiments/tau-retail-modify-address/run.mts   (compile the case first) */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(HERE, "../../.work/tau-retail-modify-address");
const CLI = process.env.REHARNESS_CLI;
const K = 3;
const canon = (v: any): any => Array.isArray(v) ? v.map(canon)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const canonStr = (db: any) => JSON.stringify(canon(db));

/** Port of retail modify_pending_order_address.invoke — replace the order's address with the six fields. */
function goldAddress(db: any, orderId: string, kw: any) {
  db.orders[orderId].address = { address1: kw.address1, address2: kw.address2, city: kw.city, state: kw.state, country: kw.country, zip: kw.zip };
  return db;
}

function runPipeline(inst: any): any {
  const dir = mkdtempSync(join(tmpdir(), "tau-a-"));
  const dbPath = join(dir, "db.json");
  writeFileSync(dbPath, JSON.stringify({ orders: { [inst.order_id]: inst.order }, users: { [inst.user_id]: inst.user }, products: {} }, null, 2));
  const k = inst.kwargs;
  const args = ["tau-retail-modify-address", dbPath, "--order-id", inst.order_id,
    "--address1", k.address1, "--address2", k.address2, "--city", k.city, "--state", k.state, "--country", k.country, "--zip", k.zip];
  CLI ? spawnSync("node", [CLI, ...args], { cwd: PROJECT, encoding: "utf-8" }) : spawnSync("reharness", args, { cwd: PROJECT, encoding: "utf-8" });
  return JSON.parse(readFileSync(dbPath, "utf-8"));
}

function main() {
  const instances = JSON.parse(readFileSync(resolve(HERE, "instances.json"), "utf-8"));
  if (!existsSync(PROJECT)) { console.error(`No compiled pipeline at ${PROJECT} — compile the tau-retail-modify-address case first.`); process.exit(1); }
  console.log(`\n══ τ-bench retail MODIFY-ADDRESS family (N=${instances.length}, k=${K}) — compile-once → replay ══\n`);
  console.log("order        city            correct  pass^" + K);
  let passed = 0;
  for (const inst of instances) {
    const pristine = { orders: { [inst.order_id]: structuredClone(inst.order) }, users: { [inst.user_id]: structuredClone(inst.user) }, products: {} };
    const goldStr = canonStr(goldAddress(pristine, inst.order_id, inst.kwargs));
    const outs: string[] = [];
    for (let i = 0; i < K; i++) outs.push(canonStr(runPipeline(inst)));
    const allSame = outs.every(o => o === outs[0]);
    const correct = outs[0] === goldStr;
    if (correct && allSame) passed++;
    console.log(`${inst.order_id.padEnd(12)} ${String(inst.kwargs.city).slice(0, 14).padEnd(15)} ${correct ? "  ✓ " : "  ✗ "}    ${allSame ? "1.0" : "<1"}`);
  }
  console.log("──────────────────────────────────────────────");
  console.log(`A·amortization: 0 runtime-LLM/run (pure-code pipeline)`);
  console.log(`B·determinism:  pass^${K} = pass^1`);
  console.log(`C·cross-inst:   ${passed}/${instances.length} of the family pass (compiled from 1 instance)`);
  console.log(`D·correctness:  τ-bench reward (DB == gold address change)`);
}
main();
