# reharness capability matrix — the benchmark we're assembling

Goal: a benchmark that exercises **every capability the compiler can emit**, sourced from **real agent-trajectory
datasets** wherever such data exists, and hand-authored only where no real session can demonstrate the capability
(structural/runtime features that don't appear in found data). Each row says: what it is, where real data lives,
whether we already have a case, and the deepest layer we can score it at.

Layers (from `bench/run.mts`): **L0** ingest · **L1** compile-green · **L2** non-hollow · **L3** fidelity
(PRD + declared `<arg>` / manifest) · **L4** execution (run on a fixture + deterministic verifier).
Real found sessions have no fixtures/gold → mostly **L0–L2** (compile robustness) unless the source ships a
verifier (τ-bench, WebArena → potential **L4**).

Node types are the canon from `src/compiler/agents/_fsm-syntax.md`.

---

## A. Control-flow topologies (node types)

| # | Capability (node) | Real-data source | Have? | Score |
|---|---|---|---|---|
| A1 | `agent` — judgment leaf | synthtraces; any | ✅ many | L4 |
| A2 | `code` — deterministic leaf (0-agent pipeline) | mechanical sessions (validate-dir) | ✅ authored | L4 |
| A3 | sequential chain (agent→code→…) | synthtraces multi-tool | ✅ (notes-actions auth; corpus real) | L2/L4 |
| A4 | `switch` / `check` — routing/conditional | **ToolBench** (DFS trees), **Mind2Web** (page-state branch), **τ-bench** (policy branches) | ⚠️ authored only (intent-route) | L2 real / L4 auth |
| A5 | `parallel` — fan-out over array | synthtraces fan-out (same op ×N paths) | ✅ (review-fanout auth; corpus real) | L2/L4 |
| A6 | `loop` — bounded iteration (`max`) | synthtraces iteration (edit→test→edit); **τ-bench** retries | ✅ (loop-revise auth; corpus real) | L2/L4 |
| A7 | `wait` — suspend (timer/file/shell/**webhook**) | **rare in any dataset** — DevOps/automation/cron logs | ❌ no real source | author |
| A8 | `call` — invoke sub-skeleton (composition) | **rare** — hierarchical-task datasets | ❌ no real source | author |
| A9 | `approval` — human-in-loop pause | **τ-bench / Nemotron** (have explicit user turns mid-task) | ❌ not yet | L2 from τ-bench |
| A10 | `set` — write `ctx.data` scalar | implicit in branching/loop cases | ✅ implicit | — |

## B. Capability / harness axes (derived manifest: `npm` · `tools` · `env`; + per-leaf `model`)

| # | Capability | Real-data source | Have? | Score |
|---|---|---|---|---|
| B1 | `npm` dep / provisioning | sessions that `npm install` a lib (js-yaml…) | ✅ authored (yaml-to-json) | L4 |
| B2 | `tools` — external CLI binary (git/gh/jq/docker) | synthtraces bash (git/npm); DevOps logs | ⚠️ partial (corpus bash) | L2 |
| B3 | `env` secret / external-service | **Nemotron-Agentic**, **ToolBench**, **τ-bench**, **API-Bank**, **MCP-bench** | ⚠️ authored only (slack-notify) | L3 real |
| B4 | per-leaf `model` routing (`model-expr`) | **none** — structural, not in trajectories | ❌ no real source | author |

## C. Inputs / data-flow

| # | Capability | Real-data source | Have? | Score |
|---|---|---|---|---|
| C1 | single external target (`<arg required positional>`) | most sessions | ✅ many | L4 |
| C2 | multi-input (≥2 external targets) | sessions operating on 2+ files/sources | ❌ not yet | L4 author / mine |
| C3 | typed args (`list`/`number`/`bool`) | sessions with options/flags/counts | ❌ not yet | L4 author |
| C4 | inter-stage workspace flow (`c.out`→`c.dir`/`c.dirs`) | every multi-step chain | ✅ implicit | L4 |

## D. Compile fronts

| # | Capability | Real-data source | Have? | Score |
|---|---|---|---|---|
| D1 | session → pipeline (`--from-session`) | all trajectory datasets | ✅ the whole bench | L0–L4 |
| D2 | NL request → pipeline (`compile <request>`) | **task descriptions** of any dataset (the instruction field) | ❌ not benched | L4 |
| D3 | skeleton → pipeline | **none** — internal format | ❌ no real source | author |

## E. Edge / negative

| # | Capability | Real-data source | Have? | Score |
|---|---|---|---|---|
| E1 | no-task (graceful decline) | short exploratory sessions (synthtraces untagged tail) | ✅ (no-task auth; corpus tail real) | L0–L3 |
| E2 | huge / malformed session robustness | corpus large tail (≤290 KB) | ✅ corpus | L0–L2 |

---

## Where real data exists vs where we must author

- **Real sessions cover:** A1, A2, A3, A5, A6 (synthtraces) · A4, A9, B3 (τ-bench / ToolBench / Mind2Web / Nemotron) · B2 (synthtraces bash) · C1, C4, D1, E1, E2.
- **No real session can demonstrate (author or synthesize):** A7 `wait`, A8 `call`, B4 model-routing, D3 skeleton-front — these are runtime/structural features that don't surface as a recorded trajectory. Honest: these stay hand-authored.
- **Gap closers to acquire (HF-downloadable, same path as synthtraces):**
  1. **nvidia/Nemotron-Agentic-v1** → B3 external-service, A9 approval (user turns).
  2. **osunlp/Mind2Web** → A4 routing (page-state branching).
  3. **ToolBench slice** → A4 routing + B3 external API (DFS solution-paths).
  4. (stretch) **τ-bench** → A4/B3 **with a deterministic verifier** → real **L4**.

## Acquisition plan (cost-ordered — compile $ is the constraint; download is cheap)

1. **Now (cheap):** validate HF download mechanics on ONE gap-closer (Nemotron-Agentic-v1), run `bench/mine.mts` over it → confirm it tags `external-service` on real data. No compiles yet.
2. **Mine, don't compile-all:** stratify each acquired set; pick the **cheapest** session per uncovered capability.
3. **Compile the stratified picks only** (L0–L2) — a handful of small real sessions per capability, not the whole corpus.
4. **L4 where a verifier ships** (τ-bench/WebArena): wire its goal-state check as a `verify.mjs`.
5. **Author the un-sourceable rows** (A7/A8/B4/D3) as minimal synthetic cases, clearly labelled `synthetic` in meta.

---

## Coverage status — after the trace-mining sweep

**The de-biased path that worked:** take a task with an OBJECTIVE verifier → let a real subagent solve it → capture its trace from `<session>/subagents/agent-<id>.jsonl` → compile that trace → score. No authored trajectories; the trace is a real agent run and the verifier is the task's own test/check. The harness gained `verifyByTest` (runs the task's own test for objective L4 gold).

**Mined real-trace cases (all L4-green):**

| case | trace source | capabilities exercised (REAL) | L4 gold |
|---|---|---|---|
| `trace-fixbug` | subagent fixed a bug until tests passed | A6 `loop` + A4 `switch`×2 + A1 + A2 + C1 + C3 (`number` arg) | its own test passes |
| `trace-codegen` | subagent implemented a spec'd fn (RLE) to green | A1 agent-author + A2 code-verify | its own test passes |
| `trace-review` | subagent reviewed each file for bugs | A5 `parallel` fan-out + dir-scan | report names the buggy files |
| `trace-fetch` | subagent fetched a mock API + summarised | **B3 external-service (first REAL L4)** | report has the served values |
| `trace-diff` | subagent diffed two co-located configs | A2 code + A1 agent; `<dir>+filename` interface (multi-file, NOT C2) | report has the new version |

**Still authored (real source exists — mine next if wanted):** A9 approval (Nemotron user-turns), B1 npm-dep, B2 CLI-tools, true-C2 multi-target (needs non-co-located demo files), D2 NL-request front.

**Un-minable by design (no agent trace can demonstrate these — covered by `npm test` on the runtime, NOT the session-bench):** A7 `wait` (timer/file/shell/webhook), A8 `call` (sub-skeleton), B4 per-leaf `model` routing, D3 skeleton-front. These are structural runtime features, not behaviours a recorded session exhibits.

**Key findings from the sweep:**
- Input topology mirrors the demonstration's file layout: co-located files → `<dir>+filename` interface, not two independent targets. To force true multi-target (C2), the demo must spread inputs across dirs.
- "tool-use dataset" ≠ "external-service case": Nemotron `interactive_agent` frames tools as *input data for a next-action decision*, so it compiled to agent-judgment + loop with an EMPTY manifest. A real external-service case needs the tools to be the *pipeline's own executed actions* (→ `trace-fetch`).

---

## Phase: remaining capabilities + distill-from-noise (mined)

Closed the last benchable rows + stress-tested distillation on NOISY traces (dead-ends, red herrings, distractors) — the compiler must extract the repeatable pipeline from the noise, not transcribe it.

| case | capability / stress | result |
|---|---|---|
| `req-latency` | **D2 NL-request front** (`compile "<request>"`, no session) | ✅ working pipeline straight from a description; flags the >500ms endpoints |
| `trace-reconcile` | **C2 true multi-target** + noisy dirs | ✅ TWO required positional inputs (after the abs-path-default fix); ignores distractor files |
| `trace-debugnoise` | **distill-from-noise** (25-line meandering trace: misleading NOTES.md, red-herring modules) | ✅ distilled to a clean fix-until-green; objective test passes |
| `trace-approve` | **A9 approval** attempt (plan-then-stop) | ⚠️ NEGATIVE: no `approval` node emitted — an autonomous trace never shows a human approving mid-flow → A9 is structural, not session-minable |

**New compiler fix surfaced here (general, tested):** an `<arg default>` that is a hardcoded absolute SYSTEM path (`/tmp/…`, `/Users/…`) leaks the demo's machine-specific location — `lintSkeleton` now rejects it (env-rooted `~/…` stays allowed). This fix ALSO unlocked C2: forbidden from lazily defaulting the second input to a demo path, the compiler correctly makes it a required co-equal positional. (Joins the empty-output-default / unprovisionable-import / runtime-install guards.)

**Distillation robustness CONFIRMED:** both `trace-reconcile` (distractor files) and `trace-debugnoise` (red-herring notes + dead-end exploration) compiled to clean correct pipelines — the compiler extracts the pipeline from noise, it doesn't just formalize tidy traces.

**Reclassification (initial — then CORRECTED below):** A9 `approval` was first parked as "structural / not session-minable" alongside A7/A8/B4/D3. That conflated two different things — see the correction.

---

## CORRECTION — capabilities reach via TWO fronts: trace-derived vs intent-driven

An earlier version of this doc wrote off A7 `wait`, A8 `call`, A9 `approval`, B4 model-routing as "structural / unreachable." **That was wrong.** A capability the compiler can EMIT is not the same as one an AUTONOMOUS subagent trace can DEMONSTRATE. There are two compile fronts:

- **Trace-derived** (`--from-session`): the pipeline is distilled from a demonstration. An autonomous agent never pauses for a human, waits for a webhook, or routes models — so these never appear in a self-driven trace.
- **Intent-driven** (`compile "<request>"` / the PRD): the pipeline is designed from stated intent. If the request asks for the capability, the design pass emits the node.

**Proven by compiling NL requests that demand each (skeletons inspected):**

| row | NL request asked for… | compiler emitted |
|---|---|---|
| **A9** approval/interactive | "show the list and pause for my approval before deleting" | `<state name="approve" type="interactive"><artifacts><edit path="decision.json"/></artifacts>` → `gate` (code) → YES:`delete` / NO:`aborted` |
| **A7** wait | "pause and wait for a webhook callback, time out after 10 min" | `<state name="wait_callback" type="wait" mode="file" path="webhook.json" timeout-ms="config.timeout_ms">` |
| **B4** model-routing | "review with three DIFFERENT models in parallel, then merge" | `<state name="fanout" type="parallel" over="data.tiers" branch="reviewer" concurrency="3">` with codegen auto-wiring `branchInput.model` per tier |

The runtime executes all of these (`fsm.ts` runs `approval`/`interactive`/`wait`; lint validates them; `_fsm-syntax.md` documents them). `--auto-approve` is the /generate pipeline's own PRD gate — it does NOT suppress emission of these nodes in the generated pipeline.

### Final matrix status (corrected)
- **Every capability row is reachable.** Control-flow + axes + inputs are covered by trace-derived cases (A1–A6, A10, B1–B3, C1–C4, E1–E2) and/or intent-driven design (A7 wait, A8 call, A9 approval/interactive, B4 model-routing — A9/A7/B4 PROVEN above; A8 `call` follows the same intent-driven path, not yet probed).
- **The only non-capability row is D3** — "skeleton → pipeline" is an INPUT FRONT (a format you feed the compiler), not a node it generates.
- **Honest split:** the trace-mining bench measures what a demonstration yields; the intent front (D2, also benched via `req-latency`) reaches the human-in-the-loop / scheduling / model-routing capabilities that no autonomous trace shows. Both are first-class.
