# fast-hashring

fast-hashring is a lightweight JavaScript library offering efficient implementations of consistent hashing:

- A classic consistent hash ring with virtual nodes (balanced distribution, minimal remapping)
- Jump Consistent Hash ([Lamping & Veach](https://arxiv.org/abs/1406.2294)) mapping keys directly to bucket indexes with O(1) memory.  
  See: [Jump Consistent Hash - Demo](https://jhash.21no.de/)

Designed for high performance, it provides fast and scalable key distribution, ideal for load balancing, caching, and data sharding in distributed systems.

## Installation

Install via npm:

```bash
npm install fast-hashring
```

Or using yarn:

```bash
yarn add fast-hashring
```

## Usage

Here’s a basic example of how to integrate fast-hashring into your project:

```js
import ConsistentHash from "fast-hashring";

const ch = new ConsistentHash({ virtualNodes: 100 });
ch.addNode("server1");
ch.addNode("server2");

const node = ch.getNode("my-key");
console.log(`Key is assigned to node: ${node}`);
```

### Jump Consistent Hash (no ring, O(1) memory)

Jump Consistent Hash maps a string key to a stable index in [0, N). This is useful when you just need a bucket index (e.g., shard number) without maintaining a ring of nodes.

```js
// Note: runtime import path uses the file path; default export remains ConsistentHash
import JumpConsistentHash from "fast-hashring/jump-hash.js";

const jch = new JumpConsistentHash(16); // 16 buckets
const idx = jch.getIndex("user-123"); // deterministic value in 0..15
```

TypeScript note: types for both classes are exposed via the package types entry.

```ts
// Values
import ConsistentHash from "fast-hashring";
import JumpConsistentHash from "fast-hashring/jump-hash.js";

// Types (optional)
import type { ConsistentHash as ConsistentHashType, JumpConsistentHash as JumpConsistentHashType } from "fast-hashring";
```

## Features

- **Consistent Hashing with Virtual Nodes:**  
  Utilizes virtual nodes to distribute keys evenly across real nodes, minimizing load imbalance during node changes.

- **Binary Search for Rapid Lookups:**  
  Maintains a sorted hash ring of virtual nodes, enabling quick key lookups using an optimized binary search algorithm.

- **Jump Consistent Hash (Lamping & Veach):**  
  Minimal-memory O(1) approach that maps keys directly to bucket indexes in [0, N), great for sharding. Buckets must be numbered 0..N-1.

- **High Performance & Scalability:**  
  The design focuses on speed and efficiency, ensuring low latency and high throughput even with large-scale deployments.

- **Simple & Intuitive API:**  
  Easy-to-use methods for adding, removing, and retrieving nodes enable quick integration into projects.

- **TypeScript Support:**  
  Complete TypeScript definitions are provided, offering strong typing and an improved developer experience.

## Why Choose fast-hashring?

fast-hashring delivers superior performance by leveraging virtual nodes and binary search, providing a more balanced and efficient key distribution compared to traditional hashing methods. Whether you're scaling a distributed cache, load balancer, or sharded database, fast-hashring minimizes remapping and disruption, ensuring high availability and smooth performance.

## Testing

The library is tested using Bun's testing framework. To run the tests, execute:

```bash
bun test
```

## License

MIT
