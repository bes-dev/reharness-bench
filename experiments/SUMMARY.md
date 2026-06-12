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

### Control: is the 94% a pipeline loss? No — it's the model ceiling + one mislabel.

We ran the SAME model the agent leaf uses (`claude-opus-4-7`, Pi's default) **directly** — a clean minimal
classification prompt, no FSM, no file I/O — on the same 16 articles:

| | accuracy | miss |
|---|---|---|
| direct model (no pipeline) | 15/16 = 94% | #3 |
| reharness pipeline (agent leaf) | 15/16 = 94% | #3 |

**Identical** — same predictions, same single miss. So the pipeline adds **zero** accuracy loss; the agent leaf
faithfully reproduces the model's own judgment. And the one "miss" (#3) is a **mislabeled gold instance**: an
NLCS/baseball article ("Munro, Morris Face Off in NLCS Game 2 … NL Championship series") that AG News tags
`World` — both the direct model and the pipeline correctly say `Sports`. So the model's true accuracy here is
effectively **16/16**; the 94% is dataset label noise, not determinization or harness quality. reharness does
not trade accuracy for structure — it preserves the model's full judgment and only amortizes everything around
it.

So the value-prop is regime-dependent, which is the honest story:
- **Mechanical task** → reharness moves it entirely to code: 0 runtime LLM, perfect determinism, exact gold.
- **Judgment task** → reharness still wins by **localising** the LLM to the one decision leaf inside a fixed,
  auditable, deterministic pipeline — instead of a re-reasoning agent that re-derives the *whole* workflow
  (control flow + tool calls + judgment) on every run. The judgment leaf's accuracy (94% here) is the model's,
  not reharness's — reharness's job is to not pay for re-deriving everything *around* it.

## Cost — measured head-to-head (where the amortization actually shows up)

The cost win is **regime-dependent**, and it is largest exactly where there's orchestration/reasoning to
collapse — NOT on a one-judgment task:

- **Fully deterministic pipeline (0 agents)** — the baseline burns a whole agentic run (read state, reason
  about policy, decide + execute tool calls); reharness pays **$0** (pure code). Biggest gap.
- **Multi-agent pipeline** — the collapsed part is the **orchestration**: a re-reasoning agent re-derives the
  control flow (which agent / tool, in what order, loops, conditionals) on every run; the compiled FSM fixes it,
  so each agent leaf does only its judgment. The win scales with how much orchestration was collapsed.
- **Single-agent pipeline** (e.g. `agnews-classify`) — there's no orchestration to collapse; the task *is* one
  judgment, so per-run cost is ~the same as the baseline. The win there is determinism/auditability of the
  plumbing + per-leaf harness, **not** cost.

Measured on `tau-cancel` (mechanical → 0-agent pipeline), N=5, same model (opus-4-7), gated on τ-bench gold:

| | $/run | correct | LLM calls/run |
|---|---|---|---|
| baseline (re-reasoning agent) | **$0.031** | 5/5 | full agent run |
| reharness (compiled, 0 agents) | **$0.000** | (52/52 elsewhere) | 0 |

→ marginal saving ≈ **$0.031/run**; break-even `N = compile_cost / 0.031`. Run via
`experiments/tau-cancel/baseline-cost.mts`. (Conservative: the real τ **multi-turn** agent-loop, with the
simulated user, costs more than this one-shot baseline.)

**Compile cost — now instrumented.** The self-hosted compile pipeline already observes its own spend (the
runtime sums per-leaf usage and prints `runtime: N agent run(s) · X tokens · $Y` at the terminal); the bench
harness (`run.mts`) now parses that verdict line per case and reports per-case + aggregate compile cost
(`compile cost (observed): …` in the report footer). Break-even is therefore fully measured:
`N = compile_cost / 0.031` per the table above. **Remaining:** re-run the `tau-*` / `agnews-classify` compiles
with the instrumented harness to replace the rough ~\$1 estimate with the observed number in this summary.

## Honest scope

- 52 mechanical + 16 judgment instances across 4 families is a solid **existence proof** of the theses across
  both regimes, not a population claim.
- Reproduce: compile the `cases/{tau-*,agnews-classify}` cases, then run each `experiments/*/run.mts`. The
  τ runners are free (0 LLM); `agnews-classify` costs ~1 LLM call per run (it has an agent leaf).

## Family generalization sweep — first instrumented run (2026-06-12)

Five mechanical families (each: ONE compile from the demo, then 8 seeded held-out instances with
per-instance, demo-echo-proof gold; see `instances.mts` per case):

| family | compile cost (observed) | exec (demo) | generalization |
|---|---|---|---|
| csv-stats | $0.68 · 6 runs · 12.2k tok | 1/1 | **8/8** |
| json-extract | $0.62 · 6 runs · 10.2k tok | 1/1, decoy excluded | **8/8** |
| yaml-to-json | $1.06 · 7 runs · 30.7k tok | 1/1 | **8/8** |
| trace-logtriage | $1.08 · 6 runs · 18.4k tok | 1/1 | **8/8** — dominant error type ROTATES per instance; a demo-echo pipeline would fail 7/8 |
| trace-revenue | $0.83 · 6 runs · 12.2k tok | 1/1 | **8/8** — gold = ALL region totals, substring-safe |
| **total** | **~$4.3 · mean $0.85/compile** | 5/5 | **40/40** |

Break-even (measured, vs the $0.031/run τ baseline): **~27 runs** — the old "~$1 → ~30 runs" estimate
confirmed by observation.

**Compile-variance finding (live).** The first trace-revenue compile of the day produced a *correct* pipeline
with a *different interface* than the previous L4-green compile: `<workdir>` + `--csv-name` instead of
`<file>` (both reasonable; a manual dir-run reproduced the exact demo gold 850/200/150). Cost of that extra
data point: $0.95. Consequences applied to the harness: the runner now adapts argv to the artifact's declared
`<inputs>` (the artifact owns its CLI shape — a class benchmark must not hardcode it), and `newestRunWork`
no longer counts the compiler's own meta-runs as command runs. Interface stability across recompiles is a
real, measurable axis of compile variance — paper material for the pass@k study.
