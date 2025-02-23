import { test, describe, beforeEach, expect } from 'bun:test'
import ConsistentHash from './consistent-hash.js'

describe('ConsistentHash', () => {
  let ch

  beforeEach(() => {
    ch = new ConsistentHash()
  })

  describe('Constructor', () => {
    test('should create instance with default virtual nodes', () => {
      expect(ch).toBeInstanceOf(ConsistentHash)
      expect(ch.virtualNodes).toBe(100)
    })

    test('should accept a custom number of virtual nodes', () => {
      const customHr = new ConsistentHash({ virtualNodes: 200 })
      expect(customHr.virtualNodes).toBe(200)
    })
  })

  describe('addNode()', () => {
    test('should add nodes successfully', () => {
      ch.addNode('server1')
      ch.addNode('server2')
      expect(ch.size()).toBe(2)
    })

    test('should throw error when adding empty node', () => {
      expect(() => ch.addNode('')).toThrow('Node must be a non-empty string')
    })

    test('should throw error when adding duplicate node', () => {
      ch.addNode('server1')
      expect(() => ch.addNode('server1')).toThrow('Node already exists')
    })

    test('should allow re-adding a node after it has been removed', () => {
      ch.addNode('server1')
      ch.removeNode('server1')
      expect(ch.size()).toBe(0)
      // Re-add removed node should succeed.
      ch.addNode('server1')
      expect(ch.size()).toBe(1)
      expect(ch.getNode('someKey')).toBe('server1')
    })
  })

  describe('removeNode()', () => {
    beforeEach(() => {
      ch.addNode('server1')
      ch.addNode('server2')
    })

    test('should remove nodes successfully', () => {
      ch.removeNode('server1')
      expect(ch.size()).toBe(1)
    })

    test('should throw error when removing non-existent node', () => {
      expect(() => ch.removeNode('server3')).toThrow('Node does not exist')
    })

    test('should remap keys after node removal', () => {
      const key = '2348'
      const originalServer = ch.getNode(key)
      ch.removeNode(originalServer)
      const newServer = ch.getNode(key)
      expect(newServer).not.toBe(originalServer)
    })
  })

  describe('getNode()', () => {
    beforeEach(() => {
      ch.addNode('server1')
      ch.addNode('server2')
    })

    test('should return consistent results for the same key', () => {
      const key = '12345'
      const server1 = ch.getNode(key)
      const server2 = ch.getNode(key)
      expect(server1).toBe(server2)
    })

    test('should throw error for empty key', () => {
      expect(() => ch.getNode('')).toThrow('Key must be a non-empty string')
    })

    test('should return null when no nodes exist', () => {
      ch.removeNode('server1')
      ch.removeNode('server2')
      expect(ch.getNode('12345')).toBe(null)
    })

    test('should distribute keys relatively evenly', () => {
      const testKeys = Array.from({ length: 1000 }, (_, i) => `key${i}`)
      const distribution = {}
      testKeys.forEach((key) => {
        const server = ch.getNode(key)
        distribution[server] = (distribution[server] || 0) + 1
      })

      const values = Object.values(distribution)
      const total = values.reduce((a, b) => a + b, 0)
      const avg = total / values.length
      const threshold = avg * 0.2 // 20% tolerance

      for (let count of values) {
        expect(Math.abs(count - avg)).toBeLessThan(threshold)
      }
    })
  })

  describe('size()', () => {
    test('should return the correct number of nodes', () => {
      expect(ch.size()).toBe(0)
      ch.addNode('server1')
      expect(ch.size()).toBe(1)
      ch.addNode('server2')
      expect(ch.size()).toBe(2)
      ch.removeNode('server1')
      expect(ch.size()).toBe(1)
    })
  })
})
