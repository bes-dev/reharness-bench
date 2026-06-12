Read accounts.json and rules.md. For EACH account compute the cycle invoice total in cents, following
rules.md EXACTLY (proration with per-segment rounding, credit floor at 0, tax on the floored base).
Write invoices.json: a JSON array of { "account", "total" }, one per account.
