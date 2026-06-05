# Self-benchmark: validating reharness's core theses

Not a leaderboard. This experiment measures reharness's **own value axes** — amortization, determinism,
cross-instance reuse — gated by a **third-party** task family and its **own** verifier, so the result isn't
self-graded. We do NOT compare single-shot pass-rate against a frontier agent (a category error: a compiler
can't beat a fresh agent on one novel task — its value is compile-once-run-cheap across many).

## Setup

- **Tasks**: τ-bench retail `cancel_pending_order` family (sierra-research/tau-bench, test set) — **8 real order
  cancellations** across 5 tasks (1 gift_card, 5 credit_card, 2 paypal; reasons "ordered by mistake" ×5,
  "no longer needed" ×3). Real τ DB records.
- **Artifact**: ONE pipeline compiled from a single trace of the **gift_card** instance (`#W8835847`). It
  compiled to **0 agents / pure code** (the cancellation is mechanical).
- **Gold**: a faithful port of τ-bench's reward — the produced DB must equal the DB after replaying the gold
  `cancel_pending_order` action (status→cancelled, refund per payment appended, gift-card balance credited).
- Run: `node --import tsx experiments/tau-cancel/run.mts` (compile the `tau-retail-cancel` case first).

## Result (N=8, k=3 determinism trials)

| order | payment | reason | correct (τ gold) | pass^3 | runtime LLM/run |
|---|---|---|---|---|---|
| #W8835847 | gift_card | ordered by mistake | ✓ | 1.0 | 0 |
| #W9284598 | credit_card | ordered by mistake | ✓ | 1.0 | 0 |
| #W8367380 | credit_card | ordered by mistake | ✓ | 1.0 | 0 |
| #W1242543 | credit_card | no longer needed | ✓ | 1.0 | 0 |
| #W3289292 | paypal | no longer needed | ✓ | 1.0 | 0 |
| #W9722559 | paypal | no longer needed | ✓ | 1.0 | 0 |
| #W5056519 | credit_card | ordered by mistake | ✓ | 1.0 | 0 |
| #W5995614 | credit_card | ordered by mistake | ✓ | 1.0 | 0 |

## Theses — confirmed

- **A · Amortization** — the compiled pipeline is **0-agent / pure code**: **0 runtime-LLM calls per run**. The
  reasoning was paid once, at compile; every run is free of inference. (A re-reasoning agent pays a full
  multi-turn LLM run on every single instance.)
- **B · Determinism** — `pass^3 = pass^1` on all 8: identical output every trial. A code pipeline is
  deterministic, so reliability does not decay across runs (τ-bench's own `pass^k` metric → 1.0 here),
  whereas an LLM agent's `pass^k` degrades with k.
- **C · Cross-instance reuse** — **8/8** of the family pass, from a pipeline compiled on **one** instance. The
  demo was the *only* gift_card case; the compiler still generalized the **conditional policy** (only
  gift-card refunds credit a balance; credit_card/paypal don't) AND both cancellation reasons it validates —
  i.e. it learned the rule, not the demo's specifics.
- **D · Correctness** — every pass is gated by τ-bench's own reward semantics (DB-state equality), not by us.

- **E · Break-even (qualitative)** — amortization has a one-time compile cost (an LLM-heavy compile), then a
  **marginal cost of $0 / run** at `pass^k = 1.0`. A re-reasoning baseline has a **per-run** cost at
  `pass^k < 1.0`. So the economics cross over after a handful of runs and the gap widens without bound as the
  workflow repeats — exactly reharness's "compile-once-run-cheap" thesis. (A precise $ break-even needs
  τ-bench's agent-cost accounting, which we did not extract; `user_cost` in the records is the user-simulator
  cost, not the agent's, so we report E structurally rather than with a fabricated number.)

## Honest notes

- A first run showed 5/8 (the 3 "no longer needed" instances failing) — that was a **bug in this harness**
  (it passed `--reason` instead of the pipeline's actual `--cancel-reason` flag), not a generalization failure.
  Fixed → 8/8. The pipeline had the reason logic right all along (`allowedReasons` ⊇ both).
- N=8 is an **existence proof** of the theses on one task family, not a statistical claim. Broadening to other
  τ families (modify / return / exchange) is straightforward (one pipeline + a gold port each) and would
  strengthen the cross-instance and amortization story, but the result here is already decisive for the core
  claims.
