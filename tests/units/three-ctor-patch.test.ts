/**
 * @file three-ctor-patch.test.ts
 *
 * Check that three.js patch modifies all the constructors to be tracked.
 */
import { TRACKED_CTORS } from '../../src/util/three-ctor-tracker'
import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, it } from 'mocha'
import { equal, ok } from 'assert'

const patchPath = join(__dirname, '../../patches/three+0.181.2.patch')

// Helper to get patch file content
function getPatchFileContent() {
  return readFileSync(patchPath, 'utf8')
}

describe('three patch tracked constructors', function () {
  it('should have a one-to-one match between TRACKED_CTORS and class definitions in the patch', function () {
    const patch = getPatchFileContent()
    // Find all occurrences of class ... in the patch
    const classRegex = /class (\w+)/g
    const foundClasses = new Set()
    let match
    while ((match = classRegex.exec(patch))) {
      foundClasses.add(match[1])
    }
    // For each tracked ctor, expect to find its class in the patch
    for (const ctor in TRACKED_CTORS) {
      ok(foundClasses.has(ctor), `Expected "class ${ctor}" to appear in patch file at ${patchPath}`)
    }
    // Also, no extra classes should be present
    equal(foundClasses.size, Object.keys(TRACKED_CTORS).length)
  })
})
