/**
 * @file disk-normal-lut.ts
 *
 * Lookup table for disk hitting solid line.
 */

import { pio2, twopi } from 'util/math-util'
import { Lut } from '../lut'
import { DISK_NORMAL_LUT_BLOB_HASH, DISK_NORMAL_LUT_BLOB_URL } from 'set-by-build'

export type DiskNormalBounce = [number, number] // dx,dy

const cacheScale = 1e2

export const normalDetail = 100 // number of angle steps
export const angleToIndex = angle => (Math.floor(angle * normalDetail / twopi) % normalDetail + normalDetail) % normalDetail
const indexToAngle = i => i * twopi / normalDetail

export const speedDetail = 20 // half size of cache along relative vx and vy
const maxAxisSpeed = cacheScale * speedDetail
export const speedToIndex = speed => Math.floor(speed * speedDetail / maxAxisSpeed)
export const indexToSpeed = i => i * maxAxisSpeed / speedDetail

export class DiskNormalLut extends Lut<DiskNormalBounce> {
  static {
    Lut.register('disk-normal-lut', {
      factory: () => new DiskNormalLut(),
      depth: 3,
      leafLength: 2,
      detail: [
        speedDetail * 2 + 1,
        speedDetail * 2 + 1,
        normalDetail,
      ],
      blobHash: DISK_NORMAL_LUT_BLOB_HASH,
      blobUrl: DISK_NORMAL_LUT_BLOB_URL,
    })
  }

  computeLeaf(index: Array<number>) {
    const vx = indexToSpeed(index[0] - speedDetail)
    const vy = indexToSpeed(index[1] - speedDetail)
    const normal = indexToAngle(index[2])
    return computeCollision(vx, vy, normal)
  }
}

function computeCollision(vx: number, vy: number, normal: number): DiskNormalBounce {
  const cos = Math.cos(normal)
  const sin = Math.sin(normal)

  const dotProduct = vx * cos + vy * sin
  const newVx = vx - 2 * dotProduct * cos
  const newVy = vy - 2 * dotProduct * sin

  return [newVx-vx, newVy-vy]
}
