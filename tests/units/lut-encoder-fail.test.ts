/**
 * @file lut-encoder-fail.test.ts
 *
 * Test that encoding and decoding a LUT tree preserves values, focusing on the bug seen in build-blobs.ts.
 */

import { strict as assert } from 'assert'
import { Lut, LutEncoder } from '../../src/simulation/luts/lut'
import { LUT } from '../../src/imp-names'

describe('LutEncoder encode/decode bug reproduction', function () {
  const fs = require('fs')
  const path = require('path')
  it('should preserve LUT data for disk-friction-lut (file roundtrip, runtime logic)', function () {
    // Use the same LUT name that fails in build-blobs.ts
    const lutName = 'disk-friction-lut'
    const lut = Lut.create(lutName)
    lut.computeAll()
    const originalData = lut.data.slice()
    const encoded = LutEncoder.encode(lut.tree, lut)
    // Write to file and read back, as in build-blobs.ts
    const tmpPath = path.join(__dirname, 'disk-friction-lut-test.bin')
    fs.writeFileSync(tmpPath, Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength))
    const fileBuf = fs.readFileSync(tmpPath)
    // Construct Int16Array from file buffer, ensuring correct alignment
    const arrayBuf = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength)
    const int16 = new Int16Array(arrayBuf)
    // decode into a fresh LUT instance using runtime logic
    const lut2 = Lut.create(lutName)
    lut2.loadFromBlob(int16)
    // Compare the original and loaded data buffers
    const dataEqual = originalData.length === lut2.data.length && originalData.every((v, i) => v === lut2.data[i])
    if (!dataEqual) {
      // Show a preview of the first mismatch
      let mismatchIdx = 0
      while (mismatchIdx < originalData.length && originalData[mismatchIdx] === lut2.data[mismatchIdx]) mismatchIdx++;
      const context = 5
      const origPreview = originalData.slice(Math.max(0, mismatchIdx - context), mismatchIdx + context)
      const loadedPreview = lut2.data.slice(Math.max(0, mismatchIdx - context), mismatchIdx + context)
      assert.fail(
        `Decoded LUT data does not match original for ${lutName}.\n` +
        `First mismatch at index ${mismatchIdx}:\n` +
        `Original: [${origPreview.join(', ')}]\n` +
        `Loaded:   [${loadedPreview.join(', ')}]`
      )
    }
    fs.unlinkSync(tmpPath)
  })
})

function findFirstMismatch(a: string, b: string): string {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  const context = 20
  return (
    `index ${i}:\n` +
    `Original: ...${a.slice(Math.max(0, i - context), i + context)}...\n` +
    `Decoded:  ...${b.slice(Math.max(0, i - context), i + context)}...`
  )
}
