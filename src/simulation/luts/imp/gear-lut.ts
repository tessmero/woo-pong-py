/**
 * @file gear-lut.ts
 *
 * Lookup position of teeth on a spinning gear.
 */

import type { Vec2 } from 'util/math-util'
import { twopi } from 'util/math-util'
import { Lut32 } from '../lut-32'
import { Lut } from '../lut'
import { LUT_BLOBS } from 'set-by-build'
import { INT32_MAX, INT32_MIN } from 'simulation/constants'
import { N_GEAR_FRAMES, GEAR_ORBIT_RADIUS } from 'simulation/gear-constants'

type TLeaf = [number, number] // x,y

const angleDelta = twopi / N_GEAR_FRAMES

export class GearLut extends Lut32<TLeaf> {
  static {
    Lut.register('gear-lut', {
      factory: () => new GearLut(),
      depth: 1,
      leafLength: 4, // 2 logical values × 2 int16s each
    })
  }

  detail = [N_GEAR_FRAMES]
  blobHash = LUT_BLOBS.GEAR_LUT.hash
  blobUrl = LUT_BLOBS.GEAR_LUT.url

  computeLeaf(index: Array<number>): TLeaf {
    const [frameIndex] = index
    const angle = frameIndex * angleDelta
    const x = GEAR_ORBIT_RADIUS * Math.cos(angle)
    const y = GEAR_ORBIT_RADIUS * Math.sin(angle)
    const offset: Vec2 = [Math.round(x), Math.round(y)]

    // force into int32
    for (let ax = 0; ax < 2; ax++) {
      offset[ax] = Math.min(INT32_MAX, Math.max(INT32_MIN, offset[ax]))
    }

    return offset
  }
}
