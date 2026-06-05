# fixture project

A tiny repo used by the reharness-bench `todo-extractor` case. It contains exactly two source markers:
`TODO: cache results across calls` (src/main.ts) and `FIXME: validate schema before parsing` (lib/parse.py).
The string `"// not a real TODO"` in `src/main.ts` is a decoy — a faithful extractor must NOT list it.
