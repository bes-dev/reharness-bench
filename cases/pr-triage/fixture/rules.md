# PR risk triage — rubric

You are triaging pull requests. For EACH PR decide a risk level by combining TWO things:
1. The INTENT of the change, from its title/description:
   - "behavior": it changes how the code runs (logic, algorithms, schema, signing, retries, capture, validation).
   - "surface": it does NOT change behavior (docs, comments, tests, error wording, formatting, version-in-comment).
2. The BLAST RADIUS of the file it touches, from impact.json. A file is "hot" if `critical` is true OR `deps >= 10`.

Risk rubric:
- high   = behavior change on a HOT file.
- medium = behavior change on a non-hot file, OR a surface change on a HOT file.
- low    = surface change on a non-hot file.

A keyword is NOT enough: "fix typo in payment docs" is a SURFACE change to a non-hot file → low, despite "payment".
"reword an error message" in auth/session.ts (hot) is surface-on-hot → medium, not high.

## Output
Write report.json:
{
  "prs": [ { "id": <int>, "risk": "high|medium|low" }, ... one per PR ],
  "summary": { "high": <count>, "medium": <count>, "low": <count>,
               "high_ids": [<ids sorted asc>], "high_lines_total": <sum of lines_changed over high-risk PRs> }
}
