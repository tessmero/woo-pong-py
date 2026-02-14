/**
 * @file disk-friction-lut.ts
 *
 * Lookup table to pick new velocity based on previous velocity.
 */

import { LUT_BLOBS } from 'set-by-build'
import { Lut } from '../lut'
import type { DiskState } from 'simulation/disk'
import { RESTITUTION } from 'simulation/constants'

const cacheScale = 1e2
export const speedDetail = 20 // half size of cache along relative vx and vy
const maxAxisSpeed = cacheScale * speedDetail
export const speedToIndex = speed => Math.floor(speed * speedDetail / maxAxisSpeed)
export const indexToSpeed = i => i * maxAxisSpeed / speedDetail

export class DiskFrictionLut extends Lut<[number]> {
  static {
    Lut.register('disk-friction-lut', {
      factory: () => new DiskFrictionLut(),
      depth: 1,
      leafLength: 1,
    })
  }

  blobHash = LUT_BLOBS.DISK_FRICTION_LUT.hash
  blobUrl = LUT_BLOBS.DISK_FRICTION_LUT.url
  detail = [
    speedDetail * 2 + 1,
  ]

  computeLeaf(index: Array<number>): [number] {
    const oldSpeed = indexToSpeed(index[0] - speedDetail)
    const newSpeed = Math.round(oldSpeed * RESTITUTION)
    // if( oldSpeed === newSpeed ){
    //     throw new Error(`old same as new: ${oldSpeed}, ${newSpeed}`)
    // }
    return [newSpeed]
  }
}

export function applyFrictionX(state: DiskState) {
  const lut = Lut.create('disk-friction-lut')
  // dx
  const oldSpeed = state.dx
  let index = speedToIndex(oldSpeed)
  if (Math.abs(index) > speedDetail) {
    index = speedDetail * Math.sign(index)
  }
  // For now, just round as before
  state.dx = lut.getInt16(index + speedDetail, 0)
}
export function applyFrictionY(state: DiskState) {
  const lut = Lut.create('disk-friction-lut')
  // dy
  const oldSpeedY = state.dy
  let indexY = speedToIndex(oldSpeedY)
  if (Math.abs(indexY) > speedDetail) {
    indexY = speedDetail * Math.sign(indexY)
  }
  // For now, just round as before
  state.dy = lut.getInt16(indexY + speedDetail, 0)
}
