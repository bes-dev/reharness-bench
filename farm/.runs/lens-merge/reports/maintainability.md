# Maintainability Audit — src/server.mjs

## M1. Dead code: `unusedLegacyHandler` (line 16) — Medium
```js
function unusedLegacyHandler(req, res) { res.end("gone"); } // dead code
```
Never referenced. Delete it.

## M2. Dead state: `users` array (line 4) — Medium
`const users = [];` is declared and never read or written. Delete it.

## M3. Dead constant: `API_KEY` (line 3) — Medium
`API_KEY` is never used anywhere in the module (it is also a security problem — see the security report). From a maintainability standpoint it is dead code that misleads readers into thinking the server is authenticated.

## M4. Module side effect: importing the module starts the server (line 17) — Medium
`createServer(...).listen(8080)` runs at module top level while the file also `export`s utility functions. Any consumer (including a test) that imports `findUser` or `rank` silently binds port 8080. Separate concerns: export a `start()` (or move the listener to a `bin/` entry) so the module is import-safe — one file, one responsibility.

## M5. Vague naming and undocumented semantics in `rank` (lines 9–15) — Low
`out` says nothing; the function returns "count of strictly greater scores" (0-based rank) but the name and lack of any doc leave that to be reverse-engineered from the nested loop. The result is also a sparse array (top scores stay `undefined`), which is a surprise for callers. Rename (`ranks`), initialize with zeros, and state the contract.

## M6. Hardcoded port and data path (lines 7, 17) — Low
`8080` and `./data/users.txt` (a CWD-relative path, fragile to where the process is launched) are inlined. Lift them to named constants / env-configurable values.
