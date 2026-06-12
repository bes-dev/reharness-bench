# Subscription proration billing — exact rules

A billing cycle is exactly 30 days, days numbered 1..30. All money is in integer CENTS.
For each account compute the invoice total for the cycle, following these rules EXACTLY.

## Plan segments (proration)
- An account begins the cycle on a plan with `monthly_price` (cents).
- Events (each has a `day` in 1..30), applied in increasing day order:
  - `change` to `new_price`: from `day` onward the new price applies.
  - `cancel`: from `day` onward there is NO plan (price 0 for the rest of the cycle).
- This splits the cycle into consecutive segments. A segment that runs over `n` days at price `p`
  is charged: `round_half_up(p * n / 30)`. ROUND EACH SEGMENT SEPARATELY, then SUM the rounded
  segment charges. Do NOT compute an exact fractional total and round once.
- Day counting: a change/cancel on `day D` means the PREVIOUS segment covers days `1..D-1`
  (that is `D-1` days), and the next segment starts on day `D`. The final segment runs to day 30
  inclusive. (Example: a single `change` on day 16 → first segment = 15 days, second = 15 days.)

## Credits and tax
- `credits` (cents) are summed and subtracted from the prorated subtotal.
- `base = max(0, prorated_subtotal - credits)`. Excess credit is NOT carried forward; it is lost.
- `tax = round_half_up(base * tax_rate_percent / 100)`. Tax is computed on the floored base.
- `invoice_total = base + tax`.

## Rounding
- `round_half_up(x)`: round to the nearest integer; exactly-.5 rounds UP (away from zero for positives).

## Output
Write `invoices.json`: a JSON array of `{ "account": <id>, "total": <int cents> }`, one per account.
