# Performance Audit — src/server.mjs

## P1. Blocking `execSync` in `findUser` (line 7) — High
`execSync` blocks the entire Node event loop for the lifetime of the child process. If `findUser` is ever invoked from the HTTP server (the obvious intent), every lookup freezes all concurrent requests.
Fix: use the async `execFile`/`spawn`, or read the file with `fs.promises`.

## P2. Process spawn + full file scan per lookup (line 7) — Medium
Each `findUser` call forks a shell and a `grep` process and re-reads `./data/users.txt` from disk. That is ~milliseconds of fork/exec overhead and repeated I/O for what is an in-memory string match. The `-r` flag is also pointless on a single file.
Fix: load the user file once (or on change) into memory and search in JS.

## P3. `rank` is O(n²) where O(n log n) suffices (lines 9–15) — Medium
```js
for (let i = 0; i < scores.length; i++)
  for (let j = 0; j < scores.length; j++)
    if (scores[j] > scores[i]) out[i] = (out[i] || 0) + 1;
```
The nested loop compares every pair: 10k scores → 100M comparisons. Sorting a copy once and mapping each score to its rank via the sorted order (or a Map of score → rank) gives O(n log n).
Side note: elements with the highest score never get assigned, leaving holes (`undefined`) in the sparse `out` array — initialize with zeros.
