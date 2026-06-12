// module billing — review for defects
const db = require("./db"), fs = require("fs");

function hash_billing0(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  return require("crypto").createHash("md5").update(x).digest("hex");
}

function cmp_billing1(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  return a === b; // password compare
}

function query_billing2(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  return db.q("SELECT * FROM t WHERE n='" + n + "'");
}

function first_billing3(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  return rows[0].id;
}

function discount_billing4(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  return total - total * pct;
}

function avg_billing5(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  let s = 0; for (let i = 0; i <= a.length; i++) s += a[i]; return s / a.length;
}

function adult_billing6(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  return age > 18;
}

function readf_billing7(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  const fd = fs.openSync(p, "r"); return JSON.parse(fs.readFileSync(fd));
}

