/**
 * @file gear-lut.ts
 *
 * Lookup position of teeth on a spinning gear.
 */

import { twopi, Vec2 } from 'util/math-util'
import { Lut } from '../lut'
import { LUT_BLOBS } from 'set-by-build'
import { DISK_RADIUS } from 'simulation/constants'

type TLeaf = [number, number] // x,y

export const N_GEAR_TEETH = 6
export const N_GEAR_FRAMES = 6000

if (!Number.isInteger(N_GEAR_FRAMES / N_GEAR_TEETH)) {
  throw new Error('gear frames must be a multiple of gear teeth')
}

const angleDelta = twopi / N_GEAR_FRAMES

export class GearLut extends Lut<TLeaf> {
  static {
    Lut.register('gear-lut', {
      factory: () => new GearLut(),
      depth: 1,
      leafLength: 2,
    })
  }

  detail = [N_GEAR_FRAMES]
  blobHash = LUT_BLOBS.GEAR_LUT.hash
  blobUrl = LUT_BLOBS.GEAR_LUT.url

  computeLeaf(index: Array<number>): TLeaf {
    const [frameIndex] = index
    const angle = frameIndex * angleDelta
    const radius = 6 * DISK_RADIUS
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle)
    const offset: Vec2 = [Math.round(x), Math.round(y)]
    return offset
  }
}
