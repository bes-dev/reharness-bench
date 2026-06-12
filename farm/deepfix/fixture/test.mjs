import { tokenize } from './src/tokenize.mjs';
import { parse } from './src/parse.mjs';
import { calc } from './src/index.mjs';
let fail = 0, pass = 0;
const eq = (g, w, label) => { const ok = JSON.stringify(g) === JSON.stringify(w); if (ok) pass++; else { fail++; console.log(`FAIL ${label}: got ${JSON.stringify(g)} want ${JSON.stringify(w)}`); } };
// tokenize (multi-digit)
eq(tokenize('42').length, 1, 'tok-single-token-for-42');
eq(tokenize('42')[0].value, 42, 'tok-42');
eq(tokenize('100+2')[0].value, 100, 'tok-100');
// parse precedence + eval
eq(calc('2+3*4'), 14, 'prec-2+3*4');
eq(calc('2*3+4'), 10, 'prec-2*3+4');
eq(calc('10-2-3'), 5, 'left-assoc-sub');
eq(calc('2+3'), 5, 'add');
eq(calc('20/4'), 5, 'div');
eq(calc('100/5/2'), 10, 'div-chain');
eq(calc('(2+3)*4'), 20, 'paren');
eq(calc('12+34'), 46, 'multidigit-add');
eq(calc('2*3*4'), 24, 'mul-chain');
if (fail === 0) console.log('ALL TESTS PASS'); else console.log(`${fail} FAILED, ${pass} passed`);
process.exit(fail === 0 ? 0 : 1);
