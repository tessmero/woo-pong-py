/**
 * @file collisions.ts
 *
 * Preloaded lookup table for ball-ball collisions.
 */

import { DISK_RADIUS } from './constants'
import type { Disk } from './disk'

const cacheScale = 1e2
type CachedCollision = null | {
  x: number
  y: number
  dx: number
  dy: number
}
const cache: Record<string, CachedCollision> = {}

const speedDetail = 20 // half size of cache along relative vx and vy
const maxAxisSpeed = cacheScale * speedDetail
const speedToIndex = speed => Math.floor(speed * speedDetail / maxAxisSpeed)
const indexToSpeed = i => i * maxAxisSpeed / speedDetail

const offsetDetail = 5 // hald size of cache along dx and dy
const maxOffset = 2 * DISK_RADIUS
const offsetToIndex = offset => Math.floor(offset * offsetDetail / maxOffset)
const indexToOffset = i => i * maxOffset / offsetDetail

export class Collisions {
  static get cacheSize() { return Object.keys(cache).length }

  static preloadAll() {
    for (let dxi = -offsetDetail; dxi <= offsetDetail; dxi++) {
      const dx = indexToOffset(dxi)
      for (let dyi = -offsetDetail; dyi <= offsetDetail; dyi++) {
        const dy = indexToOffset(dyi)
        for (let vxi = -speedDetail; vxi <= speedDetail; vxi++) {
          const vx = indexToSpeed(vxi)
          for (let vyi = -speedDetail; vyi <= speedDetail; vyi++) {
            const vy = indexToSpeed(vyi)

            const key = (
              [dxi, dyi, vxi, vyi]
            ).join('|')

            cache[key] = Collisions.computeCollision(dx, dy, vx, vy)
          }
        }
      }
    }
    console.log('build cache with size:', Object.keys(cache).length)
  }

  static collide(a: Disk, b: Disk) {
    // index based on relative position
    let dxi = offsetToIndex(b.x - a.x)
    let dyi = offsetToIndex(b.y - a.y)

    if (Math.abs(dxi) > offsetDetail) {
      return
      dxi = offsetDetail * Math.sign(dxi)
    }
    if (Math.abs(dyi) > offsetDetail) {
      return
      dyi = offsetDetail * Math.sign(dyi)
    }

    // index based on relative velcoity
    let vxi = speedToIndex(b.dx - a.dx)
    let vyi = speedToIndex(b.dy - a.dy)

    if (Math.abs(vxi) > speedDetail) {
      // throw new Error(`dx ${dx} or of range (${maxAxisSpeed}) in collisions`)
      vxi = speedDetail * Math.sign(vxi)
    }
    if (Math.abs(vyi) > speedDetail) {
      // throw new Error(`dy ${dy} or of range (${maxAxisSpeed}) in collisions`)
      vyi = speedDetail * Math.sign(vyi)
    }

    // const key = (
    //   [dxi, dyi, vxi, vyi]
    // ).join('|')
    // if (!(key in cache)) {
    //   throw new Error('key not in cache')
    //   cache[key] = Collisions.computeCollision(dx, dy, relativeVelocityX, relativeVelocityY)
    // }
    // const col = cache[key]
    const col = Collisions.computeCollision(
      indexToOffset(dxi), indexToOffset(dyi),
      indexToSpeed(vxi), indexToSpeed(vyi),
    )

    // const col = Disk.computeCollision(dx, dy, relativeVelocityX, relativeVelocityY)
    if (!col) return
    a.x -= col.x
    a.y -= col.y
    b.x += col.x
    b.y += col.y
    a.dx -= col.dx
    a.dy -= col.dy
    b.dx += col.dx
    b.dy += col.dy
  }

  static computeCollision(dx, dy, relativeVelocityX, relativeVelocityY): CachedCollision {
    const distanceSquared = dx * dx + dy * dy
    const radiusSum = DISK_RADIUS * 2

    if (distanceSquared < radiusSum * radiusSum) {
      const distance = Math.sqrt(distanceSquared) || 1 // Avoid division by zero
      const overlap = radiusSum - distance

      // Normalize the collision vector
      const nx = dx / distance
      const ny = dy / distance

      // Separate the disks to resolve overlap
      const separation = overlap / 2
      // Reflect velocities along the collision normal
      const dotProduct = relativeVelocityX * nx + relativeVelocityY * ny

      if (dotProduct > 0) return null // Prevent further collision resolution if already separating

      const impulse = 2 * dotProduct / 2 // Equal mass assumption
      // impulse = Math.max(impulse,-100)

      return {
        x: Math.round(nx * separation),
        y: Math.round(ny * separation),

        dx: -Math.round(impulse * nx),
        dy: -Math.round(impulse * ny),
      }
    }
    return null
  }
}
