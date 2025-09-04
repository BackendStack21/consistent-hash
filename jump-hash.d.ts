/**
 * JumpConsistentHash maps string keys to an integer index in [0, N)
 * using the Jump Consistent Hash algorithm by Lamping & Veach.
 */
declare class JumpConsistentHash {
  /**
   * Create a new JumpConsistentHash instance.
   *
   * @param indexes - Total number of indexes (buckets), must be a positive integer.
   */
  constructor(indexes: number);

  /**
   * Update number of indexes (buckets).
   *
   * @param indexes - Positive integer number of buckets.
   */
  setIndexes(indexes: number): void;

  /**
   * Get current number of indexes (buckets).
   */
  size(): number;

  /**
   * Compute stable index in [0, indexes) for the given key.
   *
   * @param key - Non-empty string key.
   * @returns Index between 0 (inclusive) and indexes (exclusive).
   */
  getIndex(key: string): number;
}

export default JumpConsistentHash;
