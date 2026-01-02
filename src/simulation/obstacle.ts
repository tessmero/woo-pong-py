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

  computeCollision(pos: Vec2): ObstacleCollision {
    // check if inside of obstacle
    // const isInside = this.path.contains(...pos)
    const isInside = isPointInPolygon(pos, this.points)

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

      return [
        offset[0], offset[1],
        angleToIndex(normAngle),
      ]
    }
    else {
      // not colliding
      return null
    }
  }
}

function isPointInPolygon(point: Vec2, verts: ReadonlyArray<Vec2>) {
  const [x, y] = point

  // ray casting algorithm
  // we cast a ray from the point (direction doesn't matter)
  // and count how many times the ray crosses the edge of the polygon

  // assume the point is outside until we find an intersection
  let isInside = false

  // iterate over polygon line segments
  for (let i = 0; i < verts.length; i++) {
    const j = (i + 1) % verts.length
    const xi = verts[i][0]
    const yi = verts[i][1]
    const xj = verts[j][0]
    const yj = verts[j][1]

    // check if ray intersects this line segment
    const isIntersecting = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)

    if (isIntersecting) {
      isInside = !isInside
    }
  }

  return isInside
}
