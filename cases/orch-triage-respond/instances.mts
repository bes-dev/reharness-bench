/** Held-out instances for the triage→respond parallel orchestra. Fresh inbox with rotated ticket↔category
 *  mapping and a per-instance unique billing token (a PO number); gold = the category-driven reply anchors
 *  (refund for billing, BUG- ref for the bug, roadmap for feature) AND the unique PO survives into a reply —
 *  proving classification routed correctly and composition followed the rules, on tickets it never saw. The
 *  spam ticket must get no reply, checked via decoy. */
import { rng, int } from "../../instances-lib.mts";

export const count = 5;

const BUGS = ["the export button spins forever (500 from /api/export)", "search returns no results after the latest update",
  "the dashboard charts render blank on Safari", "CSV import drops the last row every time", "login redirects in a loop on mobile"];
const FEATS = ["a dark theme for night work", "keyboard shortcuts for navigation", "bulk export to PDF",
  "two-factor authentication", "a weekly summary email"];
const SPAM = ["YOU WON 1,000,000 USD — click to claim!!!", "Hot singles in your datacenter", "Refinance your mortgage NOW"];

export default function gen(i: number) {
  const r = rng(8000 + i);
  const po = `PO-${int(r, 10000, 99999)}`;
  const bug = BUGS[i % BUGS.length], feat = FEATS[i % FEATS.length], spam = SPAM[i % SPAM.length];
  return {
    files: {
      "inbox/a.txt": `From: dana@corp.example\nSubject: charged twice this month\nI see two charges on my invoice but only one seat. Please fix this.\n`,
      "inbox/b.txt": `From: lee@startup.example\nSubject: bug report\n${bug}\n`,
      "inbox/c.txt": `From: promo@lottery.example\nSubject: prize\n${spam}\n`,
      "inbox/d.txt": `From: prof@uni.example\nSubject: feature wish\nAny chance of ${feat}?\n`,
      "inbox/e.txt": `From: ops@bigco.example\nSubject: invoice needs our PO number\nFinance rejects invoices without a PO. Add ${po} to our invoice and resend.\n`,
      "rules.md": [
        "Reply rules by category:",
        '- billing: apologize, state a corrected invoice will be issued within 2 business days, include the word "refund" if money was overcharged, echo any PO number provided.',
        "- bug: thank the reporter, include a ticket reference in the form BUG-<inbox letter>, state it is reproduced or escalated.",
        "- feature: thank them, say it is added to the roadmap, no date promises.",
        "- spam: no reply.",
        "",
      ].join("\n"),
    },
    expectPresent: ["refund", "BUG-", "roadmap", po],
    decoyAbsent: ["lottery", "prize"],
  };
}
