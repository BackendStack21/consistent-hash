import crypto from "crypto";

/**
 * JumpConsistentHash maps string keys to an integer index in [0, N)
 * using the Jump Consistent Hash algorithm by Lamping & Veach.
 *
 * Usage:
 *   const jch = new JumpConsistentHash(16)
 *   const idx = jch.getIndex('some-key') // 0..15
 */
class JumpConsistentHash {
  /**
   * @param {number} indexes - Total number of indexes (buckets), must be >= 1 integer
   */
  constructor(indexes) {
    this.setIndexes(indexes);
  }

  /**
   * Update number of indexes (buckets).
   * @param {number} indexes
   */
  setIndexes(indexes) {
    if (!Number.isInteger(indexes) || indexes <= 0) {
      throw new Error("Indexes must be a positive integer");
    }
    this.indexes = indexes;
  }

  /**
   * @returns {number} Current number of indexes (buckets)
   */
  size() {
    return this.indexes;
  }

  /**
   * Compute stable index in [0, indexes) for the given key.
   * @param {string} key
   * @returns {number}
   */
  getIndex(key) {
    if (!key || typeof key !== "string") {
      throw new Error("Key must be a non-empty string");
    }
    const k = this.#hash64(key);
    return this.#jumpHash(k, this.indexes);
  }

  /**
   * Hash string to unsigned 64-bit BigInt using SHA-1 (first 8 bytes).
   * Endianness choice is arbitrary but consistent (little-endian).
   * @param {string} key
   * @returns {bigint}
   */
  #hash64(key) {
    const digest = crypto.createHash("sha1").update(key).digest();
    let x = 0n;
    const len = Math.min(8, digest.length);
    for (let i = 0; i < len; i++) {
      x |= BigInt(digest[i]) << BigInt(8 * i);
    }
    return x;
  }

  /**
   * Jump Consistent Hash (Lamping & Veach) implemented with 64-bit arithmetic.
   * @param {bigint} key - 64-bit unsigned key
   * @param {number} buckets - number of buckets (indexes)
   * @returns {number}
   */
  #jumpHash(key, buckets) {
    // Constants per paper
    const mul = 2862933555777941757n;
    let b = -1;
    let j = 0;
    while (j < buckets) {
      b = j;
      key = (key * mul + 1n) & ((1n << 64n) - 1n); // mod 2^64
      // (key >> 33) fits in 31 bits => safe to convert to Number
      const r = Number(key >> 33n) + 1;
      j = Math.floor((b + 1) * (2147483648 / r));
    }
    return b;
  }
}

export default JumpConsistentHash;
