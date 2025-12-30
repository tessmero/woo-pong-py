/**
 * @file obstacle.ts
 *
 * Solid obstacle defined by a closed path.
 */

import type { Rectangle, Vec2 } from 'util/math-util'
import { DISK_RADIUS } from './constants'
import type { Path2D } from '@julusian/skia-canvas'
import { Normals } from './normals'

// // dummy context to call isPointInPath
// const canvas = document.createElement('canvas')
// const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

export class Obstacle {
  readonly collisionRect: Rectangle
  readonly points: ReadonlyArray<[x: number, y: number]>

  constructor(
    readonly path: Path2D,
    readonly boundingRect: Rectangle,
  ) {
    const [x, y, w, h] = boundingRect
    this.collisionRect = [
      x - DISK_RADIUS, y - DISK_RADIUS,
      w + 2 * DISK_RADIUS, h + 2 * DISK_RADIUS,
    ]
    this.points = path.points(0.5)
  }

  computeCollision(pos: Vec2): null | { pos: Vec2, normIndex: number } {
    // check if inside of obstacle
    const isInside = this.path.contains(...pos)

    // locate nearest point
    let minDistSquared = Infinity
    let nearestPointIndex = 0
    for (const [i, point] of this.points.entries()) {
      const dx = point[0] - pos[0]
      const dy = point[1] - pos[1]
      const distSquared = dx * dx + dy * dy
      if (distSquared < minDistSquared) {
        minDistSquared = distSquared
        nearestPointIndex = i
      }
    }

    const distToNearestPoint = Math.sqrt(minDistSquared)

    if (isInside || distToNearestPoint < DISK_RADIUS) {
      // compute normal based on neighboring points
      const n = this.points.length
      const a = this.points[(nearestPointIndex + 1) % n]
      const b = this.points[(nearestPointIndex - 1 + n) % n]
      const normAngle = Math.atan2(b[1] - a[1], b[0] - a[0])

      // compute offset for disk to stop overlapping
      const offsetDist = DISK_RADIUS - distToNearestPoint
      const offset: Vec2 = [
        offsetDist * Math.cos(normAngle),
        offsetDist * Math.sin(normAngle),
      ]

      return {
        normIndex: Normals.getIndex(normAngle),
        pos: offset,
      }
    }
    else {
      // not colliding
      return null
    }
  }
}
