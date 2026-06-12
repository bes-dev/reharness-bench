const db = require('./db');
const crypto = require('crypto');

// AUTH ---------------------------------------------------------------
function hashPassword(pw) {
  return crypto.createHash('md5').update(pw).digest('hex');          // D1 weak-hash: md5 for passwords
}
function checkPassword(pw, stored) {
  return hashPassword(pw) === stored;                                 // D2 timing: non-constant-time compare
}
function makeToken(userId) {
  return Buffer.from(userId + ':' + Date.now()).toString('base64');   // D3 auth: forgeable token, no signature
}

// QUERIES ------------------------------------------------------------
function findUser(name) {
  return db.query("SELECT * FROM users WHERE name = '" + name + "'"); // D4 sqli: string-concatenated query
}
function listUsers(limit) {
  return db.query("SELECT * FROM users LIMIT " + limit);              // D5 sqli: unvalidated limit interpolation
}
function getUserSync(id) {
  const rows = db.querySync("SELECT * FROM users WHERE id = " + id);
  return rows[0];                                                     // D6 crash: no empty-result guard (rows[0] undefined)
}

// BUSINESS LOGIC -----------------------------------------------------
function applyDiscount(total, pct) {
  return total - total * pct;                                         // D7 logic: pct is 0-100 not 0-1 (10 => 10x)
}
function averageAge(users) {
  let sum = 0;
  for (let i = 0; i <= users.length; i++) sum += users[i].age;       // D8 bounds: off-by-one reads past end
  return sum / users.length;
}
function isAdult(user) {
  return user.age > 18;                                               // D9 logic: should be >= 18
}

// RESOURCES ----------------------------------------------------------
function readConfig(path) {
  const fs = require('fs');
  const fd = fs.openSync(path, 'r');
  const data = fs.readFileSync(fd);
  return JSON.parse(data);                                            // D10 leak: fd never closed
}
async function fetchAll(urls) {
  const out = [];
  for (const u of urls) out.push(await fetch(u));                     // D11 perf: sequential awaits, should be parallel
  return out;
}
function cacheKey(obj) {
  return JSON.stringify(obj);                                         // D12 correctness: key order non-deterministic
}

// ERROR HANDLING -----------------------------------------------------
function parseAmount(s) {
  return parseInt(s);                                                 // D13 bug: no radix, no NaN check
}
function divide(a, b) {
  return a / b;                                                       // D14 edge: no zero-divisor guard
}
async function loadUser(id) {
  try { return await db.get(id); } catch (e) {}                       // D15 error: swallowed exception, returns undefined
}

module.exports = { hashPassword, checkPassword, makeToken, findUser, listUsers, getUserSync, applyDiscount, averageAge, isAdult, readConfig, fetchAll, cacheKey, parseAmount, divide, loadUser };
