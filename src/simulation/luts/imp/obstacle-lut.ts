/**
 * @file obstacle-lut.ts
 *
 * Used to check for collisions with obstacles and get normal angles.
 */

import { circleObsRadius, DISK_RADIUS } from 'simulation/constants'
import { Lut } from '../lut'
import { angleToIndex } from './disk-normal-lut'
import { OBSTACLE_LUT_BLOB_HASH, OBSTACLE_LUT_BLOB_URL } from 'set-by-build'

export type ObstacleCollision = null | [number, number, number] // x adjust, y adjust, normal index

export const obsOffsetDetail = 100 // half size of cache along dx and dy
const maxOffset = circleObsRadius + DISK_RADIUS

export class ObstacleLut extends Lut<ObstacleCollision> {
  static {
    Lut.register('obstacle-lut', {
      factory: () => new ObstacleLut(),
      blobHash: OBSTACLE_LUT_BLOB_HASH,
      blobUrl: OBSTACLE_LUT_BLOB_URL,
      depth: 2,
      leafLength: 3,
      // detail: [
      //   obsOffsetDetail * 2 + 1,
      //   obsOffsetDetail * 2 + 1,
      // ],
    })
  }

  detail = [
    obsOffsetDetail * 2 + 1,
    obsOffsetDetail * 2 + 1,
  ]

  offsetToIndex = offset => Math.floor(offset * obsOffsetDetail / maxOffset)
  indexToOffset = i => i * maxOffset / obsOffsetDetail

  computeLeaf(index: Array<number>) {
    const dx = this.indexToOffset(index[0] - obsOffsetDetail)
    const dy = this.indexToOffset(index[1] - obsOffsetDetail)
    return computeCollision(dx, dy)
  }
}

function computeCollision(dx: number, dy: number): ObstacleCollision {
  const angle = Math.atan2(dy, dx)
  const radius = Math.hypot(dx, dy)
  if (radius > maxOffset) {
    return null // not colliding
  }

  const radAdj = maxOffset - radius
  return [
    Math.round(Math.cos(angle) * radAdj),
    Math.round(Math.sin(angle) * radAdj),
    angleToIndex(angle),
  ]
}
