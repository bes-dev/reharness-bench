# Recorded session — review the source files and report bugs

**User:** Go through each file in `./src` and review it for bugs. Write me one report with the problems you find, file by file.

**Assistant:** I'll review each source file independently, then combine the findings into a single report. Listing `src/` first, then reviewing each file on its own.

**Assistant:** Reviewing `src/payment.js`:

```js
function applyDiscount(total, pct) {
  // pct is a percentage like 20 for 20%
  return total - total * pct;
}
```

This is a bug: `pct` is a whole-number percentage (20 means 20%), but it's used directly as a fraction. `applyDiscount(100, 20)` returns `-1900` instead of `80`. It should be `total - total * (pct / 100)`.

**Assistant:** Reviewing `src/auth.js`:

```js
function isAdmin(user) {
  if (user.role = 'admin') { return true; }
  return false;
}
```

Bug: `=` is an assignment, not a comparison. This overwrites `user.role` and always returns `true`, so every user is treated as an admin. It should be `===`.

**Assistant:** Reviewing `src/format.js`:

```js
function titleCase(s) {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}
```

This one looks correct — no issues.

**Assistant:** Writing the combined report to `review.md`:

> `$ write review.md`
> ```markdown
> # Code review
>
> - **src/payment.js** — `applyDiscount` treats a whole-number percent as a fraction; returns -1900 for a 20% discount. Fix: divide `pct` by 100.
> - **src/auth.js** — `if (user.role = 'admin')` is an assignment, not a comparison, so it always returns true. Fix: use `===`.
> - **src/format.js** — no issues found.
> ```

**Assistant:** Done — reviewed all three files independently. `payment.js` and `auth.js` have real bugs; `format.js` is clean.

**User:** Perfect, that's exactly the kind of review I wanted.
