import { describe, test, expect } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))

// Item 3: package must expose an exports map covering the documented subpath
// import `fast-hashring/jump-hash.js` (README), with types.
describe('package exports map', () => {
  test('defines "." export with default, import and types', () => {
    expect(pkg.exports).toBeDefined()
    expect(pkg.exports['.']).toBeDefined()
    expect(pkg.exports['.'].import).toBe('./consistent-hash.js')
    expect(pkg.exports['.'].types).toBeDefined()
  })

  test('defines "./jump-hash.js" subpath export (documented in README)', () => {
    expect(pkg.exports['./jump-hash.js']).toBeDefined()
    expect(pkg.exports['./jump-hash.js'].import).toBe('./jump-hash.js')
    expect(pkg.exports['./jump-hash.js'].types).toBeDefined()
  })

  test('uses node: protocol for builtin imports in sources', () => {
    for (const f of ['consistent-hash.js', 'jump-hash.js']) {
      const src = fs.readFileSync(path.join(__dirname, f), 'utf8')
      expect(src).not.toMatch(/from ['"]crypto['"]/)
      expect(src).toMatch(/from ['"]node:crypto['"]/)
    }
  })
})
