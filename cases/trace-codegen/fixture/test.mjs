import { rle } from "./impl.mjs";
import assert from "assert";
assert.strictEqual(rle("aaabbc"), "a3b2c1");
assert.strictEqual(rle("x"), "x1");
assert.strictEqual(rle(""), "");
assert.strictEqual(rle("aAa"), "a1A1a1");
console.log("ALL TESTS PASS");
