/**
 * ConsistentHash provides an implementation of consistent hashing using virtual nodes
 * for improved key distribution. It maintains a ring structure of hashed virtual node values,
 * mapping them to their corresponding real nodes.
 *
 * @module consistent-hash
 */
declare class ConsistentHash {
  /**
   * Create a new ConsistentHash instance.
   *
   * @param options - Configuration options.
   * @param options.virtualNodes - Number of virtual nodes per real node (default is 100).
   */
  constructor(options?: { virtualNodes?: number });

  /**
   * Add a new node to the hash ring.
   *
   * @param node - The node identifier.
   * @throws Will throw an error if the node is not a non-empty string or already exists.
   */
  addNode(node: string): void;

  /**
   * Remove a node and its associated virtual nodes from the hash ring.
   *
   * @param node - The node identifier.
   * @throws Will throw an error if the node does not exist.
   */
  removeNode(node: string): void;

  /**
   * Get the node responsible for a given key.
   * Returns null if no nodes are present.
   *
   * @param key - The key to look up.
   * @returns The node responsible for the key, or null if none exists.
   * @throws Will throw an error if the key is not a non-empty string.
   */
  getNode(key: string): string | null;

  /**
   * Get the number of real nodes in the hash ring.
   *
   * @returns The count of real nodes.
   */
  size(): number;
}

export default ConsistentHash;
