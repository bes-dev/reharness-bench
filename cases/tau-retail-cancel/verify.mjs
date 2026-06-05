import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * τ-bench retail task #88 verifier — a faithful JS port of τ-bench's reward (sierra-research/tau-bench,
 * `Env.calculate_reward`): success iff the database the agent produced == the database after replaying the
 * task's gold `actions` on a fresh copy of the SAME initial DB. τ hashes the canonicalized DB; we compare the
 * canonical (sorted-key) JSON of both DBs WE compute, which is equivalent and sidesteps τ's Python str(tuple)
 * hashing. The single gold action is `cancel_pending_order(#W8835847, "ordered by mistake")`.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const round2 = (n) => Math.round(n * 100) / 100;

/** Canonical form: object keys sorted recursively, arrays kept in order → stable JSON string. */
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])]));
  return v;
}
const canonStr = (db) => JSON.stringify(canon(db));

/** Direct port of retail tool `cancel_pending_order.invoke` — the ground-truth DB mutation. */
function cancelPendingOrder(db, orderId, reason) {
  const order = db.orders[orderId];
  if (!order || order.status !== "pending") throw new Error(`order ${orderId} not pending`);
  const refunds = order.payment_history.map(p => ({
    transaction_type: "refund", amount: p.amount, payment_method_id: p.payment_method_id,
  }));
  for (const r of refunds) {
    if (String(r.payment_method_id).includes("gift_card")) {
      const pm = db.users[order.user_id].payment_methods[r.payment_method_id];
      pm.balance = round2(pm.balance + r.amount);
    }
  }
  order.status = "cancelled";
  order.cancel_reason = reason;
  order.payment_history = [...order.payment_history, ...refunds];
  return db;
}

/** Every JSON file under `dir` that looks like a τ DB ({orders,users}) — the pipeline's produced DB, wherever
 *  it wrote it (in-place over the input, or to c.out()/a report path). */
function dbCandidates(dir, acc) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules") continue;
    const p = resolve(dir, e.name);
    if (e.isDirectory()) dbCandidates(p, acc);
    else if (e.name.endsWith(".json") && statSync(p).size < 5_000_000) {
      try { const j = JSON.parse(readFileSync(p, "utf-8")); if (j && j.orders && j.users) acc.push({ path: p, db: j }); } catch { /* not a DB */ }
    }
  }
}

export default function verify(workDir) {
  // Gold = the pristine committed fixture DB with the cancel applied (τ's "replay actions on a fresh DB").
  const pristine = JSON.parse(readFileSync(resolve(HERE, "fixture/db.json"), "utf-8"));
  const gold = canonStr(cancelPendingOrder(structuredClone(pristine), "#W8835847", "ordered by mistake"));

  const cands = [];
  dbCandidates(workDir, cands);
  const match = cands.find(c => canonStr(c.db) === gold);
  if (match) return { pass: true, details: `DB state matches τ-bench gold (cancel #W8835847; gift-card refunded to 708.97)` };

  // Diagnostics: did anything cancel the order at all?
  const cancelled = cands.some(c => c.db.orders?.["#W8835847"]?.status === "cancelled");
  return {
    pass: false,
    details: cands.length === 0 ? "no produced DB found"
      : cancelled ? `order cancelled but DB ≠ τ gold (check refund/gift-card-balance/cancel_reason)`
      : `order #W8835847 not cancelled in any of ${cands.length} produced DB(s)`,
  };
}
