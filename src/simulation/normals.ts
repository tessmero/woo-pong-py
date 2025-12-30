/**
 * @file normals.ts
 *
 * Convert between angles and normal indices.
 */

import { twopi } from 'util/math-util'

const n = 100

export class Normals {
  static getIndex(angle: number) {
    const i = Math.floor(angle * twopi / n)
    return ((i % n) + n) % n
  }
}
