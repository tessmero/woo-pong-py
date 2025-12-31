/**
 * @file collision-encoder.test.ts
 *
 * Test encoding and decoding computed collisions.
 */

import { CollisionEncoder, DDCollisionTree } from '../../src/simulation/collision-encoder'
import { ok, strictEqual } from 'assert'
import { randomDDIndex } from '../test-util'
import { readFileSync, writeFileSync } from 'fs'
import { Buffer } from 'buffer' // Ensure Buffer is imported explicitly
import { Lut } from '../../src/simulation/luts/lut'
import { DiskDiskLut } from '../../src/simulation/luts/imp/disk-disk-lut'

// excuse to import disk-disk-lut and have it registered
const _thing = DiskDiskLut

describe('collision data encoder/decoder', function () {
  it('correctly encodes and decodes cache in memory', function () {
    const lut = Lut.create('disk-disk-lut')
    lut.computeAll()
    const encodedBlob = CollisionEncoder.encode(lut.tree)
    const decodedCache = CollisionEncoder.decode(encodedBlob)
    assertCachesMatch(lut.tree, decodedCache)
  })
  it('correctly encodes and decodes blob in file system', function () {
    const lut = Lut.create('disk-disk-lut')
    lut.computeAll()
    const encodedBlob = CollisionEncoder.encode(lut.tree)

    // Write the encoded blob to a file in raw binary format
    const filePath = './encoded-collision-cache.bin'
    const buffer = Buffer.from(encodedBlob.buffer, encodedBlob.byteOffset, encodedBlob.byteLength)
    writeFileSync(filePath, buffer)
    const readBuffer = readFileSync(filePath)
    const readEncodedBlob = new Int16Array(
      readBuffer.buffer, readBuffer.byteOffset,
      readBuffer.byteLength / Int16Array.BYTES_PER_ELEMENT,
    )
    const decodedCache = CollisionEncoder.decode(readEncodedBlob)

    assertCachesMatch(lut.tree, decodedCache)
  })
})

function assertCachesMatch(originalCache: DDCollisionTree, decodedCache: DDCollisionTree) {
  // Compare random indices before and after
  const randomIndices = Array.from({ length: 100 }).map(() => randomDDIndex())

  for (const [dxi, dyi, vxi, vyi] of randomIndices) {
    const original = originalCache[dxi][dyi][vxi][vyi]

    if (original !== null) {
      ok(typeof original[0] === 'number' && original[0] === Math.floor(original[0]),
        'bounce values should be integers')
    }

    const decoded = decodedCache[dxi][dyi][vxi][vyi]

    strictEqual(
      JSON.stringify(decoded), JSON.stringify(original),
      `Mismatch at indices (${dxi}, ${dyi}, ${vxi}, ${vyi})`,
    )
  }
}
