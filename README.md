# reharness-bench

Execution-based benchmark for the [reharness](../pi-fsm) reasoning compiler. It compiles real and
authored agent sessions (and NL requests) into FSM pipelines, then **runs the compiled pipeline on a
fixture and checks the real outcome** with a deterministic verifier — "compiles green" is not the bar.

## Layers (gated, cheap → expensive)
- **L0 ingest** — the session/request was read + staged (format-agnostic)
- **L1 compile** — verify is green (tsc + structural + dataflow)
- **L2 non-hollow** — the lib isn't a verify-passing stub
- **L3 fidelity** — the PRD captures the task + the external target is parameterised (`<arg>` / manifest)
- **L4 execution** — the compiled command runs on a fixture; a deterministic verifier checks the outcome

Each compile's **observed cost** (agent runs · tokens · $) is parsed from the compiler's own verdict line and
reported per case + aggregated (total/mean/median) — the one-time numerator for break-even curves
(`N = compile_cost / per-run saving`).

**Held-out instances (generalization).** A case may ship `instances.mts` (`export const count = K; export
default (i) => { files, expectPresent, decoyAbsent?, runArgs? }`): the harness compiles ONCE, then runs the
compiled command on K seeded fixture variants with **per-instance gold** and reports `generalization: m/K`
(+ a families aggregate). Golds are designed so demo-echo fails — e.g. `trace-logtriage` rotates the dominant
error type per instance; a pipeline that hardcodes the demo's answer cannot pass. This is the class's central
metric — one demonstration → a family — measured in the standard run, not only in `experiments/`.

## Run
```
npm install
npm link reharness            # put the compiler under test on PATH (or: REHARNESS_CLI=/path/to/dist/cli.js)
npm run bench                 # all cases
npm run bench -- <case-id>    # one case, e.g. trace-fixbug
npm run bench -- corpus 3     # compile the 3 largest real synthtraces (L0–L2)
npm run mine                  # stratify the corpus by capability (heuristic, no LLM)
```
Set `REHARNESS_CLI` to a working-tree `dist/cli.js` to bench an unreleased build.

## Layout
- `cases/<id>/` — a case: `meta.json`, `session.jsonl|md` (or an NL `request` in meta), `fixture/`, optional `verify.mjs`
- `run.mts` — the harness (compile → L0–L4)
- `mine.mts` — corpus property-stratifier
- `CAPABILITIES.md` — the compiler capability matrix this bench targets
- `corpus/` — third-party trajectory data (gitignored): `synthtraces/` (julien-c/synthtraces), `nemotron/` (nvidia/Nemotron-Agentic-v1), `traces/` (captured subagent runs), `agent-race/` (davanstrien/agent-race-traces — the SAME task through different harnesses/models: demonstrator-invariance material), `cc-kimi/` + `cc-minimax/` (armand0e Claude Code traces). (nlile/misc-merged is parquet-packed ~1GB — skipped for now.)

## Provenance of cases
- **mined real-trace** (`trace-*`): captured from real subagent runs on self-verifying tasks (unbiased trajectories; tasks authored)
- **authored sessions**: hand-written demonstrations
- **NL-request**: compiled from a natural-language request (no session)
- **corpus**: third-party HF datasets — L0–L2 only (no fixtures/gold)
