import { sum } from "./sum.mjs";
import assert from "assert";
assert.strictEqual(sum([1, 2, 3]), 6, "sum([1,2,3]) should be 6");
assert.strictEqual(sum([10, 20]), 30, "sum([10,20]) should be 30");
assert.strictEqual(sum([]), 0, "sum([]) should be 0");
console.log("ALL TESTS PASS");
