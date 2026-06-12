/** Held-out instances: triage a fresh log. The DOMINANT error type rotates by instance index — a pipeline that
 *  hardcodes the demo's "DatabaseTimeout" fails every instance whose top error is different. Gold = the top two
 *  error type names (a frequency summary necessarily names them, regardless of count formatting). */
import { rng, int, pick } from "../../instances-lib.mts";

export const count = 8;

const TYPES = ["DatabaseTimeout", "NullPointer", "AuthFailure", "DiskFull", "RateLimitExceeded", "CacheCorruption", "ConnectionReset", "SchemaViolation"];
const NOISE = ["INFO  server started", "WARN  slow response 1200ms", "INFO  request ok", "INFO  healthcheck passed", "WARN  retry scheduled", "INFO  cache warmed"];

export default function gen(i: number) {
  const r = rng(4000 + i);
  const top = TYPES[i % TYPES.length];                              // deterministic rotation of the dominant type
  const others = pick(r, TYPES.filter(t => t !== top), 2);
  const counts: Array<[string, number]> = [[top, int(r, 6, 9)], [others[0], int(r, 2, 4)], [others[1], 1]];
  const lines: string[] = [];
  let minute = 0;
  for (const [type, n] of counts)
    for (let k = 0; k < n; k++) lines.push(`2026-02-01T09:${String(minute++).padStart(2, "0")} ERROR ${type} in handler${int(r, 1, 9)}`);
  for (let k = 0; k < int(r, 5, 9); k++) lines.push(`2026-02-01T09:${String(minute++).padStart(2, "0")} ${NOISE[int(r, 0, NOISE.length - 1)]}`);
  // deterministic shuffle so errors and noise interleave like a real log
  for (let k = lines.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [lines[k], lines[j]] = [lines[j], lines[k]]; }
  return { files: { "app.log": lines.join("\n") + "\n" }, expectPresent: [top, others[0]] };
}
