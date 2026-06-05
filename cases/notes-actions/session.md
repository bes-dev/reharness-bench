# Recorded session — turn meeting notes into a prioritized action summary

**User:** Here are the notes from today's standup (`notes.md`). Pull out the action items, figure out what's most urgent, and write me a short prioritized summary.

**Assistant:** I'll do this in three steps: first extract every action item from the notes, then rank them by urgency, then write a prioritized summary.

**Assistant:** Step 1 — action items I found in the notes:

> - Migrate the billing database to Postgres before Friday's compliance audit (Dana)
> - Reply to the Acme escalation about slow exports (Sam)
> - Redesign the onboarding screens in Figma (Lee)
> - Update the team wiki with the new on-call rota (Priya)

**Assistant:** Step 2 — ranking by urgency. The Postgres migration is hard-blocked by Friday's audit, so it's top priority. The Acme escalation is customer-facing and time-sensitive, so it's next. The Figma redesign and the wiki update are important but not time-critical.

**Assistant:** Step 3 — writing the prioritized summary to `summary.md`:

> `$ write summary.md`
> ```markdown
> # Prioritized action items
>
> 1. **Migrate billing DB to Postgres** (Dana) — blocks Friday's compliance audit; do first.
> 2. **Reply to the Acme escalation** (Sam) — customer-facing, slow exports; handle today.
> 3. **Redesign onboarding in Figma** (Lee) — important, not urgent.
> 4. **Update on-call rota in the wiki** (Priya) — low urgency.
> ```

**Assistant:** Done — extracted four action items, ranked them by urgency, and wrote the prioritized summary to `summary.md`.

**User:** Great, that ordering is exactly right.
