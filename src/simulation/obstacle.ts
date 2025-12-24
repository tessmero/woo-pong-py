/**
 * @file obstacle.ts
 *
 * A solid barrier that the disk can collide with.
 */

import type { Vector } from './vector-math'
import { VectorMath } from './vector-math'

export type Segment = {
  start: Vector
  end: Vector
  delta: Vector
  angle: number
  lengthSquared: number
}

export type CollisionDatum = {
  nearestSegment: Segment
  nearestPoint: Vector
  adjustedPosition: Vector
}

export class Obstacle {
  vertices: Array<Vector>
  segments: Array<Segment>

  /**
   * Construct an obstacle based on flexible shape parameters.
   * @param {object} params The (center/radius/n) or box:[x,y,w,h] or vertices
   */
  constructor(params) {
    // interpret flexible parameters as standard shape
    const { vertices } = VectorMath.parseVertices(params)

    this.vertices = vertices
    this.segments = []

    // iterate over line segments
    for (let i = 0; i < vertices.length; i++) {
      const start = vertices[i]
      const end = vertices[(i + 1) % vertices.length]

      // prepare to check the line segment for collisions later
      const delta = VectorMath.subtract(end, start)
      const angle = VectorMath.getAngle(delta)
      const lengthSquared = VectorMath.getLengthSquared(delta)
      this.segments.push({
        start, end, delta,
        angle, lengthSquared,
      })
    }
  }

  /**
   * Get vertices for purposes of rendering
   */
  getVertices() { return this.vertices }

  /**
   * Check if the given disk is intersecting this obstacle.
   * @param {object} disk The Disk instance
   * @returns {object} result The collision data or null
   */
  collisionCheck(disk): CollisionDatum | null {
    const {
      nearestSegment,
      nearestPoint,
    } = this._getPointOnEdge(disk.position)

    // check if the CENTER of the disk is inside this obstacle
    const centerInside = VectorMath.isPointInPolygon(disk.position, this.vertices)

    if (!centerInside) {
      // check if ANY part of the disk is inside this obstacle
      const delta = VectorMath.subtract(nearestPoint, disk.position)
      const distance = VectorMath.getLength(delta)
      if (distance >= disk.radius) {
        return null // the disk does not intersect with this platform
      }
    }

    // the disk is intersecting the platform
    // compute an adjusted position where the disk would just touch this platform
    const normal = nearestSegment.angle - Math.PI / 2
    const adjustedPosition = VectorMath.add(nearestPoint,
      VectorMath.polarToCartesian(normal, disk.radius))

    return { nearestSegment, nearestPoint, adjustedPosition }
  }

  /**
   * Find the edge point nearest to the given point
   * @param {Vector} point
   */
  _getPointOnEdge(point): { nearestSegment: Segment, nearestPoint: Vector } {
    let nearestSegment: Segment = this.segments[0]
    let nearestPoint: Vector = point
    let shortestDistance = Infinity

    // Iterate through each edge line segment
    for (const segment of this.segments) {
      // find nearest point on this segment
      const edgePoint = this._getPointOnSegment(segment, point)

      // check distance to target point
      const distance = VectorMath.getLength(VectorMath.subtract(edgePoint, point))

      // check if this is the new best candidate
      if (distance < shortestDistance) {
        shortestDistance = distance
        nearestSegment = segment
        nearestPoint = edgePoint
      }
    }

    // return best candidate
    return { nearestSegment, nearestPoint }
  }

  /**
   * Get the point on the line segment nearest to point p.
   * @param {object} segment The segment processed in constructor
   * @param {Vector} p
   */
  _getPointOnSegment(segment, p): Vector {
    const d = VectorMath.subtract(p, segment.start)
    let r = (d.x * segment.delta.x + d.y * segment.delta.y) / segment.lengthSquared

    if (r < 0) { r = 0 }
    if (r > 1) { r = 1 }

    return VectorMath.add(segment.start, VectorMath.multiply(segment.delta, r))
  }
}
