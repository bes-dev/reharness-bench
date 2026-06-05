// Pricing helpers.

function applyDiscount(total, pct) {
  // pct is a percentage like 20 for 20%
  return total - total * pct;
}

function subtotal(items) {
  return items.reduce((sum, it) => sum + it.price * it.qty, 0);
}

module.exports = { applyDiscount, subtotal };
