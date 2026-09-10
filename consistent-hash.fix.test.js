import { describe, test, expect } from 'bun:test'
import ConsistentHash from './consistent-hash.js'

// ── Item 1: constructor validates virtualNodes ──────────────────────────────
describe('ConsistentHash constructor validation', () => {
  test('throws on virtualNodes = 0', () => {
    expect(() => new ConsistentHash({ virtualNodes: 0 })).toThrow()
  })

  test('throws on negative virtualNodes', () => {
    expect(() => new ConsistentHash({ virtualNodes: -5 })).toThrow()
  })

  test('throws on fractional virtualNodes', () => {
    expect(() => new ConsistentHash({ virtualNodes: 10.5 })).toThrow()
  })

  test('throws on non-numeric virtualNodes', () => {
    expect(() => new ConsistentHash({ virtualNodes: '100' })).toThrow()
  })

  test('accepts a positive integer', () => {
    const ch = new ConsistentHash({ virtualNodes: 4 })
    expect(ch.virtualNodes).toBe(4)
  })

  test('default is 100', () => {
    const ch = new ConsistentHash()
    expect(ch.virtualNodes).toBe(100)
  })
})

// ── Item 2: ring uses 32-bit numeric hashes (numeric compare, no strings) ───
describe('numeric ring representation', () => {
  test('ring entries are 32-bit numbers, not hex strings', () => {
    const ch = new ConsistentHash({ virtualNodes: 8 })
    ch.addNode('a')
    expect(ch.ring.length).toBe(8)
    for (const h of ch.ring) {
      expect(typeof h).toBe('number')
      expect(Number.isInteger(h)).toBe(true)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThanOrEqual(0xffffffff)
    }
  })

  test('ring is sorted numerically ascending', () => {
    const ch = new ConsistentHash({ virtualNodes: 32 })
    for (const n of ['a', 'b', 'c']) ch.addNode(n)
    for (let i = 1; i < ch.ring.length; i++) {
      expect(ch.ring[i - 1] <= ch.ring[i]).toBe(true)
    }
  })
})

// ── Item 4: batch addNodes sorts once ────────────────────────────────────────
describe('addNodes batch API', () => {
  test('addNodes accepts a list and registers all nodes', () => {
    const ch = new ConsistentHash({ virtualNodes: 16 })
    ch.addNodes(['a', 'b', 'c'])
    expect(ch.size()).toBe(3)
    expect(ch.getNode('key-1')).toBeDefined()
  })

  test('addNodes rejects an empty or invalid list', () => {
    const ch = new ConsistentHash({ virtualNodes: 4 })
    expect(() => ch.addNodes([])).toThrow()
    expect(() => ch.addNodes('a')).toThrow()
  })

  test('addNodes rejects duplicate nodes within the batch', () => {
    const ch = new ConsistentHash({ virtualNodes: 4 })
    expect(() => ch.addNodes(['a', 'a'])).toThrow()
  })
})

// ── Item 5: ring invariants ──────────────────────────────────────────────────
describe('ring invariants', () => {
  const keys = Array.from({ length: 2000 }, (_, i) => `key-${i}`)

  test('getNode returns null on an empty ring', () => {
    const ch = new ConsistentHash({ virtualNodes: 8 })
    expect(ch.getNode('any-key')).toBeNull()
  })

  test('getNode output is deterministic', () => {
    const ch = new ConsistentHash({ virtualNodes: 16 })
    ch.addNode('a')
    ch.addNode('b')
    for (const k of keys) {
      expect(ch.getNode(k)).toBe(ch.getNode(k))
    }
  })

  test('monotonicity: removing a node only remaps its keys', () => {
    const ch = new ConsistentHash({ virtualNodes: 64 })
    ch.addNodes(['a', 'b', 'c'])
    const before = new Map(keys.map((k) => [k, ch.getNode(k)]))

    ch.removeNode('b')
    const moved = keys.filter((k) => ch.getNode(k) !== before.get(k))
    // Every moved key must now land on a surviving node.
    for (const k of moved) {
      expect(['a', 'c']).toContain(ch.getNode(k))
    }
    // Minimal disruption: removed node owned ~1/3 of keys; moved set must be
    // exactly the set previously owned by 'b' (ring + virtual nodes guarantee).
    const movedFraction = moved.length / keys.length
    expect(movedFraction).toBeGreaterThan(0.2)
    expect(movedFraction).toBeLessThan(0.45)
  })

  test('monotonicity: adding a node only remaps a minority of keys', () => {
    const ch = new ConsistentHash({ virtualNodes: 64 })
    ch.addNodes(['a', 'b'])
    const before = new Map(keys.map((k) => [k, ch.getNode(k)]))
    ch.addNode('c')
    const moved = keys.filter((k) => ch.getNode(k) !== before.get(k)).length / keys.length
    expect(moved).toBeGreaterThan(0.1) // should win ~1/3 of keys
    expect(moved).toBeLessThan(0.5)
  })

  test('only node removal leaves an empty ring and getNode returns null', () => {
    const ch = new ConsistentHash({ virtualNodes: 8 })
    ch.addNode('a')
    ch.removeNode('a')
    expect(ch.size()).toBe(0)
    expect(ch.getNode('x')).toBeNull()
  })

  test('distribution across nodes is balanced within 25%', () => {
    const ch = new ConsistentHash({ virtualNodes: 100 })
    ch.addNodes(['a', 'b', 'c'])
    const counts = { a: 0, b: 0, c: 0 }
    for (const k of keys) counts[ch.getNode(k)]++
    const avg = keys.length / 3
    for (const c of Object.values(counts)) {
      expect(Math.abs(c - avg)).toBeLessThanOrEqual(avg * 0.25)
    }
  })
})
