# Task: run-length encode

Implement `rle(s)` in `impl.mjs` (export it).
Run-length-encode a string: each run of a repeated character becomes the
character followed by the run length.

Examples:
- `rle("aaabbc")` → `"a3b2c1"`
- `rle("x")` → `"x1"`
- `rle("")` → `""`
- `rle("aAa")` → `"a1A1a1"`  (case-sensitive)
