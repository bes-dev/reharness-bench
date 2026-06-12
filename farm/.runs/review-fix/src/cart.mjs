export function itemTotal(item) {
  // price in cents, qty integer
  return item.price * item.qty;
}
export function cartTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += itemTotal(items[i]);
  }
  return total;
}
export function applyDiscount(total, percent) {
  return total - total * (percent / 100);
}
export function formatPrice(cents) {
  return "$" + (cents / 100).toFixed(2);
}
