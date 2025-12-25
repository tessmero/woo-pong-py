/**
 * @file collision-encoder.test.ts
 *
 * Test encoding and decoding computed collisions.
 */

import { CollisionEncoder } from '../../src/simulation/collision-encoder'
import { strictEqual } from 'assert'
import { Collisions, offsetDetail, speedDetail } from '../../src/simulation/collisions'

const nOffsets = 2 * offsetDetail + 1
const nSpeeds = 2 * speedDetail + 1
function randomIndex() {
  return [
    Math.floor(nOffsets * Math.random()),
    Math.floor(nOffsets * Math.random()),
    Math.floor(nSpeeds * Math.random()),
    Math.floor(nSpeeds * Math.random()),
  ]
}

describe('collision data encoder/decoder', function () {
  it('encodes and decodes collision cache correctly', function () {
    // Encode the cache
    const encodedBlob = CollisionEncoder.encode(Collisions.cache)

    // Decode the blob back into a cache
    const decodedCache = CollisionEncoder.decode(encodedBlob)

    // Compare random indices before and after
    const randomIndices = Array.from({ length: 100 }).map(() => randomIndex())

    for (const [dxi, dyi, vxi, vyi] of randomIndices) {
      const original = Collisions.cache[dxi][dyi][vxi][vyi]
      const decoded = decodedCache[dxi][dyi][vxi][vyi]

      strictEqual(JSON.stringify(decoded), JSON.stringify(original), `Mismatch at indices (${dxi}, ${dyi}, ${vxi}, ${vyi})`)
    }
  })
})
