import { tokenize } from './tokenize.mjs';
import { parse } from './parse.mjs';
import { evaluate } from './eval.mjs';
export function calc(expr) { return evaluate(parse(tokenize(expr))); }
