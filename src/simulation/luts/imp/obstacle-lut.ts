/**
 * @file obstacle-lut.ts
 *
 * Used to check for collisions with obstacles and get normal angles.
 */

import { circleObsRadius, DISK_RADIUS } from 'simulation/constants'
import { Lut } from '../lut'
import { pio2, twopi, type Vec2 } from 'util/math-util'
import { pointsOnPath } from 'points-on-path'
import type { ShapeName } from 'simulation/shapes'
import { SHAPE_PATHS } from 'simulation/shapes'

export const normalDetail = 100 // number of angle steps
export const angleToIndex = (angle) => {
  return (Math.floor(angle * normalDetail / twopi) % normalDetail + normalDetail) % normalDetail
}
const indexToAngle = i => i * twopi / normalDetail

export type ObstacleCollision = null | [number, number, number] // x adjust, y adjust, normal index

const obsOffsetDetail = 100 // half size of cache along dx and dy
const maxOffset = circleObsRadius + DISK_RADIUS

export class ObstacleLut extends Lut<ObstacleCollision> {
  static {
    Lut.register('obstacle-lut', {
      factory: () => new ObstacleLut(),
      // blobHash: OBSTACLE_LUT_BLOB_HASH,
      // blobUrl: OBSTACLE_LUT_BLOB_URL,
      depth: 2,
      leafLength: 3,
      // detail: [
      //   obsOffsetDetail * 2 + 1,
      //   obsOffsetDetail * 2 + 1,
      // ],
    })
  }

  // assigned with shape-specific values in create
  blobHash = ''
  blobUrl = ''
  detail = [
    obsOffsetDetail * 2 + 1,
    obsOffsetDetail * 2 + 1,
  ]

  shape: ShapeName = 'square'

  offsetToIndex = offset => Math.floor(offset * obsOffsetDetail / maxOffset)
  indexToOffset = i => i * maxOffset / obsOffsetDetail

  computeLeaf(index: Array<number>) {
    const dx = this.indexToOffset(index[0] - obsOffsetDetail)
    const dy = this.indexToOffset(index[1] - obsOffsetDetail)
    return computeCollision(this.shape, [dx, dy])
  }
}

// function computeCollision(dx: number, dy: number): ObstacleCollision {
//   const angle = Math.atan2(dy, dx)
//   const radius = Math.hypot(dx, dy)
//   if (radius > maxOffset) {
//     return null // not colliding
//   }

//   const radAdj = maxOffset - radius
//   return [
//     Math.round(Math.cos(angle) * radAdj),
//     Math.round(Math.sin(angle) * radAdj),
//     angleToIndex(angle),
//   ]
// }

const detailedPointsCache: Partial<Record<ShapeName, ReadonlyArray<Vec2>>> = {}
function getDetailedPoints(shape: ShapeName): ReadonlyArray<Vec2> {
  if (!Object.hasOwn(detailedPointsCache, shape)) {
    const points = computeDetailedPointsOnPath(SHAPE_PATHS[shape])
    detailedPointsCache[shape] = points
    console.log('obstacle lut points: ', shape, points.length)
  }
  return detailedPointsCache[shape] as ReadonlyArray<Vec2>
}

function computeDetailedPointsOnPath(path: string): ReadonlyArray<Vec2> {
  let points = pointsOnPath(path)[0]
  // points.push(points[0])
  const threshold = DISK_RADIUS / 10 // Distance threshold to add midpoints
  let addedPoints = true

  while (addedPoints) {
    addedPoints = false
    const newPoints: Array<Vec2> = []

    for (let i = 0; i < points.length; i++) {
      const current = points[i]
      const next = points[(i + 1) % points.length]

      newPoints.push(current)

      const dx = next[0] - current[0]
      const dy = next[1] - current[1]
      const distSquared = dx * dx + dy * dy

      if (distSquared > threshold * threshold) {
        const midPoint: Vec2 = [
          (current[0] + next[0]) / 2,
          (current[1] + next[1]) / 2,
        ]
        newPoints.push(midPoint)
        addedPoints = true
      }
    }

    points = newPoints
  }

  return points
}

function computeCollision(shape: ShapeName, pos: Vec2): ObstacleCollision {
  // check if inside of obstacle
  // const isInside = this.path.contains(...pos)
  const points = getDetailedPoints(shape)
  const isInside = isPointInPolygon(pos, points)

  // locate nearest point
  let minDistSquared = Infinity
  let nearestPointIndex = 0
  for (const [i, point] of points.entries()) {
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
    const n = points.length
    const a = points[(nearestPointIndex + 1) % n]
    const b = points[(nearestPointIndex - 1 + n) % n]
    const normAngle = Math.atan2(b[1] - a[1], b[0] - a[0]) - pio2

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
