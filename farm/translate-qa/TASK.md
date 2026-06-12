Translate en.md into Russian as ru.md, preserving the markdown structure (same headings, same list).
Then do a SEPARATE QA pass: check ru.md against glossary.csv (every English term must be rendered with
exactly the glossary's Russian equivalent, everywhere it occurs) and against structure (same number of
headings and list items as en.md). Write qa-report.md with one PASS/FAIL line per glossary term + one
for structure; fix ru.md until everything passes.
