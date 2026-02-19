/**
 * @file gear-lut.ts
 *
 * Lookup position of teeth on a spinning gear.
 */

import { twopi } from 'util/math-util'
import { Lut, i32 } from '../lut'
import type { LeafSchema, LeafValues } from '../lut'
import { LUT_BLOBS } from 'set-by-build'
import { N_GEAR_FRAMES, GEAR_ORBIT_RADIUS } from 'simulation/rotating/gear-constants'

const angleDelta = twopi / N_GEAR_FRAMES

export class GearLut extends Lut {
  static {
    Lut.register('gear-lut', {
      factory: () => new GearLut(),
      depth: 1,
      schema: [i32('x'), i32('y')],
    })
  }

  schema: LeafSchema = [i32('x'), i32('y')]
  detail = [N_GEAR_FRAMES]
  blobHash = LUT_BLOBS.GEAR_LUT.hash
  blobUrl = LUT_BLOBS.GEAR_LUT.url

  computeLeaf(index: Array<number>): LeafValues {
    const [frameIndex] = index
    const angle = frameIndex * angleDelta
    const x = GEAR_ORBIT_RADIUS * Math.cos(angle)
    const y = GEAR_ORBIT_RADIUS * Math.sin(angle)

    return {
      x: Math.round(x),
      y: Math.round(y),
    }
  }
}
