// String formatting helpers.

function titleCase(s) {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function truncate(s, n) {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

module.exports = { titleCase, truncate };
