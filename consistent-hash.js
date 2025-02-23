import crypto from 'crypto'

/**
 * ConsistentHash provides an implementation of consistent hashing using virtual nodes
 * for improved key distribution. It maintains a ring structure of hashed virtual node values,
 * mapping them to their corresponding real nodes.
 *
 * This module is designed to be published on NPM and used as a standalone library.
 *
 * Example usage:
 *   import ConsistentHash from 'consistent-hash'
 *   const ch = new ConsistentHash({ virtualNodes: 100 })
 *   ch.addNode('server1')
 *   const node = ch.getNode('my-key')
 *
 * @module consistent-hash
 */
class ConsistentHash {
  /**
   * Create a new ConsistentHash instance.
   *
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.virtualNodes=100] - Number of virtual nodes per real node.
   */
  constructor(options = {}) {
    this.virtualNodes = options.virtualNodes || 100;
    this.ring = []; // Sorted array of virtual node hashes.
    this.nodes = new Set(); // Set of real node identifiers.
    this.virtualToReal = new Map(); // Maps virtual node hash to real node.
  }

  /**
   * Generate an MD5 hash for a given key.
   *
   * @private
   * @param {string} key - The key to hash.
   * @returns {string} The hexadecimal hash.
   */
  _hash(key) {
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Add a new node to the hash ring.
   *
   * @param {string} node - The node identifier.
   * @throws {Error} If node is not a non-empty string or already exists.
   */
  addNode(node) {
    if (!node || typeof node !== 'string') {
      throw new Error('Node must be a non-empty string');
    }
    if (this.nodes.has(node)) {
      throw new Error('Node already exists');
    }
    this.nodes.add(node);

    // Create virtual nodes for the real node.
    for (let i = 0; i < this.virtualNodes; i++) {
      const virtualNode = `${node}-vn-${i}`;
      const hash = this._hash(virtualNode);
      this.ring.push(hash);
      this.virtualToReal.set(hash, node);
    }
    // Keep the ring sorted for efficient binary search.
    this.ring.sort();
  }

  /**
   * Remove a node and its associated virtual nodes from the hash ring.
   *
   * @param {string} node - The node identifier.
   * @throws {Error} If the node does not exist.
   */
  removeNode(node) {
    if (!this.nodes.has(node)) {
      throw new Error('Node does not exist');
    }
    this.nodes.delete(node);

    // Remove all virtual nodes associated with the given node.
    for (let i = 0; i < this.virtualNodes; i++) {
      const virtualNode = `${node}-vn-${i}`;
      const hash = this._hash(virtualNode);
      this.virtualToReal.delete(hash);
    }
    // Rebuild the ring with remaining virtual nodes.
    this.ring = this.ring.filter((hash) => this.virtualToReal.has(hash));
  }

  /**
   * Get the node responsible for a given key.
   * Returns null if no nodes are present.
   *
   * @param {string} key - The key to look up.
   * @returns {string|null} The node responsible for the key, or null if none exists.
   * @throws {Error} If the key is not a non-empty string.
   */
  getNode(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }
    if (this.ring.length === 0) {
      return null;
    }
    const hash = this._hash(key);

    // Binary search to find the first virtual node hash greater than or equal to the key hash.
    let low = 0, high = this.ring.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.ring[mid] < hash) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    const index = low % this.ring.length; // Wrap around if needed.
    return this.virtualToReal.get(this.ring[index]);
  }

  /**
   * Get the number of real nodes in the hash ring.
   *
   * @returns {number} The count of real nodes.
   */
  size() {
    return this.nodes.size;
  }
}

export default ConsistentHash
