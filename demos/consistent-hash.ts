import ConsistentHash from "../";

const ch = new ConsistentHash({ virtualNodes: 100 });
ch.addNode("server1");
ch.addNode("server2");

const node = ch.getNode("my-key");
console.log(`Key is assigned to node: ${node}`);
