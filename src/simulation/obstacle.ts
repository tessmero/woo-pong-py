/**
 * @file obstacle.ts
 *
 * Solid obstacle defined by a closed path.
 */

import type { Rectangle, Vec2 } from 'util/math-util'
import { DISK_RADIUS } from './constants'
import { angleToIndex } from './luts/imp/disk-normal-lut'
import type { ObstacleCollision, ObstacleLut } from './luts/imp/obstacle-lut'
import { pointsOnPath } from 'points-on-path'

// // dummy context to call isPointInPath
// const canvas = document.createElement('canvas')
// const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

export class Obstacle {
  readonly boundingRect: Rectangle
  readonly collisionRect: Rectangle
  readonly points: ReadonlyArray<Vec2>

  constructor(
    readonly pos: Vec2,
    readonly path: string,
    readonly lut: ObstacleLut,
  ) {
    this.points = pointsOnPath(path)[0]
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const [px, py] of this.points) {
      if (px < minX) minX = px
      if (px > maxX) maxX = px
      if (py < minY) minY = py
      if (py > maxY) maxY = py
    }

    const x = pos[0] + minX
    const y = pos[1] + minY
    const w = maxX - minX
    const h = maxY - minY
    this.boundingRect = [x,y,w,h]
    this.collisionRect = [
      x - DISK_RADIUS, y - DISK_RADIUS,
      w + 2 * DISK_RADIUS, h + 2 * DISK_RADIUS,
    ]
  }
}
