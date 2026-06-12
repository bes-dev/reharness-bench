# Anomaly explanations

## 104 — personal_expense (velora, 2026-05-14, $18)
The memo reads "coffee for the office party REIMBURSE personal card" — an out-of-pocket expense, not a service charge. The velora customer record is explicit that "expenses are NOT billable"; their billable items are the $2,750 monthly consulting retainers (107, 110), which this is not. It should be handled as an internal reimbursement, not billed to the client.

## 105 — duplicate (nordica, 2026-04-12, $450)
This is a same-day, same-amount copy of transaction 102 ("seat expansion 5 users PO-1182"), and its own memo admits it: "duplicate of 102 submitted twice by mistake". The amount checks out for exactly one expansion (5 users × $90 seat price per nordica's per-seat plan), so only 102 — the one carrying the required PO — should be billed; 105 must be dropped.

## 106 — double_charge (brimstone, 2026-04-03, $9,800)
Brimstone's record says "single prepay per year" for annual contract AC-2207, yet two $9,800 prepays appear in April. Sibling transaction 109 (2026-04-09) is marked "RESUBMITTED after bank bounce", meaning this original 2026-04-03 attempt failed and was superseded. Billing both would charge the annual contract twice; 109 is the live charge and 106 should not be billed.

## Not flagged (deliberate judgment calls)
- 101 / 103 / 108 (acme): legitimate recurring monthly platform fees in different months. 108's reduced amount ($1,187 vs $1,200) is explained by a 3-day outage credit, consistent with acme's "SLA credits apply on outages".
- 107 / 110 (velora): the $2,750 retainer matches the customer record and recurs monthly — legitimate.
- 102 (nordica) and 109 (brimstone): the valid originals of the pairs whose copies were flagged above.
