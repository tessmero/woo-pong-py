/**
 * @file lut-encoder.ts
 *
 * Utility to encode and decode the collision cache structure to and from a binary blob file.
 */

import type { Lut } from './luts/lut'
import { allIndices, assignIndex, type Tree } from './luts/lut'

export type CachedCollision = null | [number, number, number, number] // x,y,dx,dy
export const speedDetail = 20 // half size of cache along relative vx and vy

export const offsetDetail = 10 // hald size of cache along dx and dy

export type DDCollisionTree = Array<Array<Array<Array<CachedCollision>>>>

export class LutEncoder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static encode(tree: Tree<any>): Int16Array {
    // if (tree.length === 1) {
    //   console.log('ENCODING length-1 tree', JSON.stringify(tree))
    // }

    const chunks: Array<number> = []

    encodeChunks(tree, chunks)

    // Ensure the chunks array length is even
    if (chunks.length % 2 !== 0) {
      chunks.push(0) // Add padding to align with Int16Array requirements
    }

    return new Int16Array(chunks)
  }

  static decode(
    blob: Int16Array,
    lut: Lut<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    let indexInBlob = 0

    for (const index of allIndices(lut)) {
      const marker = blob[indexInBlob++]

      let value: Array<number> | null = null
      if (marker === 0) {
        // vxArr.push(null)
      }
      else {
        value = Array.from({ length: lut.reg.leafLength }, () => blob[indexInBlob++])
        // const cx = blob[indexInBlob++]
        // const cy = blob[indexInBlob++]
        // const cdx = blob[indexInBlob++]
        // const cdy = blob[indexInBlob++]
        // value = [cx, cy, cdx, cdy]
      }
      assignIndex(lut.tree, index, value)
    }

    // if (lut.tree.length === 1) {
    //   console.log('DECODED length-1 tree', JSON.stringify(lut.tree))
    // }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function encodeChunks(tree: Tree<any>, chunks: Array<number>) {
  for (const value of tree) {
    if (value === null) {
      chunks.push(0) // Null marker
    }
    else if (typeof value[0] === 'number') {
      chunks.push(1) // Non-null marker
      chunks.push(...value.map(Math.round))
    }
    else {
      encodeChunks(value, chunks)
    }
  }
}
