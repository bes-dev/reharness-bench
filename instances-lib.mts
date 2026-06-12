/** Shared helpers for case `instances.mts` generators. Everything is SEEDED — instance i is byte-identical
 *  across runs (the bench's determinism story applies to the bench itself). */

/** mulberry32 — tiny deterministic PRNG. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform int in [lo, hi] inclusive. */
export const int = (r: () => number, lo: number, hi: number): number => lo + Math.floor(r() * (hi - lo + 1));

/** k distinct picks from pool (k ≤ pool.length). */
export function pick<T>(r: () => number, pool: T[], k: number): T[] {
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, k);
}
