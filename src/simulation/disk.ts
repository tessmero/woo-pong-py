/**
 * @file disk.ts
 *
 * Sliding circle on airhockey table.
 */

import type { Barrier } from './barrier'
import { valueScale } from './constants'

export class Disk {
  static readonly radius = 3 * valueScale
  x = 51 * valueScale
  y = 50 * valueScale
  dx = 2
  dy = 1

  static fromJson(obj: object) {
    const [x, y, dx, dy] = obj as any
    const d = new Disk()
    d.x = x
    d.y = y
    d.dx = dx
    d.dy = dy
    return d
  }

  toJson() {
    return [
      this.x, this.y, this.dx, this.dy,
    ]
  }

  static collide(a: Disk, b: Disk) {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const distanceSquared = dx * dx + dy * dy
    const radiusSum = Disk.radius * 2

    if (distanceSquared < radiusSum * radiusSum) {
      const distance = Math.sqrt(distanceSquared) || 1 // Avoid division by zero
      const overlap = radiusSum - distance

      // Normalize the collision vector
      const nx = dx / distance
      const ny = dy / distance

      // Separate the disks to resolve overlap
      const separation = overlap / 2
      a.x -= Math.round(nx * separation)
      a.y -= Math.round(ny * separation)
      b.x += Math.round(nx * separation)
      b.y += Math.round(ny * separation)

      // Reflect velocities along the collision normal
      const relativeVelocityX = b.dx - a.dx
      const relativeVelocityY = b.dy - a.dy
      const dotProduct = relativeVelocityX * nx + relativeVelocityY * ny

      if (dotProduct > 0) return // Prevent further collision resolution if already separating

      const impulse = 2 * dotProduct / 2 // Equal mass assumption
      // impulse = Math.max(impulse,-100)
      a.dx += Math.round(impulse * nx)
      a.dy += Math.round(impulse * ny)
      b.dx -= Math.round(impulse * nx)
      b.dy -= Math.round(impulse * ny)
    }
  }

  // move one tick
  advance(barriers: Array<Barrier>) {
    // if( gravityTick ){
    // gravity
    this.dy += 1
    // friction
    // const tv = 10
    // if (Math.abs(this.dx) > tv) this.dx -= Math.sign(this.dx)
    // if (Math.abs(this.dy) > tv) this.dy -= Math.sign(this.dy)
    // }

    const nx = this.x + this.dx
    const ny = this.y + this.dy

    // check for collision
    let bi = 0
    let noHits = true
    let ndx = this.dx
    let ndy = this.dy
    for (; bi < barriers.length; bi++) {
      const bar = barriers[bi]
      if (bar.isTouchingBallAtPos(nx, ny)) {
        // bounce off wall
        if (bar.isTouchingBallAtPos(this.x - this.dx, ny)) {
          ndy *= -1
        }
        else {
          ndx *= -1
        }
        noHits = false
        break
      }
    }
    if (noHits) {
      // move forward without changing velocity
      this.x = nx
      this.y = ny
      return
    }

    // check for second collision (hit corner)
    bi++
    for (; bi < barriers.length; bi++) {
      if (barriers[bi].isTouchingBallAtPos(nx, ny)) {
        // reverse direction
        ndx = -this.dx
        ndy = -this.dy
      }
    }

    // apply changed velocity
    this.dx = ndx
    this.dy = ndy
    this.x += ndx
    this.y += ndy
  }
}
