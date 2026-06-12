// Tokenize an arithmetic expression into numbers, operators, parens.
export function tokenize(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    if (c >= '0' && c <= '9') {
      let n = c;
      // BUG 1: only reads a single digit — multi-digit numbers break everything downstream
      out.push({ type: 'num', value: Number(n) });
      i++;
      continue;
    }
    if ('+-*/()'.includes(c)) { out.push({ type: 'op', value: c }); i++; continue; }
    throw new Error('bad char ' + c);
  }
  return out;
}
