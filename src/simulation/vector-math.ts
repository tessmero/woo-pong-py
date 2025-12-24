/**
 * @file VectorMath
 * utility functions involving 2D vectors
 * Vectors are objects with properties x and y
 */
export type Vector = { x: number, y: number }

export class VectorMath {
  /**
   * Compute a weighted average between two vectors or numbers.
   * @param {number|Vector} a
   * @param {number|Vector} b
   * @param {number} r Optional ratio
   */
  static avg(a, b, r = 0.5) {
    if (typeof a === 'number') {
      return a * (1 - r) + b * r // average numbers
    }

    // average vectors
    return {
      x: VectorMath.avg(a.x, b.x, r),
      y: VectorMath.avg(a.y, b.y, r),
    }
  }

  /**
   * Convert from polar coordinates (angle,radius)
   * to Cartesian coordinates (x,y).
   * @param {number} angle
   * @param {number} radius
   * @returns {Vector} The equivalent (x,y) vector.
   */
  static polarToCartesian(angle, radius) {
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    }
  }

  /**
   * Get the direction of the vector.
   * @param {Vector} vector
   * @returns {number} The angle in radians.
   */
  static getAngle(vector) {
    const { x, y } = vector
    return Math.atan2(y, x)
  }

  /**
   *
   * @param {Vector} vector
   * @returns {number}
   */
  static getLengthSquared(vector) {
    const { x, y } = vector
    return x * x + y * y
  }

  /**
   * Get the magnitude/length/distance of the vector.
   * @param {Vector} vector
   * @returns {number}
   */
  static getLength(vector) {
    return Math.sqrt(VectorMath.getLengthSquared(vector))
  }

  /**
   * Add together two or more vectors.
   * @param {...Vector} vectors
   * @returns {Vector}
   */
  static add(...vectors) {
    let totalX = 0
    let totalY = 0
    for (const { x, y } of vectors) {
      totalX = totalX + x
      totalY = totalY + y
    }
    return { x: totalX, y: totalY }
  }

  /**
   * Compute the difference between two vectors
   * @param {Vector} a
   * @param {Vector} b
   * @returns {Vector} The difference a-b
   */
  static subtract(a, b) {
    return {
      x: a.x - b.x,
      y: a.y - b.y,
    }
  }

  /**
   * Multiply a vector by a number
   * @param {Vector} vector
   * @param {number} scalar
   */
  static multiply(vector, scalar) {
    const { x, y } = vector
    return {
      x: x * scalar,
      y: y * scalar,
    }
  }

  /**
   * Check if the point is contained by the polygon
   * @param {Vector} point The point to check
   * @param {Vector[]} verts The vertices of the shape to check
   */
  static isPointInPolygon(point, verts) {
    const { x, y } = point

    // ray casting algorithm
    // we cast a ray from the point (direction doesn't matter)
    // and count how many times the ray crosses the edge of the polygon

    // assume the point is outside until we find an intersection
    let isInside = false

    // iterate over polygon line segments
    for (let i = 0; i < verts.length; i++) {
      const j = (i + 1) % verts.length
      const xi = verts[i].x
      const yi = verts[i].y
      const xj = verts[j].x
      const yj = verts[j].y

      // check if ray intersects this line segment
      const intersect = ((yi > y) !== (yj > y))
        && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)

      if (intersect) {
        isInside = !isInside
      }
    }

    return isInside
  }

  /**
   * Interpret shape parameters used to describe obstacles.
   *
   * vertices -> arbitrary polygon
   * center,radius,n -> regular polygon
   * box: [x,y,w,h] -> rectangle
   * @param {object} params The shape parameters
   * @returns {object} result The shape vertices
   */
  static parseVertices(params): { center: Vector, vertices: Array<Vector> } {
    let { vertices, center } = params
    const { radius, n, angle = 0, box } = params

    if (center && radius && n) {
      // build regular polygon vertices
      vertices = []
      for (let i = 0; i < n; i++) {
        vertices.push(VectorMath.add(center,
          VectorMath.polarToCartesian(angle + i * 2 * Math.PI / n, radius)))
      }
    }
    else if (box) {
      // build rectangle vertices
      const [x, y, w, h] = box
      center = { x: x + w / 2, y: y + h / 2 }
      vertices = [
        { x, y }, // Top-left
        { x: x + w, y }, // Top-right
        { x: x + w, y: y + h }, // Bottom-right
        { x, y: y + h }, // Bottom-left
      ]
    }
    else if (vertices) {
      if (!center) {
        // compute center for arbitrary polygon
        center = VectorMath.multiply(VectorMath.add(...vertices), 1 / vertices.length)
      }
    }
    else {
      // shape parameters are not valid
      throw new Error('must provide center/radius/n or box or vertices')
    }

    return { center, vertices }
  }
}
