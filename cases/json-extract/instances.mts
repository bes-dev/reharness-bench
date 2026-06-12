/** Held-out instances: extract the `name` field from a fresh JSON array. The name pool is disjoint from the
 *  demo's (Zephyr/Mirabel/Caspian) — a pipeline that echoes the demo's names fails. decoy: emails must not leak. */
import { rng, int, pick } from "../../instances-lib.mts";

export const count = 8;

const NAMES = [
  "Orla Fenwick", "Dmitri Castellan", "Yuki Tanahara", "Beatrix Mwangi", "Soren Veldhuis",
  "Anouk Tremblay", "Rafael Quintero", "Ingrid Halvorsen", "Tomas Brennan", "Leilani Akana",
  "Viktor Sokolov", "Priya Raghunathan", "Emeka Obi", "Greta Lindqvist", "Mateo Aguirre",
];

export default function gen(i: number) {
  const r = rng(2000 + i);
  const names = pick(r, NAMES, int(r, 4, 6));
  const arr = names.map(n => ({ name: n, email: `${n.split(" ")[0].toLowerCase()}@example.com` }));
  return {
    files: { "users.json": JSON.stringify(arr, null, 2) + "\n" },
    expectPresent: names,
    decoyAbsent: ["example.com"],
  };
}
