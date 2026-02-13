/**
 * @file obstacle-lut.ts
 *
 * Used to check for collisions with obstacles and get normal angles.
 */

import { DISK_RADIUS, INT16_MAX, INT16_MIN, OBSTACLE_DETAIL_SCALE } from 'simulation/constants'
import { Lut } from '../lut'
import { pio2, twopi, type Vec2 } from 'util/math-util'
import { pointsOnPath } from 'points-on-path'
import type { ShapeName, ShapeParams } from 'simulation/shapes'
import { SHAPE_PATHS } from 'simulation/shapes'

export const normalDetail = 100 // number of angle steps
export const angleToIndex = (angle) => {
  return (Math.floor(angle * normalDetail / twopi) % normalDetail + normalDetail) % normalDetail
}
// const indexToAngle = i => i * twopi / normalDetail

export type ObstacleCollision = null | [number, number, number] // x adjust, y adjust, normal index

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

  // assigned with shape-specific values in create and computeAll
  shape: ShapeName = 'roundrect'
  blobHash = ''
  blobUrl = ''
  obsOffsetDetailX = 1// 00 // half size of cache along dx and dy
  obsOffsetDetailY = 1// 00 // half size of cache along dx and dy
  maxOffsetX = 1// circleObsRadius + DISK_RADIUS // in-simulation distance at edge of bounds
  maxOffsetY = 1// circleObsRadius + DISK_RADIUS // in-simulation distance at edge of bounds
  detail = [
    this.obsOffsetDetailX * 2 + 1,
    this.obsOffsetDetailY * 2 + 1,
  ]

  offsetToXIndex = offset => Math.floor(offset / OBSTACLE_DETAIL_SCALE)
  offsetToYIndex = offset => Math.floor(offset / OBSTACLE_DETAIL_SCALE)
  indexToXOffset = i => i * OBSTACLE_DETAIL_SCALE
  indexToYOffset = i => i * OBSTACLE_DETAIL_SCALE

  // extend lut.ts
  public computeAll(): void {
    // compute shape-specific members

    const shapeParams = SHAPE_PATHS[this.shape]
    const {
      baseSvg,
    } = shapeParams

    let xRad = 0
    let yRad = 0
    const checkPoints = centeredPointsOnPath(baseSvg)
    transformPoints(checkPoints, shapeParams)

    for (const p of checkPoints) {
      const [dx, dy] = p.map(val => Math.abs(val))
      if (dx > xRad) xRad = dx
      if (dy > yRad) yRad = dy
    }
    xRad += DISK_RADIUS
    yRad += DISK_RADIUS
    xRad = Math.floor(xRad / OBSTACLE_DETAIL_SCALE)
    yRad = Math.floor(yRad / OBSTACLE_DETAIL_SCALE)

    // console.log(`shape ${this.shape} has xRad,yRad ${xRad}, ${yRad}`)

    this.obsOffsetDetailX = xRad // half size of cache along dx and dy
    this.obsOffsetDetailY = yRad // half size of cache along dx and dy
    this.maxOffsetX = xRad * OBSTACLE_DETAIL_SCALE // in-simulation distance at edge of bounds
    this.maxOffsetY = yRad * OBSTACLE_DETAIL_SCALE // in-simulation distance at edge of bounds
    this.detail = [
      this.obsOffsetDetailX * 2 + 1,
      this.obsOffsetDetailY * 2 + 1,
    ]

    super.computeAll() // uses this.detail to iterate over indices
  }

  // extend lut.ts
  public async loadAll(): Promise<void> {
    // use shape-specific members already assigned in create (lut.ts)

    await super.loadAll() // uses this.detail to iterate over indices
  }

  computeLeaf(index: Array<number>): ObstacleCollision {
    const dx = this.indexToXOffset(index[0] - this.obsOffsetDetailX)
    const dy = this.indexToYOffset(index[1] - this.obsOffsetDetailY)
    return computeCollision(this, [dx, dy])
  }
}

const detailedPointsCache: Partial<Record<ShapeName, ReadonlyArray<Vec2>>> = {}
export function getDetailedPoints(shape: ShapeName): ReadonlyArray<Vec2> {
  if (!Object.hasOwn(detailedPointsCache, shape)) {
    const points = computeDetailedPoints(shape)
    detailedPointsCache[shape] = points
    // console.log('obstacle lut points: ', shape, points.length)
  }
  return detailedPointsCache[shape] as ReadonlyArray<Vec2>
}

// const _cached: Record<string, Array<Vec2>> = {}
export function centeredPointsOnPath(path: string, _truncate = false): Array<Vec2> {
  // if (!Object.hasOwn(_cached, path)) {
  //   _cached[path] = _centeredPointsOnPath(path, _truncate)
  // }
  // return [..._cached[path]]
  return _centeredPointsOnPath(path, _truncate)
}
function _centeredPointsOnPath(path: string, _truncate = false): Array<Vec2> {
  let points = pointsOnPath(path, 0.05)[0]
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of points) {
    const [x, y] = p
    if (x > maxX) maxX = x
    if (x < minX) minX = x
    if (y > maxY) maxY = y
    if (y < minY) minY = y
  }

  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2

  for (const p of points) {
    p[0] -= midX
    p[1] -= midY
  }

  if (_truncate) {
    points = points.filter(p => p[0] < 100)
  }

  return points
}

function computeDetailedPoints(shape: ShapeName): ReadonlyArray<Vec2> {
  const shapeParams = SHAPE_PATHS[shape]
  const {
    baseSvg,
    scale = 1,
    xScale = 1,
    yScale = 1,
    isPathReversed = false,
  } = shapeParams

  const isTruncated = (shape === 'flipper')
  let points = centeredPointsOnPath(baseSvg, isTruncated)

  // Distance threshold to add midpoints
  const threshold = DISK_RADIUS / 10 / scale / Math.max(xScale, yScale)
  let hasAddedPoints = true

  while (hasAddedPoints) {
    hasAddedPoints = false
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
        hasAddedPoints = true
      }
    }

    points = newPoints
  }

  transformPoints(points, shapeParams)

  if (isPathReversed) {
    points.reverse()
  }

  return points
}

export function transformPoints(points: Array<Vec2> | ReadonlyArray<Vec2>, params: ShapeParams) {
  const {
    rotation = 0,
    scale = 1,
    xScale = 1,
    yScale = 1,
  } = params

  for (const p of points) {
    const [x, y] = p
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    p[0] = (x * cos - y * sin) * scale * xScale
    p[1] = (x * sin + y * cos) * scale * yScale
  }
}

function findNearestPoint(points: ReadonlyArray<Vec2>, pos: Vec2): number {
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

  return nearestPointIndex
}

function computeCollision(lut: ObstacleLut, pos: Vec2): ObstacleCollision {
  const { shape } = lut
  // check if inside of obstacle
  // const isInside = this.path.contains(...pos)
  const points = getDetailedPoints(shape)
  const isInside = isPointInPolygon(pos, points)

  const nearestPointIndex = findNearestPoint(points, pos)
  const nearestPoint = points[nearestPointIndex]
  const distToNearestPoint = Math.hypot(
    nearestPoint[0] - pos[0], nearestPoint[1] - pos[1],
  )

  // assume balls never make it inside
  if (isInside) return null

  if (isInside || distToNearestPoint < DISK_RADIUS) {
    // compute normal based on neighboring points
    const n = points.length
    const a = points[(nearestPointIndex + 1) % n]
    const b = points[(nearestPointIndex - 1 + n) % n]
    const normAngle = Math.atan2(b[1] - a[1], b[0] - a[0]) - pio2

    // compute offset for disk to stop overlapping
    let offsetDist = DISK_RADIUS - distToNearestPoint
    offsetDist += DISK_RADIUS / 50 // test

    const offset: Vec2 = [
      Math.round(offsetDist * Math.cos(normAngle)),
      Math.round(offsetDist * Math.sin(normAngle)),
    ]

    for (let ax = 0; ax < 2; ax++) {
      const value = offset[ax]
      if (value < INT16_MIN || value > INT16_MAX) {
        return null // adjustment would be outside of encode-able range
      }
    }

    // const offsetPoint: Vec2 = [
    //   nearestPoint[0] + (DISK_RADIUS * Math.cos(normAngle)),
    //   nearestPoint[1] + (DISK_RADIUS * Math.sin(normAngle)),
    // ]
    // const offset: Vec2 = [
    //   Math.round(offsetPoint[0] - pos[0]),
    //   Math.round(offsetPoint[1] - pos[1]),
    // ]

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
