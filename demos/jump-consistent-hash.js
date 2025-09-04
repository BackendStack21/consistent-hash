const JumpConsistentHash = require("../jump-hash.js").default;

const jch = new JumpConsistentHash(16);
const idx = jch.getIndex("user-123");

console.log(`Index for 'user-123': ${idx}`);
