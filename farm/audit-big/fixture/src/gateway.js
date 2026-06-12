// module gateway — review for defects
const db = require("./db"), fs = require("fs");

function fetchAll_gateway0(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  const o = []; for (const u of urls) o.push(await fetch(u)); return o;
}

function key_gateway1(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  return JSON.stringify(obj);
}

function amount_gateway2(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  return parseInt(s);
}

function div_gateway3(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  return a / b;
}

function load_gateway4(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  try { return await db.get(id); } catch (e) {}
}

function rand_gateway5(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  return Math.random().toString(36).slice(2); // session id
}

function copy_gateway6(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  const c = obj; c.x = 1; return c; // clone
}

function regexInput_gateway7(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {
  return new RegExp(userInput).test(s);
}

