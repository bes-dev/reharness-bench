import { cartTotal, applyDiscount, formatPrice } from "./src/cart.mjs";
let fails = 0;
const eq = (got, want, label) => { if (got !== want) { console.log(`FAIL ${label}: got ${got}, want ${want}`); fails++; } };
eq(cartTotal([{ price: 100, qty: 2 }, { price: 50, qty: 1 }]), 250, "cartTotal");
eq(applyDiscount(1000, 10), 900, "applyDiscount 10%");
eq(formatPrice(1234), "$12.34", "formatPrice");
if (!fails) console.log("ALL TESTS PASS"); else process.exit(1);
