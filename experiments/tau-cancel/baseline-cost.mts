/** Cost accounting — the head-to-head the amortization claim needs. For the τ-bench cancel family (mechanical →
 *  reharness compiles it to a 0-agent pure-code pipeline), we measure:
 *    - BASELINE per-run cost: a re-reasoning agent (same model, Pi default) does the whole task fresh each run,
 *      with tokens/$ read from Pi's stream. (Conservative: a one-shot agent given the resolved request — the
 *      real τ multi-turn agent-loop costs MORE.) Gated by τ-bench's gold so we only count CORRECT baseline runs.
 *    - COMPILED per-run cost: the pipeline is pure code → 0 LLM calls → $0.
 *  → marginal saving = baseline $/run; break-even N = compile_cost / (baseline $/run).
 *  Run:  node --import tsx experiments/tau-cancel/baseline-cost.mts [N]
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const round2 = (n: number) => Math.round(n * 100) / 100;
const canon = (v: any): any => Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const canonStr = (db: any) => JSON.stringify(canon(db));
function goldCancel(db: any, oid: string, reason: string) {
  const o = db.orders[oid];
  const refunds = o.payment_history.map((p: any) => ({ transaction_type: "refund", amount: p.amount, payment_method_id: p.payment_method_id }));
  for (const r of refunds) if (String(r.payment_method_id).includes("gift_card")) { const pm = db.users[o.user_id].payment_methods[r.payment_method_id]; pm.balance = round2(pm.balance + r.amount); }
  o.status = "cancelled"; o.cancel_reason = reason; o.payment_history = [...o.payment_history, ...refunds];
  return db;
}

const SYS = `You are a retail customer-service backend. Read db.json in your working directory and CANCEL the requested pending order per policy:
- only a "pending" order can be cancelled; the reason must be "no longer needed" or "ordered by mistake".
- set the order status to "cancelled" and record its cancel_reason.
- append a refund {transaction_type:"refund", amount, payment_method_id} for each existing payment in the order's payment_history.
- for any refund to a gift card, credit that gift card's balance (users[user_id].payment_methods) by the amount, rounded to 2 decimals.
- write the updated db.json back. Then reply "done".`;

/** Run the baseline agent once; return {db, costUSD} — cost summed from Pi message_end events (one per message). */
function baselineRun(inst: any): { db: any; costUSD: number } {
  const dir = mkdtempSync(join(tmpdir(), "bl-"));
  const dbPath = join(dir, "db.json");
  writeFileSync(dbPath, JSON.stringify({ orders: { [inst.order_id]: inst.order }, users: { [inst.user_id]: inst.user }, products: {} }, null, 2));
  const task = `Cancel order ${inst.order_id} with reason "${inst.reason}". Your working directory is ${dir}; read and write ${dbPath}.`;
  const r = spawnSync("pi", ["--mode", "json", "-p", "--no-session", "--system-prompt", SYS, task], { cwd: dir, encoding: "utf-8", timeout: 180_000, maxBuffer: 1e8 });
  let cost = 0;
  for (const l of (r.stdout || "").split("\n").filter(Boolean)) {
    let o: any; try { o = JSON.parse(l); } catch { continue; }
    if (o.type === "message_end") { const c = (o.message?.usage?.cost?.total); if (typeof c === "number") cost += c; }
  }
  const db = JSON.parse(readFileSync(dbPath, "utf-8"));
  rmSync(dir, { recursive: true, force: true });
  return { db, costUSD: cost };
}

function main() {
  const instances = JSON.parse(readFileSync(resolve(HERE, "instances.json"), "utf-8"));
  const N = Number(process.argv[2]) || Math.min(5, instances.length);
  console.log(`\n══ τ-cancel cost accounting — BASELINE (re-reasoning agent) vs COMPILED (0-agent code), N=${N} ══\n`);
  console.log("order        pay         baseline $/run  correct(τ gold)");
  let totCost = 0, ok = 0;
  for (const inst of instances.slice(0, N)) {
    const pristine = { orders: { [inst.order_id]: structuredClone(inst.order) }, users: { [inst.user_id]: structuredClone(inst.user) }, products: {} };
    const gold = canonStr(goldCancel(pristine, inst.order_id, inst.reason));
    const { db, costUSD } = baselineRun(inst);
    const correct = canonStr(db) === gold;
    if (correct) { ok++; totCost += costUSD; }
    const pay = inst.order.payment_history.map((p: any) => p.payment_method_id.replace(/_\d+$/, "")).join("+");
    console.log(`${inst.order_id.padEnd(12)} ${pay.padEnd(11)} $${costUSD.toFixed(4).padEnd(13)} ${correct ? "✓" : "✗"}`);
  }
  const avg = ok ? totCost / ok : 0;
  console.log("──────────────────────────────────────────────────────────");
  console.log(`BASELINE (re-reasoning agent, opus-4-7): $${avg.toFixed(4)} / run avg  (${ok}/${N} correct)`);
  console.log(`COMPILED (reharness, 0-agent pure code): $0.0000 / run  (0 LLM calls)`);
  console.log(`marginal saving: ~$${avg.toFixed(4)} / run.  break-even N = compile_cost / $${avg.toFixed(4)}`);
  console.log(`(conservative: the real τ multi-turn agent-loop costs MORE than this one-shot baseline.)`);
}
main();
