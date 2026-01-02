/**
 * @file obstacle-lut.ts
 *
 * Used to check for collisions with obstacles and get normal angles.
 */

import { DISK_RADIUS } from 'simulation/constants'
import { Lut } from '../lut'
import { angleToIndex } from './disk-normal-lut'
import { pi } from 'util/math-util'

export type ObstacleCollision = null | [number, number, number] // x adjust, y adjust, normal index

export const offsetDetail = 10 // half size of cache along dx and dy
const maxOffset = 20 * DISK_RADIUS

export class ObstacleLut extends Lut<ObstacleCollision> {
  static {
    Lut.register('obstacle-lut', {
      factory: () => new ObstacleLut(),
      blobHash: '',
      blobUrl: '',
      depth: 2,
      detail: [
        offsetDetail * 2 + 1,
        offsetDetail * 2 + 1,
      ],
    })
  }

  offsetToIndex = offset => Math.floor(offset * offsetDetail / maxOffset)
  indexToOffset = i => i * maxOffset / offsetDetail

  computeLeaf(index: Array<number>) {
    const dx = this.indexToOffset(index[0] - offsetDetail)
    const dy = this.indexToOffset(index[1] - offsetDetail)
    return computeCollision(dx, dy)
  }
}

function computeCollision(dx: number, dy: number): ObstacleCollision {
  const angle = Math.atan2(dy, dx) + pi
  return [0, 0, angleToIndex(angle)]
}
