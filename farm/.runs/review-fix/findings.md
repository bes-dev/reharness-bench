# Findings

- src/cart.mjs — cartTotal: loop condition `i <= items.length` reads one past the end of the array, adding NaN to the total.
- src/cart.mjs — applyDiscount: percent is on a 0-100 scale but used as a 0-1 fraction, so a 10% discount subtracts 10x the total (needs /100).
- src/cart.mjs — formatPrice: uses .toFixed(1) instead of .toFixed(2), producing one decimal place for a money value.
