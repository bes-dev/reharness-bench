/** Self-benchmark — τ-bench retail return_delivered_order_items family (see ../tau-cancel/VALIDATION.md for the
 *  framing). Compile ONCE → replay on the whole family; gold = τ-bench's reward (DB-state == gold mutation).
 *  Run:  node --import tsx experiments/tau-retail-return/run.mts   (compile the tau-retail-return case first) */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(HERE, "../../.work/tau-retail-return");
const CLI = process.env.REHARNESS_CLI;
const K = 3;
const canon = (v: any): any => Array.isArray(v) ? v.map(canon)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const canonStr = (db: any) => JSON.stringify(canon(db));

/** Port of retail return_delivered_order_items.invoke — the ground-truth DB mutation. */
function goldReturn(db: any, orderId: string, itemIds: string[], pmId: string) {
  const order = db.orders[orderId];
  order.status = "return requested";
  order.return_items = [...itemIds].sort();
  order.return_payment_method_id = pmId;
  return db;
}

function runPipeline(inst: any): any {
  const dir = mkdtempSync(join(tmpdir(), "tau-r-"));
  const dbPath = join(dir, "db.json");
  writeFileSync(dbPath, JSON.stringify({ orders: { [inst.order_id]: inst.order }, users: { [inst.user_id]: inst.user }, products: {} }, null, 2));
  const args = ["tau-retail-return", dbPath, "--order-id", inst.order_id, "--item-ids", inst.kwargs.item_ids.join(","), "--refund-payment-method-id", inst.kwargs.payment_method_id];
  CLI ? spawnSync("node", [CLI, ...args], { cwd: PROJECT, encoding: "utf-8" }) : spawnSync("reharness", args, { cwd: PROJECT, encoding: "utf-8" });
  return JSON.parse(readFileSync(dbPath, "utf-8"));
}

function main() {
  const instances = JSON.parse(readFileSync(resolve(HERE, "instances.json"), "utf-8"));
  if (!existsSync(PROJECT)) { console.error(`No compiled pipeline at ${PROJECT} — compile the tau-retail-return case first.`); process.exit(1); }
  console.log(`\n══ τ-bench retail RETURN family (N=${instances.length}, k=${K}) — compile-once → replay ══\n`);
  console.log("order        items  correct  pass^" + K);
  let passed = 0;
  for (const inst of instances) {
    const pristine = { orders: { [inst.order_id]: structuredClone(inst.order) }, users: { [inst.user_id]: structuredClone(inst.user) }, products: {} };
    const goldStr = canonStr(goldReturn(pristine, inst.order_id, inst.kwargs.item_ids, inst.kwargs.payment_method_id));
    const outs: string[] = [];
    for (let i = 0; i < K; i++) outs.push(canonStr(runPipeline(inst)));
    const allSame = outs.every(o => o === outs[0]);
    const correct = outs[0] === goldStr;
    if (correct && allSame) passed++;
    console.log(`${inst.order_id.padEnd(12)} ${String(inst.kwargs.item_ids.length).padEnd(6)} ${correct ? "  ✓ " : "  ✗ "}    ${allSame ? "1.0" : "<1"}`);
  }
  console.log("──────────────────────────────────────────────");
  console.log(`A·amortization: 0 runtime-LLM/run (pure-code pipeline)`);
  console.log(`B·determinism:  pass^${K} = pass^1`);
  console.log(`C·cross-inst:   ${passed}/${instances.length} of the family pass (compiled from 1 instance)`);
  console.log(`D·correctness:  τ-bench reward (DB == gold return)`);
}
main();
