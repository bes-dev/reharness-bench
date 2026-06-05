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

## The judgment-heavy contrast — partial amortization

The three τ families are **mechanical** (deterministic DB mutations) → they compile to **0 agents** and amortize
fully. To show the other regime, `agnews-classify` is a **judgment-heavy** task (AG News topic classification,
fancyzhx/ag_news): the core is an opinion an LLM must form, so the compiler keeps an **agent leaf** — and every
run pays for it.

| | mechanical (τ families) | judgment (`agnews-classify`) |
|---|---|---|
| compiled leaf | pure code (0 agents) | 1 **agent** + code plumbing |
| runtime LLM / run | **0** | **~1 call** (only the classify leaf) |
| determinism (pass^k) | 1.0 | 1.0 (deterministic at temp 0) — but at a cost |
| correctness | 100% (== τ gold by construction) | **94%** (15/16 vs AG News gold = judgment quality) |
| amortization | **full** — reasoning paid once | **partial** — the *workflow structure* is amortized (one fixed pipeline, deterministic plumbing, LLM only at the one judgment leaf), the *judgment* is not |

So the value-prop is regime-dependent, which is the honest story:
- **Mechanical task** → reharness moves it entirely to code: 0 runtime LLM, perfect determinism, exact gold.
- **Judgment task** → reharness still wins by **localising** the LLM to the one decision leaf inside a fixed,
  auditable, deterministic pipeline — instead of a re-reasoning agent that re-derives the *whole* workflow
  (control flow + tool calls + judgment) on every run. The judgment leaf's accuracy (94% here) is the model's,
  not reharness's — reharness's job is to not pay for re-deriving everything *around* it.

## Honest scope

- 52 mechanical + 16 judgment instances across 4 families is a solid **existence proof** of the theses across
  both regimes, not a population claim.
- Reproduce: compile the `cases/{tau-*,agnews-classify}` cases, then run each `experiments/*/run.mts`. The
  τ runners are free (0 LLM); `agnews-classify` costs ~1 LLM call per run (it has an agent leaf).
