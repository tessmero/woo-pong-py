/**
 * @file lut-encoder.testSKIP.ts
 *
 * Test encoding and decoding computed collisions.
 */

import { LutEncoder } from '../../src/simulation/lut-encoder'
import { ok, strictEqual } from 'assert'
import { lookupIndex, lutSpecs } from '../test-util'
import { readFileSync, writeFileSync } from 'fs'
import { Buffer } from 'buffer' // Ensure Buffer is imported explicitly
import { Lut, Tree } from '../../src/simulation/luts/lut'
import { DiskDiskLut } from '../../src/simulation/luts/imp/disk-disk-lut'
import { join } from 'path'
import { tmpdir } from 'os'
import { GearRoom } from '../../src/rooms/imp/gear-room'

// excuse to import disk-disk-lut and have it registered
const _thing = [DiskDiskLut, GearRoom]

describe('LUT encoder/decoder', function () {
  it('correctly encodes and decodes trees in memory', function () {
    for (const { lutName, shapeName, indexer } of lutSpecs) {
      const lut = Lut.create(lutName, shapeName)
      lut.computeAll()
      const encodedBlob = LutEncoder.encode(lut.tree, lut)
      lut.tree.length = 0
      LutEncoder.decode(encodedBlob, lut)
      const decodedCache = lut.tree
      assertCachesMatch(lut.tree, decodedCache, indexer)
    }
  })
  it('correctly encodes and decodes blob in file system', function () {
    for (const { lutName, shapeName, indexer } of lutSpecs) {
      const lut = Lut.create(lutName, shapeName)
      lut.computeAll()
      const encodedBlob = LutEncoder.encode(lut.tree, lut)

      // Write the encoded blob to a temporary file in raw binary format
      const filePath = join(tmpdir(), 'encoded-collision-cache.bin')
      const buffer = Buffer.from(encodedBlob.buffer, encodedBlob.byteOffset, encodedBlob.byteLength)
      writeFileSync(filePath, buffer)
      const readBuffer = readFileSync(filePath)
      const readEncodedBlob = new Int16Array(
        readBuffer.buffer, readBuffer.byteOffset,
        readBuffer.byteLength / Int16Array.BYTES_PER_ELEMENT,
      )
      lut.tree.length = 0
      LutEncoder.decode(readEncodedBlob, lut)
      const decodedCache = lut.tree

      assertCachesMatch(lut.tree, decodedCache, indexer)
    }
  })
})

function assertCachesMatch(
  originalCache: Tree,
  decodedCache: Tree,
  indexer: () => Array<number>,
) {
  // Compare random indices before and after
  const randomIndices = Array.from({ length: 100 }).map(indexer)

  for (const index of randomIndices) {
    const original = lookupIndex(originalCache, index)

    if (original !== null) {
      ok(typeof original[0] === 'number' && original[0] === Math.floor(original[0]),
        'bounce values should be integers')
    }

    const decoded = lookupIndex(decodedCache, index)

    strictEqual(
      JSON.stringify(decoded), JSON.stringify(original),
      `Mismatch at index ${JSON.stringify(index)}`,
    )
  }
}
