/**
 * @file lut-encoder.ts
 *
 * Utility to encode and decode the collision cache structure to and from a binary blob file.
 */

import type { Lut } from './luts/lut'
import { allIndices, getFromTree, type Tree } from './luts/lut'

export type CachedCollision = null | [number, number, number, number] // x,y,dx,dy
export const speedDetail = 20 // half size of cache along relative vx and vy

export const offsetDetail = 10 // hald size of cache along dx and dy

export type DDCollisionTree = Array<Array<Array<Array<CachedCollision>>>>

export class LutEncoder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static encode(tree: Tree<any>, lut?: Lut<any>): Int16Array {
    const chunks: Array<number> = []

    if (lut?.symmetric) {
      // Only encode canonical half; mirror is reconstructed at decode time
      for (const index of allIndices(lut)) {
        if (!lut.isCanonical(index)) continue
        const leaf = getFromTree(tree, index)
        if (leaf === null) {
          chunks.push(0)
        }
        else {
          chunks.push(1)
          chunks.push(...lut.encodeLeaf(leaf))
        }
      }
    }
    else {
      encodeChunks(tree, chunks, lut)
    }

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
    let pos = 0
    const { detail, tree, reg } = lut
    const leafLen = reg.leafLength
    const depth = detail.length

    if (lut.symmetric) {
      const index = new Array<number>(depth).fill(0)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function buildSymmetric(arr: Tree<any>, level: number): void {
        const size = detail[level]
        arr.length = size
        if (level === depth - 1) {
          for (let i = 0; i < size; i++) {
            index[level] = i
            if (lut.isCanonical(index)) {
              const marker = blob[pos++]
              if (marker !== 0) {
                const leaf = new Array<number>(leafLen)
                for (let k = 0; k < leafLen; k++) leaf[k] = blob[pos++]
                arr[i] = lut.decodeLeaf(leaf)
              }
              else {
                arr[i] = null
              }
            }
            else {
              const mirrorIdx = lut.mirrorIndex(index)
              arr[i] = lut.mirrorLeaf(getFromTree(tree, mirrorIdx))
            }
          }
        }
        else {
          for (let i = 0; i < size; i++) {
            index[level] = i
            const child: Tree<any> = [] // eslint-disable-line @typescript-eslint/no-explicit-any
            arr[i] = child
            buildSymmetric(child, level + 1)
          }
        }
      }

      buildSymmetric(tree, 0)
    }
    else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function buildFlat(arr: Tree<any>, level: number): void {
        const size = detail[level]
        arr.length = size
        if (level === depth - 1) {
          for (let i = 0; i < size; i++) {
            const marker = blob[pos++]
            if (marker !== 0) {
              const leaf = new Array<number>(leafLen)
              for (let k = 0; k < leafLen; k++) leaf[k] = blob[pos++]
              arr[i] = lut.decodeLeaf(leaf)
            }
            else {
              arr[i] = null
            }
          }
        }
        else {
          for (let i = 0; i < size; i++) {
            const child: Tree<any> = [] // eslint-disable-line @typescript-eslint/no-explicit-any
            arr[i] = child
            buildFlat(child, level + 1)
          }
        }
      }

      buildFlat(tree, 0)
    }
  }

  /**
   * Decode blob directly into a flat Int16Array on the lut.
   * Much faster than building a nested tree — no per-cell allocations.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static decodeFlatInt16(blob: Int16Array, lut: Lut<any>) {
    const { data, detail, reg, strides } = lut
    const leafLen = reg.leafLength
    const depth = detail.length
    let pos = 0

    if (lut.symmetric) {
      const index = new Array<number>(depth).fill(0)
      const totalCells = detail.reduce((a, b) => a * b, 1)

      for (let cell = 0; cell < totalCells; cell++) {
        // compute current index from cell (row-major)
        let rem = cell
        for (let d = 0; d < depth; d++) {
          index[d] = Math.floor(rem / strides[d])
          rem %= strides[d]
        }

        if (lut.isCanonical(index)) {
          const marker = blob[pos++]
          if (marker !== 0) {
            const dataOff = cell * leafLen
            for (let k = 0; k < leafLen; k++) data[dataOff + k] = blob[pos++]
            lut.setHasLeaf(cell)
          }
        }
        else {
          // mirror from canonical
          const mirrorIdx = lut.mirrorIndex(index)
          let mirrorCell = 0
          for (let d = 0; d < depth; d++) mirrorCell += mirrorIdx[d] * strides[d]

          if (lut.hasLeafAt(mirrorCell)) {
            const srcOff = mirrorCell * leafLen
            const dstOff = cell * leafLen
            // For symmetric LUTs, mirrored leaf = negated values
            for (let k = 0; k < leafLen; k++) data[dstOff + k] = -data[srcOff + k]
            lut.setHasLeaf(cell)
          }
        }
      }
    }
    else {
      const totalCells = detail.reduce((a, b) => a * b, 1)
      for (let cell = 0; cell < totalCells; cell++) {
        const marker = blob[pos++]
        if (marker !== 0) {
          const dataOff = cell * leafLen
          for (let k = 0; k < leafLen; k++) data[dataOff + k] = blob[pos++]
          lut.setHasLeaf(cell)
        }
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function encodeChunks(tree: Tree<any>, chunks: Array<number>, lut?: Lut<any>) {
  for (const value of tree) {
    if (value === null) {
      chunks.push(0) // Null marker
    }
    else if (typeof value[0] === 'number') {
      chunks.push(1) // Non-null marker
      if (lut) {
        chunks.push(...lut.encodeLeaf(value))
      }
      else {
        chunks.push(...value.map(Math.round))
      }
    }
    else {
      encodeChunks(value, chunks, lut)
    }
  }
}
