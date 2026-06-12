/** Held-out instances for the extract→compose pipeline (judgment + demoted code). Fresh transcript with rotated
 *  owners and per-instance unique action tokens; gold = each owner's unique action phrase appears in SOME email
 *  (the code emit stage partitions by owner). Proves the extraction judgment generalizes and the amortized
 *  compose still routes correctly, on a meeting it never saw. */
import { rng, int, pick } from "../../instances-lib.mts";

export const count = 5;

const NAMES = ["MAYA", "JONAS", "PRIYA", "DEV", "INES", "OMAR", "LENA", "TARIQ"];

export default function gen(i: number) {
  const r = rng(9000 + i);
  const [a, b, c] = pick(r, NAMES, 3);
  const tok = int(r, 100, 999);                                   // unique token threaded into each action
  return {
    files: {
      "transcript.md": [
        `# Sprint planning, run ${tok} (excerpt)`,
        "",
        `${a}: I'll take rewriting the payment-retry-queue-${tok} this sprint.`,
        `${b}: I can own the migration-runbook-${tok} then. Draft by Thursday.`,
        `${a}: Also someone must rotate the staging-certs-${tok} before the 20th.`,
        `${c}: That's mine, I did it last time. And I'll send the demo-invite-${tok} once the build is tagged.`,
        `${b}: Noted. I'll also tag the stable-build-${tok} on the 16th.`,
        "",
      ].join("\n"),
    },
    // each unique phrase must survive into the per-owner emails (partition correctness via presence)
    expectPresent: [`payment-retry-queue-${tok}`, `migration-runbook-${tok}`, `staging-certs-${tok}`, `demo-invite-${tok}`],
  };
}
