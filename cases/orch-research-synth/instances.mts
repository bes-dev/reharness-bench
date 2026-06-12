/** Held-out instances for the 4-agent research→synthesize orchestra. Fresh quarterly docs with rotated numbers;
 *  gold = the COMPUTED three-quarter total (proves it adds, not echoes — the demo's 548 never recurs) + the two
 *  Q3 enterprise client names + the final NPS. A distractor doc is always present and must be ignored. */
import { rng, int, pick } from "../../instances-lib.mts";

export const count = 5;

const CLIENTS = ["Norvex", "Atlund", "Cervia", "Mistwood", "Pellagro", "Quenta", "Volkrest", "Sabreen",
  "Hollowmere", "Tindrel", "Caskade", "Brynmoor", "Oloran", "Pencove", "Wrenfield", "Galloway"];

export default function gen(i: number) {
  const r = rng(6000 + i);
  let q1 = 0, q2 = 0, q3 = 0, total = 0;
  do { q1 = int(r, 90, 160); q2 = int(r, 150, 199); q3 = int(r, 205, 260); total = q1 + q2 + q3; }
  while (total === 548 || [q1, q2, q3].some(x => String(total).includes(String(x))));
  const names = pick(r, CLIENTS, 5);
  const [c1a, c1b, c2, c3a, c3b] = names;
  const nps = [int(r, 25, 35), int(r, 38, 47), int(r, 50, 60)];
  return {
    files: {
      "docs/q1-update.md": `# Q1 internal update\nRevenue closed at ${q1} k$. We onboarded 2 enterprise clients (${c1a}, ${c1b}).\nChurn: lost 1 SMB account.\n`,
      "docs/q2-board-notes.md": `Board notes, Q2. Topline: ${q2} k$ revenue. One enterprise add (${c2}).\nNPS moved from ${nps[0]} to ${nps[1]}.\n`,
      "docs/q3-allhands.md": `All-hands excerpt. CFO: "Q3 lands at ${q3} thousand dollars." Two enterprise logos signed: ${c3a} and ${c3b}. NPS at ${nps[2]}.\n`,
      "docs/random-memo.md": `Reminder: the plant-watering rota changes next week. Offsite photos are up.\n`,
      "questions.md": `Answer in summary.md:\n1. Total revenue for the first three quarters combined (k$).\n2. How many enterprise clients were signed across Q1-Q3, and name them.\n3. NPS trajectory across the quarters.\n4. Which quarter first exceeded 200 k$?\n`,
    },
    expectPresent: [String(total), c3a, c3b, String(nps[2])],
    decoyAbsent: ["plant-watering"],
  };
}
