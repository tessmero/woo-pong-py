/**
 * @file disk.ts
 * 
 * Sliding circle on airhockey table.
 */

import { Obstacle } from './obstacle'
import type { Vector } from './vector-math'
import { VectorMath } from './vector-math'

export class Disk {
  position: Vector
  velocity: Vector
  radius: number

  /**
   * Construct a sliding disk.
   * @param {object} params
   * @param {Vector} params.position
   * @param {Vector} params.velocity
   * @param {number} params.radius The size of the disk
   */
  constructor(params) {
    const { position, velocity, radius } = params

    this.position = position
    this.velocity = velocity
    this.radius = radius
  }

  /**
   * Implement homebrew physics step and update this.position.
   * We add robustness by checking collisions three times.
   * 1. start of step, using current position
   * 2. start of step, using anticipated next position
   * 3. end of step, using new position
   * Typically check #2 is the only necessary check. It triggers the bouncing behavior.
   * @param {object[]} obstacles The array of Obstacle instances to collide with
   */
  step(obstacles: Array<Obstacle>) {
    // get ready to anticipate collisions in the immediate future
    const futureSelf = new Disk(this) // copy self
    futureSelf.position = VectorMath.add(this.position, this.velocity)

    // iterate over obstacles
    for (const obstacle of obstacles) {
      // 1. check if colliding at current position
      const currentCollision = obstacle.collisionCheck(this)
      if (currentCollision) {
        // attempt to force into valid position
        this.position = currentCollision.adjustedPosition
      }

      // 2. anticipate collision at next position
      const nextCollision = obstacle.collisionCheck(futureSelf)
      if (nextCollision) {
        // simulate bounce

        // check trajectory before bounce
        const speed = VectorMath.getLength(this.velocity)
        const angle = VectorMath.getAngle(this.velocity)

        // reflect angle off of the wall
        const newAngle = 2 * nextCollision.nearestSegment.angle - angle

        // update velocity
        this.velocity = VectorMath.polarToCartesian(newAngle, speed)

        // break loop to prevent bouncing more than once per step
        break
      }
    }

    // execute step and advance to next position
    this.position = VectorMath.add(this.position, this.velocity)

    // 3. check if colliding after advancing
    const afterCollision = obstacles.map(obs => obs.collisionCheck(this)).find(Boolean)
    if (afterCollision) {
      // attempt to force into valid position
      this.position = afterCollision.adjustedPosition
    }
  }

  /**
   * Get position for purposes of drawing
   * @returns {Vector}
   */
  getPosition() {
    return this.position
  }

  /**
   * Get angle for purposes of drawing
   * @returns {number}
   */
  getAngle() {
    return 0
  }
}
