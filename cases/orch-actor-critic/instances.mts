/** Held-out instances for the write⇄critique loop. Fresh product specs (rotated, never the demo's AeroBrew X2);
 *  gold = every spec field value present in final.md AND the banned words absent. The critic must enforce both,
 *  so passing proves the loop's two judgments generalize to a product it never saw. */
import { rng, int, pick } from "../../instances-lib.mts";

export const count = 5;

const PRODUCTS = [
  { name: "NimbusPress C1", type: "cold-brew tower" },
  { name: "Volt Kettle 9", type: "smart electric kettle" },
  { name: "Drift Grinder S", type: "hand burr grinder" },
  { name: "Cumulus Frother", type: "milk frother" },
  { name: "Terra Roaster Mini", type: "home bean roaster" },
];

export default function gen(i: number) {
  const r = rng(7000 + i);
  const p = PRODUCTS[i % PRODUCTS.length];
  const weight = int(r, 200, 900);
  const power = int(r, 6, 24);
  const battery = int(r, 12, 60);
  const price = int(r, 49, 299);
  return {
    files: {
      "specs.json": JSON.stringify({ product: p.name, type: p.type, weight_g: weight, power_units: power, uses_per_charge: battery, charge_usb_c: true, price_usd: price }, null, 2) + "\n",
      "rules.md": [
        "The final copy in final.md MUST:",
        "1. mention every spec field value (product name, weight, power, uses per charge, USB-C, price);",
        "2. be at most 120 words;",
        '3. avoid the banned words: "revolutionary", "game-changer", "world-class", "synergy";',
        "4. end with a one-line call to action.",
        "",
      ].join("\n"),
    },
    expectPresent: [p.name, String(weight), String(battery), String(price), "USB-C"],
    decoyAbsent: ["revolutionary", "game-changer"],
  };
}
