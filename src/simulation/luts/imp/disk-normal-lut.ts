/**
 * @file disk-normal-lut.ts
 *
 * Lookup table for disk hitting solid line.
 */

import { twopi } from 'util/math-util'
import { Lut, i16 } from '../lut'
import type { LeafSchema, LeafValues } from '../lut'
import { LUT_BLOBS } from 'set-by-build'
import { RESTITUTION } from 'simulation/constants'

const cacheScale = 1e2

export const normalDetail = 100 // number of angle steps
export const angleToIndex = (angle) => {
  return (Math.floor(angle * normalDetail / twopi) % normalDetail + normalDetail) % normalDetail
}
const indexToAngle = i => i * twopi / normalDetail

export const speedDetail = 20 // half size of cache along relative vx and vy
const maxAxisSpeed = cacheScale * speedDetail
export const speedToIndex = speed => Math.floor(speed * speedDetail / maxAxisSpeed)
export const indexToSpeed = i => i * maxAxisSpeed / speedDetail

const dnlSchema: LeafSchema = [i16('dvx'), i16('dvy')]

export class DiskNormalLut extends Lut {
  static {
    Lut.register('disk-normal-lut', {
      factory: () => new DiskNormalLut(),
      depth: 3,
      schema: dnlSchema,
    })
  }

  schema = dnlSchema
  blobHash = LUT_BLOBS.DISK_NORMAL_LUT.hash
  blobUrl = LUT_BLOBS.DISK_NORMAL_LUT.url
  detail = [
    speedDetail * 2 + 1,
    speedDetail * 2 + 1,
    normalDetail,
  ]

  computeLeaf(index: Array<number>): LeafValues {
    const vx = indexToSpeed(index[0] - speedDetail)
    const vy = indexToSpeed(index[1] - speedDetail)
    const normal = indexToAngle(index[2])
    return computeCollision(vx, vy, normal)
  }
}

function computeCollision(vx: number, vy: number, normal: number): LeafValues {
  const cos = Math.cos(normal)
  const sin = Math.sin(normal)

  const dotProduct = vx * cos + vy * sin
  const newVx = (vx - 2 * dotProduct * cos)
  const newVy = (vy - 2 * dotProduct * sin)

  return {
    dvx: Math.round((newVx - vx) * RESTITUTION),
    dvy: Math.round((newVy - vy) * RESTITUTION),
  }
}
