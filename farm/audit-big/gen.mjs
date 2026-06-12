import { writeFileSync, mkdirSync } from "fs";
mkdirSync("farm/audit-big/fixture/src", { recursive: true });
const DEFECTS = [
  { name: "hash", body: `return require("crypto").createHash("md5").update(x).digest("hex");`, kw: ["md5", "weak"] },
  { name: "cmp", body: `return a === b; // password compare`, kw: ["timing", "constant"] },
  { name: "query", body: `return db.q("SELECT * FROM t WHERE n='" + n + "'");`, kw: ["inject", "sqli", "concat"] },
  { name: "first", body: `return rows[0].id;`, kw: ["empty", "undefined", "guard"] },
  { name: "discount", body: `return total - total * pct;`, kw: ["percent", "100", "scale"] },
  { name: "avg", body: `let s = 0; for (let i = 0; i <= a.length; i++) s += a[i]; return s / a.length;`, kw: ["off-by-one", "bounds", "past", "<="] },
  { name: "adult", body: `return age > 18;`, kw: [">=", "18", "boundary"] },
  { name: "readf", body: `const fd = fs.openSync(p, "r"); return JSON.parse(fs.readFileSync(fd));`, kw: ["leak", "close", "descriptor"] },
  { name: "fetchAll", body: `const o = []; for (const u of urls) o.push(await fetch(u)); return o;`, kw: ["sequential", "parallel"] },
  { name: "key", body: `return JSON.stringify(obj);`, kw: ["order", "determinis"] },
  { name: "amount", body: `return parseInt(s);`, kw: ["radix", "nan"] },
  { name: "div", body: `return a / b;`, kw: ["zero", "divisor"] },
  { name: "load", body: `try { return await db.get(id); } catch (e) {}`, kw: ["swallow", "silent", "empty catch"] },
  { name: "rand", body: `return Math.random().toString(36).slice(2); // session id`, kw: ["predict", "insecure", "crypto"] },
  { name: "copy", body: `const c = obj; c.x = 1; return c; // clone`, kw: ["mutat", "reference", "shallow"] },
  { name: "regexInput", body: `return new RegExp(userInput).test(s);`, kw: ["redos", "untrusted", "regex"] },
];
const mods = ["users", "orders", "auth", "reports", "billing", "gateway"];
const gold = [];
let gi = 0;
for (let m = 0; m < mods.length; m++) {
  let src = `// module ${mods[m]} — review for defects\nconst db = require("./db"), fs = require("fs");\n\n`;
  for (let k = 0; k < 8; k++) {
    const d = DEFECTS[(m * 8 + k) % DEFECTS.length];
    const fn = `${d.name}_${mods[m]}${k}`;
    src += `function ${fn}(x, a, b, n, rows, total, pct, age, p, urls, obj, s, id, userInput) {\n  ${d.body}\n}\n\n`;
    gold.push({ id: `G${gi++}`, fn, kw: d.kw });
  }
  writeFileSync(`farm/audit-big/fixture/src/${mods[m]}.js`, src);
}
writeFileSync("farm/audit-big/GOLD.json", JSON.stringify(gold, null, 1));
console.log(`generated ${mods.length} modules, ${gold.length} planted defects`);
