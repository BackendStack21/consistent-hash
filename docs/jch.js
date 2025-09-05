// Browser-friendly Jump Consistent Hash implementation.
// Uses Web Crypto API for hashing (SHA-1 -> 64-bit key) like repo's Node version.

async function sha1_64(key) {
  const enc = new TextEncoder();
  const data = enc.encode(key);
  const digest = await crypto.subtle.digest("SHA-1", data);
  const bytes = new Uint8Array(digest);
  // take first 8 bytes little-endian into BigInt
  let x = 0n;
  const len = Math.min(8, bytes.length);
  for (let i = 0; i < len; i++) {
    x |= BigInt(bytes[i]) << BigInt(8 * i);
  }
  return x;
}

function jumpHash64(keyBigInt, buckets) {
  const mul = 2862933555777941757n;
  let b = -1;
  let j = 0;
  while (j < buckets) {
    b = j;
    keyBigInt = (keyBigInt * mul + 1n) & ((1n << 64n) - 1n);
    const r = Number(keyBigInt >> 33n) + 1; // 31 bits max
    j = Math.floor((b + 1) * (2147483648 / r));
  }
  return b;
}

export class JumpConsistentHash {
  constructor(indexes = 1) {
    this.setIndexes(indexes);
  }
  setIndexes(indexes) {
    if (!Number.isInteger(indexes) || indexes <= 0) throw new Error("Indexes must be a positive integer");
    this.indexes = indexes;
  }
  size() {
    return this.indexes;
  }
  async getIndex(key) {
    if (!key || typeof key !== "string") throw new Error("Key must be a non-empty string");
    const k = await sha1_64(key);
    return jumpHash64(k, this.indexes);
  }
}
