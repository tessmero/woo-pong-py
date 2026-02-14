/**
 * @file lut-32.ts
 *
 * Abstract base class for lookup tables that need 32-bit integer precision.
 * Each leaf value is encoded as a pair of int16s (high word, low word) in the blob,
 * doubling the encoded leaf length compared to the logical leaf length.
 */

import { Lut } from './lut'
import { INT32_MAX, INT32_MIN } from 'simulation/constants'

export abstract class Lut32<TLeaf> extends Lut<TLeaf> {
  /**
   * Read a 32-bit value from cell at logical component k.
   * Each logical value is stored as 2 int16s (high word, low word).
   */
  getInt32(cellIndex: number, k: number): number {
    const base = cellIndex * this.reg.leafLength + k * 2
    return (this.data[base] << 16) | (this.data[base + 1] & 0xFFFF)
  }

  override encodeLeaf(leaf: TLeaf): Array<number> {
    const result: Array<number> = []
    for (const val of leaf as Array<number>) {
      const v = Math.round(val)
      result.push(v >> 16, v & 0xFFFF)
    }
    return result
  }

  override decodeLeaf(values: Array<number>): TLeaf {
    const result: Array<number> = []
    for (let i = 0; i < values.length; i += 2) {
      result.push((values[i] << 16) | (values[i + 1] & 0xFFFF))
    }
    return result as unknown as TLeaf
  }

  protected override assertValidLeaf(leaf: TLeaf) {
    for (const value of leaf as Array<number>) {
      if (!Number.isInteger(value)) {
        throw new Error(`value is non-integer: ${value}`)
      }
      if (value < INT32_MIN || value > INT32_MAX) {
        throw new Error(`${value} is outside of int32 range.`)
      }
    }
  }
}
