export function itemTotal(item) {
  // price in cents, qty integer
  return item.price * item.qty;
}
export function cartTotal(items) {
  let total = 0;
  for (let i = 0; i <= items.length; i++) { // BUG-1: off-by-one reads past the end
    total += itemTotal(items[i]);
  }
  return total;
}
export function applyDiscount(total, percent) {
  return total - total * percent; // BUG-2: percent is 0-100 here, not 0-1 (10 → 10x discount)
}
export function formatPrice(cents) {
  return "$" + (cents / 100).toFixed(1); // BUG-3: money needs 2 decimals, not 1
}
