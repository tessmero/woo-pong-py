/**
 * @file collisions.ts
 *
 * Preloaded lookup table for ball-ball collisions.
 */

import { CollisionEncoder } from './collision-encoder'
import { DISK_RADIUS } from './constants'
import type { Disk } from './disk'

const cacheScale = 1e2
export type CachedCollision = null | [number, number, number, number] // x,y,dx,dy

// relative pos x/y, relative vel x/y -> possible collision
let cache: Array<Array<Array<Array<CachedCollision>>>> = []

export const speedDetail = 20 // half size of cache along relative vx and vy
const maxAxisSpeed = cacheScale * speedDetail
const speedToIndex = speed => Math.floor(speed * speedDetail / maxAxisSpeed)
const indexToSpeed = i => i * maxAxisSpeed / speedDetail

export const offsetDetail = 10 // hald size of cache along dx and dy
const maxOffset = 2 * DISK_RADIUS
const offsetToIndex = offset => Math.floor(offset * offsetDetail / maxOffset)
const indexToOffset = i => i * maxOffset / offsetDetail

export class Collisions {
  static get cache() { return cache }
  static get cacheSize() { return Object.keys(cache).length }

  static async loadAll() {
    try {
    // Fetch the binary blob from the URL
      const response = await fetch('/collisions/collision-cache.bin')

      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`)
      }

      // Convert the response to an ArrayBuffer
      const arrayBuffer = await response.arrayBuffer()

      // Convert the ArrayBuffer to a Uint8Array
      const intArr = new Int16Array(arrayBuffer)

      // Decode the binary data into the collision cache structure
      cache = CollisionEncoder.decode(intArr)
    }
    catch (error) {
      console.error('Error loading collision blob:', error)
      throw error
    }
  }

  static computeAll() {
    const n = 2 * offsetDetail + 1 // size of cache at top level
    for (let dxi = -offsetDetail; dxi <= offsetDetail; dxi++) {
      const dx = indexToOffset(dxi)
      const dxArr: Array<Array<Array<CachedCollision>>> = []
      cache.push(dxArr)

      for (let dyi = -offsetDetail; dyi <= offsetDetail; dyi++) {
        const dy = indexToOffset(dyi)
        const dyArr: Array<Array<CachedCollision>> = []
        dxArr.push(dyArr)
        for (let vxi = -speedDetail; vxi <= speedDetail; vxi++) {
          const vx = indexToSpeed(vxi)
          const vxArr: Array<CachedCollision> = []
          dyArr.push(vxArr)
          for (let vyi = -speedDetail; vyi <= speedDetail; vyi++) {
            const vy = indexToSpeed(vyi)
            const col = Collisions.computeCollision(dx, dy, vx, vy)
            vxArr.push(col)
            // const key = (
            //   [dxi, dyi, vxi, vyi]
            // ).join('|')
            // cache[key] = col
          }
        }
      }
      console.log(`building collisions cache (${Math.floor(100 * cache.length / n)}%)`)
    }
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
    const col = cache
      [dxi + offsetDetail]
      [dyi + offsetDetail]
      [vxi + speedDetail]
      [vyi + speedDetail]
    // const col = Collisions.computeCollision(
    //   indexToOffset(dxi), indexToOffset(dyi),
    //   indexToSpeed(vxi), indexToSpeed(vyi),
    // )

    // const col = Disk.computeCollision(dx, dy, relativeVelocityX, relativeVelocityY)
    if (!col) return
    const [cx, cy, cdx, cdy] = col
    a.x -= cx
    a.y -= cy
    b.x += cx
    b.y += cy
    a.dx -= cdx
    a.dy -= cdy
    b.dx += cdx
    b.dy += cdy
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

      return [
        Math.round(nx * separation), // dx
        Math.round(ny * separation), // dy

        -Math.round(impulse * nx), // vx
        -Math.round(impulse * ny), // vy
      ]
    }
    return null
  }
}

export function downloadCollisionBlob(
  filename: string = 'collision-cache.bin',
) {
  // Encode the cache into a binary blob
  const encodedData = CollisionEncoder.encode(cache)

  // Create a Blob object
  const blob = new Blob([encodedData as BlobPart], { type: 'application/octet-stream' })

  // Create a temporary <a> element
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename

  // Programmatically click the link to trigger the download
  document.body.appendChild(link)
  link.click()

  // Clean up the temporary link
  document.body.removeChild(link)
}
