// Evaluate the AST to a number.
export function evaluate(node) {
  if (node.type === 'num') return node.value;
  const l = evaluate(node.left), r = evaluate(node.right);
  switch (node.op) {
    case '+': return l + r;
    case '-': return l - r;
    case '*': return l * r;
    // BUG 3: division missing → '/' throws → all division tests fail (masked until parse works)
    default: throw new Error('bad op ' + node.op);
  }
}
