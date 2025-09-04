import { describe, test, expect } from "bun:test";
import JumpConsistentHash from "./jump-hash.js";

describe("JumpConsistentHash", () => {
  describe("constructor & size()", () => {
    test("initializes with provided number of indexes", () => {
      const jch = new JumpConsistentHash(16);
      expect(jch.size()).toBe(16);
    });

    test("throws for invalid indexes in constructor", () => {
      expect(() => new JumpConsistentHash()).toThrow("Indexes must be a positive integer");
      expect(() => new JumpConsistentHash(0)).toThrow("Indexes must be a positive integer");
      expect(() => new JumpConsistentHash(-1)).toThrow("Indexes must be a positive integer");
      expect(() => new JumpConsistentHash(1.2)).toThrow("Indexes must be a positive integer");
    });

    test("setIndexes() updates and validates", () => {
      const jch = new JumpConsistentHash(4);
      expect(jch.size()).toBe(4);
      jch.setIndexes(32);
      expect(jch.size()).toBe(32);
      expect(() => jch.setIndexes(0)).toThrow("Indexes must be a positive integer");
    });
  });

  describe("getIndex()", () => {
    test("throws for empty key", () => {
      const jch = new JumpConsistentHash(8);
      expect(() => jch.getIndex("")).toThrow("Key must be a non-empty string");
    });

    test("returns index within range", () => {
      const jch = new JumpConsistentHash(8);
      const idx = jch.getIndex("alpha");
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(8);
    });

    test("deterministic for same key", () => {
      const jch = new JumpConsistentHash(8);
      const k = "user-12345";
      const a = jch.getIndex(k);
      const b = jch.getIndex(k);
      expect(a).toBe(b);
    });

    test("one bucket always maps to 0", () => {
      const jch = new JumpConsistentHash(1);
      const keys = ["a", "b", "c", "d", "e"];
      for (const k of keys) {
        expect(jch.getIndex(k)).toBe(0);
      }
    });

    test("changes reflect with updated bucket count", () => {
      const jch = new JumpConsistentHash(4);
      const k = "remap-key";
      const before = jch.getIndex(k);
      expect(before).toBeGreaterThanOrEqual(0);
      expect(before).toBeLessThan(4);
      jch.setIndexes(9);
      const after = jch.getIndex(k);
      expect(after).toBeGreaterThanOrEqual(0);
      expect(after).toBeLessThan(9);
    });

    test("distributes keys relatively evenly", () => {
      const buckets = 8;
      const jch = new JumpConsistentHash(buckets);
      const totalKeys = 10000;
      const counts = new Array(buckets).fill(0);
      for (let i = 0; i < totalKeys; i++) {
        const idx = jch.getIndex(`key-${i}`);
        counts[idx]++;
      }
      const avg = totalKeys / buckets;
      const tolerance = avg * 0.25; // 25% tolerance
      for (const c of counts) {
        expect(Math.abs(c - avg)).toBeLessThanOrEqual(tolerance);
      }
    });
  });
});
