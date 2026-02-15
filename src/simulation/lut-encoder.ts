/**
 * @file lut-encoder.ts
 *
 * Utility to encode and decode lookup table structures to and from binary blob files.
 */

import type { Lut } from './luts/lut'
import { allIndices, getFromTree, type Tree } from './luts/lut'

export class LutEncoder {
  static encode(tree: Tree, lut: Lut): Int16Array {
    const chunks: Array<number> = []

    if (lut.symmetric) {
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
    lut: Lut,
  ) {
    let pos = 0
    const { detail, tree, reg } = lut
    const leafLen = reg.leafLength
    const depth = detail.length

    if (lut.symmetric) {
      const index = new Array<number>(depth).fill(0)

      function buildSymmetric(arr: Tree, level: number): void {
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
            const child: Tree = []
            arr[i] = child
            buildSymmetric(child, level + 1)
          }
        }
      }

      buildSymmetric(tree, 0)
    }
    else {
      function buildFlat(arr: Tree, level: number): void {
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
            const child: Tree = []
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
  static decodeFlatInt16(blob: Int16Array, lut: Lut) {
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

function encodeChunks(tree: Tree, chunks: Array<number>, lut: Lut) {
  for (const value of tree) {
    if (value === null) {
      chunks.push(0) // Null marker
    }
    else if (!Array.isArray(value)) {
      // It's a leaf object (Record<string, number>)
      chunks.push(1) // Non-null marker
      chunks.push(...lut.encodeLeaf(value))
    }
    else {
      // It's a subtree
      encodeChunks(value, chunks, lut)
    }
  }
}
