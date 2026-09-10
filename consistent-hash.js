import crypto from 'node:crypto'

/**
 * ConsistentHash provides an implementation of consistent hashing using virtual nodes
 * for improved key distribution. It maintains a ring structure of 32-bit hashed virtual
 * node values, mapping them to their corresponding real nodes.
 *
 * This module is designed to be published on NPM and used as a standalone library.
 *
 * Example usage:
 *   import ConsistentHash from 'fast-hashring'
 *   const ch = new ConsistentHash({ virtualNodes: 100 })
 *   ch.addNode('server1')
 *   const node = ch.getNode('my-key')
 *
 * @module consistent-hash
 */
const UINT32_MAX = 0xffffffff

class ConsistentHash {
  /**
   * Create a new ConsistentHash instance.
   *
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.virtualNodes=100] - Number of virtual nodes per real node (positive integer).
   */
  constructor(options = {}) {
    const virtualNodes = options.virtualNodes ?? 100;
    if (!Number.isInteger(virtualNodes) || virtualNodes < 1) {
      throw new Error('virtualNodes must be a positive integer');
    }
    this.virtualNodes = virtualNodes;
    this.ring = []; // Sorted array of 32-bit virtual node hashes.
    this.nodes = new Set(); // Set of real node identifiers.
    this.virtualToReal = new Map(); // Maps 32-bit virtual node hash to real node.
  }

  /**
   * Generate a 32-bit hash for a given key (first 4 bytes of MD5).
   *
   * @private
   * @param {string} key - The key to hash.
   * @returns {number} The unsigned 32-bit hash.
   */
  _hash(key) {
    return crypto.createHash('md5').update(key).digest().readUInt32BE(0);
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
      const hash = this._hash(`${node}-vn-${i}`);
      this.ring.push(hash);
      this.virtualToReal.set(hash, node);
    }
    // Keep the ring sorted for efficient binary search (numeric comparator).
    this.ring.sort((a, b) => a - b);
  }

  /**
   * Add multiple nodes to the hash ring, sorting the ring only once.
   *
   * @param {string[]} nodes - The node identifiers.
   * @throws {Error} If nodes is not a non-empty array, or any node is invalid/duplicated.
   */
  addNodes(nodes) {
    if (!Array.isArray(nodes) || nodes.length === 0) {
      throw new Error('Nodes must be a non-empty array');
    }
    for (const node of nodes) {
      if (!node || typeof node !== 'string') {
        throw new Error('Node must be a non-empty string');
      }
      if (this.nodes.has(node) || nodes.indexOf(node) !== nodes.lastIndexOf(node)) {
        throw new Error('Node already exists');
      }
      this.nodes.add(node);
    }
    for (const node of nodes) {
      for (let i = 0; i < this.virtualNodes; i++) {
        const hash = this._hash(`${node}-vn-${i}`);
        this.ring.push(hash);
        this.virtualToReal.set(hash, node);
      }
    }
    this.ring.sort((a, b) => a - b);
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
    const removed = new Set();
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this._hash(`${node}-vn-${i}`);
      this.virtualToReal.delete(hash);
      removed.add(hash);
    }
    // Rebuild the ring without the removed virtual nodes.
    this.ring = this.ring.filter((hash) => !removed.has(hash));
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
    const ring = this.ring;

    // Binary search to find the first virtual node hash greater than or equal to the key hash.
    let low = 0, high = ring.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (ring[mid] < hash) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    const index = low % ring.length; // Wrap around if needed.
    return this.virtualToReal.get(ring[index]);
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
