Classify each support ticket into exactly one priority, by the SITUATION it describes (not keywords):
- P0 — a current outage or critical loss: service down, data loss, security breach, or payments failing for many/all users.
- P1 — a major feature broken for many users, or significant ongoing degradation (not a full outage).
- P2 — a minor or single-user problem, cosmetic issue, or a question that has a workaround.
- noise — not actionable: spam, thanks, feature wishes, or a problem the reporter already self-resolved.

Write routing.json: a JSON array of { "id": <int>, "priority": "P0|P1|P2|noise" }, one entry per ticket.
