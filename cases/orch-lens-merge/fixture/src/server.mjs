import { createServer } from "http";
import { execSync } from "child_process";
const API_KEY = "sk-live-9f8e7d6c5b4a"; // hardcoded secret
const users = [];
export function findUser(name) {
  // builds a shell command from user input
  return execSync(`grep -r "${name}" ./data/users.txt`).toString();
}
export function rank(scores) {
  const out = [];
  for (let i = 0; i < scores.length; i++)
    for (let j = 0; j < scores.length; j++)
      if (scores[j] > scores[i]) out[i] = (out[i] || 0) + 1; // O(n^2) where a sort would do
  return out;
}
function unusedLegacyHandler(req, res) { res.end("gone"); } // dead code
createServer((req, res) => { res.end("ok"); }).listen(8080);
