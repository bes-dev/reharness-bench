# Self-benchmark summary — reharness theses on τ-bench retail

Not a leaderboard (see `tau-cancel/VALIDATION.md` for why a single-shot comparison is a category error). These
experiments validate reharness's **own** value axes on **third-party** task families (sierra-research/tau-bench
retail), gated by τ-bench's **own** reward (final-DB-state equality). For each family: compile ONE pipeline from
ONE mined subagent trace, then replay it on the WHOLE family of real τ instances.

## Result — 3 families, 52 real instances

| family | operation | N | cross-instance (correct, τ gold) | runtime LLM / run | pass^3 |
|---|---|---|---|---|---|
| `tau-cancel` | cancel pending order + refund (gift-card credit) | 8 | **8/8** | 0 | 1.0 |
| `tau-retail-modify-address` | change a pending order's shipping address | 17 | **17/17** | 0 | 1.0 |
| `tau-retail-return` | return delivered items (status→return requested) | 27 | **27/27** | 0 | 1.0 |
| **total** | 3 distinct operations | **52** | **52/52** | **0** | **1.0** |

## What this confirms

- **A · Amortization** — all three operations compiled to **0-agent, pure-code** pipelines. The reasoning was
  paid once at compile; every one of the 52 runs costs **0 LLM calls**. A re-reasoning agent (e.g. τ-bench's
  gpt-4o baseline) pays a full multi-turn LLM run on every instance.
- **B · Determinism** — `pass^3 = pass^1` on all 52: identical output every trial. On τ-bench's own `pass^k`
  metric, a compiled code pipeline is **1.0**; an LLM agent's `pass^k` decays with k.
- **C · Cross-instance reuse** — each pipeline, compiled from a SINGLE demonstration, generalized to its entire
  family: across payment types (gift_card / credit_card / paypal), cancellation reasons, cities, and item sets
  it never saw in the demo. It learned the rule, not the example.
- **D · Correctness** — every pass is gated by τ-bench's reward (DB-state == gold action), not self-judged.
- **E · Break-even (qualitative)** — marginal cost **$0 / run at pass^k=1.0** vs a per-run cost at pass^k<1 for
  the re-reasoning baseline → amortization pays back after a handful of runs and widens without bound.

## Honest scope

- These three retail operations are **mechanical** (deterministic DB mutations) → they fully amortize to code
  (0 agents). The amortization win is largest exactly here. A judgment-heavy task keeps an LLM at its decision
  leaves, so its per-run cost is lower-but-nonzero — the win there is determinism of structure + auditability,
  not zero cost. A complete picture would also bench a judgment-heavy family (e.g. exchange, where item
  matching may need a model).
- 52 instances across 3 families is a solid **existence proof** of the theses, not a population claim.
- Reproduce: compile the three `cases/tau-*` cases, then run each `experiments/*/run.mts`.
