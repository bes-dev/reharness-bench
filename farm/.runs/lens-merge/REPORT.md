# Audit — src/server.mjs (merged findings, ordered by severity)

Merged from `reports/security.md`, `reports/performance.md`, `reports/maintainability.md`. Duplicates collapsed: the unused `API_KEY` (security + maintainability) is one item; the blocking/per-call `execSync` inefficiencies are one item; the sparse `rank` output is folded into the `rank` contract item.

1. **[security] Shell command injection in `findUser`** (line 7) — Critical.
   `name` is interpolated into a shell string passed to `execSync`; `$()`/backticks execute even inside the double quotes → arbitrary command execution. Use `execFile` with an args array, or match in JS.

2. **[security] Hardcoded live API key, never used** (line 3) — High.
   `sk-live-9f8e7d6c5b4a` committed in source; rotate the key and load from env. (Also dead code — maintainability.)

3. **[performance] Synchronous shell-out per lookup in `findUser`** (line 7) — High.
   `execSync` blocks the whole event loop, and every call forks shell+grep and rescans the file from disk (`-r` is pointless on one file). Read the file once and search in memory, asynchronously.

4. **[security] Unhandled `execSync` failure** (line 7) — Medium.
   `grep` exits 1 on "no match" → `execSync` throws; no try/catch, so a normal not-found lookup crashes/500s, and the error message echoes the full shell command.

5. **[performance] `rank` is O(n²)** (lines 9–15) — Medium.
   Nested pairwise comparison; sort once and map score → rank for O(n log n).

6. **[maintainability] Importing the module starts the server** (line 17) — Medium.
   Top-level `listen(8080)` in a file that also exports utilities: any import (e.g. a test of `rank`) binds the port. Export a `start()` instead.

7. **[maintainability] Dead code: `unusedLegacyHandler` and `users`** (lines 4, 16) — Medium.
   Both are never referenced; delete.

8. **[maintainability] `rank` contract is undocumented and its output sparse** (lines 9–15) — Low.
   Vague `out` name, "count of strictly greater scores" semantics left implicit, and top scores stay `undefined` (holes) instead of 0. Rename, zero-initialize, document.

9. **[maintainability] Hardcoded port and CWD-relative data path** (lines 7, 17) — Low.
   `8080` and `./data/users.txt` inlined; the relative path breaks when launched from another directory. Lift to named, configurable constants.
