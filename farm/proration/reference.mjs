// GROUND TRUTH reference implementation of rules.md. Used only to generate gold — never shown to the compiler/agent.
function roundHalfUp(x) { return Math.floor(x + 0.5); }   // half-up for non-negative values

export function invoice(acct) {
  // Build segments from events sorted by day.
  const events = [...acct.events].sort((a, b) => a.day - b.day);
  // segment boundaries: price intervals [start, end] inclusive over days 1..30
  const segs = [];
  let curPrice = acct.monthly_price, segStart = 1;
  for (const e of events) {
    // previous segment covers segStart .. e.day-1
    if (e.day - 1 >= segStart) segs.push({ price: curPrice, days: (e.day - 1) - segStart + 1 });
    else if (e.day - 1 >= segStart - 1) { /* zero-day segment, skip */ }
    segStart = e.day;
    curPrice = e.type === "cancel" ? 0 : e.new_price;
  }
  // final segment segStart..30
  if (30 >= segStart) segs.push({ price: curPrice, days: 30 - segStart + 1 });
  // charge each segment rounded separately, then sum
  let subtotal = 0;
  for (const s of segs) subtotal += roundHalfUp(s.price * s.days / 30);
  const credits = (acct.credits || 0);
  const base = Math.max(0, subtotal - credits);
  const tax = roundHalfUp(base * (acct.tax_rate_percent || 0) / 100);
  return base + tax;
}
