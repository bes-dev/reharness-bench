# Recorded session — write a tagline that fits a length limit

**User:** Read the product brief in `brief.md` and write me a tagline for it. Hard rule: it must be **40 characters or fewer** and it must contain the product name. Keep revising until it fits.

**Assistant:** I'll read the brief, draft a tagline, check it against the two rules (≤ 40 characters, contains the product name), and revise until both pass.

**Assistant:** Draft 1: `Reharness — compile your reasoning into fast, runnable AI workflows`
> Check: 66 characters — too long. Revising to cut it down.

**Assistant:** Draft 2: `Reharness: compile reasoning into workflows`
> Check: 43 characters — still over 40. Trimming further.

**Assistant:** Draft 3: `Reharness: compile reasoning to workflows`
> Check: 41 characters — one over. Trimming once more.

**Assistant:** Draft 4: `Reharness: reasoning, compiled`
> Check: 30 characters ✓ and contains "Reharness" ✓. Both rules pass.

**Assistant:** Writing the final tagline to `tagline.txt`:

> `$ write tagline.txt`
> ```
> Reharness: reasoning, compiled
> ```

**Assistant:** Done — the tagline "Reharness: reasoning, compiled" is 30 characters and includes the product name. It passed after four revisions.

**User:** Nice, that works.
