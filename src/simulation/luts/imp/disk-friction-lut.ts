/**
 * @file disk-friction-lut.ts
 *
 * Lookup table to pick new velocity based on previous velocity.
 */

import { LUT_BLOBS } from 'set-by-build'
import { Lut, i16 } from '../lut'
import type { LeafSchema, LeafValues } from '../lut'
import type { DiskState } from 'simulation/disk'
import { RESTITUTION } from 'simulation/constants'

const cacheScale = 1e2
export const speedDetail = 20 // half size of cache along relative vx and vy
const maxAxisSpeed = cacheScale * speedDetail
// Use truncation so negative speeds quantize toward zero instead of away from it.
export const speedToIndex = speed => Math.trunc(speed * speedDetail / maxAxisSpeed)
export const indexToSpeed = i => i * maxAxisSpeed / speedDetail

const dflSchema: LeafSchema = [i16('speed')]

export class DiskFrictionLut extends Lut {
  static {
    Lut.register('disk-friction-lut', {
      factory: () => new DiskFrictionLut(),
      depth: 1,
      schema: dflSchema,
    })
  }

  schema = dflSchema
  blobHash = LUT_BLOBS.DISK_FRICTION_LUT.hash
  blobUrl = LUT_BLOBS.DISK_FRICTION_LUT.url
  detail = [
    speedDetail * 2 + 1,
  ]

  computeLeaf(index: Array<number>): LeafValues {
    const oldSpeed = indexToSpeed(index[0] - speedDetail)
    const newSpeed = Math.round(oldSpeed * RESTITUTION)
    return { speed: newSpeed }
  }
}

export function applyFrictionX(state: DiskState) {
  const lut = Lut.create('disk-friction-lut')
  const oldSpeed = state.dx
  let index = speedToIndex(oldSpeed)
  if (Math.abs(index) > speedDetail) {
    index = speedDetail * Math.sign(index)
  }
  state.dx = lut.get(index + speedDetail, 'speed')
  // console.log(`old dx ${oldSpeed} new dx ${state.dx} change ${state.dx/oldSpeed}`)
}
export function applyFrictionY(state: DiskState) {
  const lut = Lut.create('disk-friction-lut')
  const oldSpeedY = state.dy
  let indexY = speedToIndex(oldSpeedY)
  if (Math.abs(indexY) > speedDetail) {
    indexY = speedDetail * Math.sign(indexY)
  }
  state.dy = lut.get(indexY + speedDetail, 'speed')
}
