// Parse tokens into an AST with correct precedence (* / over + -), left-associative.
export function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = () => tokens[pos++];
  function parsePrimary() {
    const t = eat();
    if (t.type === 'num') return { type: 'num', value: t.value };
    if (t.type === 'op' && t.value === '(') {
      const e = parseExpr();
      eat(); // closing paren
      return e;
    }
    throw new Error('unexpected');
  }
  function parseTerm() {
    let left = parsePrimary();
    // BUG 2: uses '+' and '-' here instead of '*' and '/' → precedence inverted
    while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = eat().value;
      const right = parsePrimary();
      left = { type: 'bin', op, left, right };
    }
    return left;
  }
  function parseExpr() {
    let left = parseTerm();
    while (peek() && peek().type === 'op' && (peek().value === '*' || peek().value === '/')) {
      const op = eat().value;
      const right = parseTerm();
      left = { type: 'bin', op, left, right };
    }
    return left;
  }
  return parseExpr();
}
