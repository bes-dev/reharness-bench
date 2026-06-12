Audit src/server.mjs from three separate perspectives, writing one report per lens:
  reports/security.md  — vulnerabilities and unsafe handling
  reports/performance.md — algorithmic and I/O inefficiencies
  reports/maintainability.md — dead code, naming, structure
Each report lists concrete findings with line references. Then write REPORT.md in the root: a single
merged, deduplicated list ordered by severity (your judgment), each item tagged with its lens.
