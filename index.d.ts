export { default as ConsistentHash } from "./consistent-hash.js";
export { default as JumpConsistentHash } from "./jump-hash.js";

// Expose the default export to match runtime default export (ConsistentHash)
import ConsistentHashDefault from "./consistent-hash.js";
export default ConsistentHashDefault;
