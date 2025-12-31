/**
 * @file disk-disk-lut.ts
 *
 * Lookup table for disk-disk collisions.
 */

import { DiskDiskCollisions, indexToOffset, indexToSpeed, offsetDetail, speedDetail } from 'simulation/disk-disk-collisions'
import { Lut } from '../lut'

export type CachedCollision = null | [number, number, number, number] // x,y,dx,dy

export class DiskDiskLut extends Lut<CachedCollision> {
  static {
    Lut.register('disk-disk-lut', {
      depth: 4,
      detail: [
        offsetDetail * 2 + 1,
        offsetDetail * 2 + 1,
        speedDetail * 2 + 1,
        speedDetail * 2 + 1,
      ],
      factory: () => new DiskDiskLut(),
    })
  }

  computeLeaf(index: Array<number>) {
    const dx = indexToOffset(index[0] - offsetDetail)
    const dy = indexToOffset(index[1] - offsetDetail)
    const vx = indexToSpeed(index[2] - speedDetail)
    const vy = indexToSpeed(index[3] - speedDetail)
    return DiskDiskCollisions.computeCollision(dx, dy, vx, vy)
  }
}
