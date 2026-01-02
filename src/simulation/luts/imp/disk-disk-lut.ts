/**
 * @file disk-disk-lut.ts
 *
 * Lookup table for disk-disk collisions.
 */

import { DISK_DISK_LUT_BLOB_URL, DISK_DISK_LUT_BLOB_HASH } from 'set-by-build'
import { Lut } from '../lut'
import type { Disk } from 'simulation/disk'
import { DISK_RADIUS } from 'simulation/constants'

export type DiskDiskBounce = null | [number, number, number, number] // x,y,dx,dy

const cacheScale = 1e2

export const speedDetail = 20 // half size of cache along relative vx and vy
const maxAxisSpeed = cacheScale * speedDetail
export const speedToIndex = speed => Math.floor(speed * speedDetail / maxAxisSpeed)
export const indexToSpeed = i => i * maxAxisSpeed / speedDetail

export const offsetDetail = 10 // hald size of cache along dx and dy
const maxOffset = 2 * DISK_RADIUS
export const offsetToIndex = offset => Math.floor(offset * offsetDetail / maxOffset)
export const indexToOffset = i => i * maxOffset / offsetDetail

export class DiskDiskLut extends Lut<DiskDiskBounce> {
  static {
    Lut.register('disk-disk-lut', {
      depth: 4,
      leafLength: 4,
      // detail: [
      //   offsetDetail * 2 + 1,
      //   offsetDetail * 2 + 1,
      //   speedDetail * 2 + 1,
      //   speedDetail * 2 + 1,
      // ],
      blobUrl: DISK_DISK_LUT_BLOB_URL,
      blobHash: DISK_DISK_LUT_BLOB_HASH,
      factory: () => new DiskDiskLut(),
    })
  }

  detail = [
    offsetDetail * 2 + 1,
    offsetDetail * 2 + 1,
    speedDetail * 2 + 1,
    speedDetail * 2 + 1,
  ]

  computeLeaf(index: Array<number>) {
    const dx = indexToOffset(index[0] - offsetDetail)
    const dy = indexToOffset(index[1] - offsetDetail)
    const vx = indexToSpeed(index[2] - speedDetail)
    const vy = indexToSpeed(index[3] - speedDetail)
    return computeCollision(dx, dy, vx, vy)
  }
}

export function collideDisks(a: Disk, b: Disk) {
  // index based on relative position
  const dxi = offsetToIndex(b.currentState[0] - a.currentState[0])
  const dyi = offsetToIndex(b.currentState[1] - a.currentState[1])

  if (Math.abs(dxi) > offsetDetail) {
    return // disks are not colliding
    // dxi = offsetDetail * Math.sign(dxi)
  }
  if (Math.abs(dyi) > offsetDetail) {
    return // disks are not colliding
    // dyi = offsetDetail * Math.sign(dyi)
  }

  // index based on relative velcoity
  let vxi = speedToIndex(b.currentState[2] - a.currentState[2])
  let vyi = speedToIndex(b.currentState[3] - a.currentState[3])

  if (Math.abs(vxi) > speedDetail) {
    // throw new Error(`dx ${dx} or of range (${maxAxisSpeed}) in collisions`)
    vxi = speedDetail * Math.sign(vxi)
  }
  if (Math.abs(vyi) > speedDetail) {
    // throw new Error(`dy ${dy} or of range (${maxAxisSpeed}) in collisions`)
    vyi = speedDetail * Math.sign(vyi)
  }

  const col = Lut.create('disk-disk-lut').tree[
    dxi + offsetDetail][dyi + offsetDetail][vxi + speedDetail][vyi + speedDetail]

  if (!col) return
  const [cx, cy, cdx, cdy] = col // change in pos, change in vel

  if (col.some(val => isNaN(val))) {
    throw new Error('collisions has nan bounce value')
  }

  a.nextState[0] -= cx
  a.nextState[1] -= cy
  b.nextState[0] += cx
  b.nextState[1] += cy
  a.nextState[2] -= cdx
  a.nextState[3] -= cdy
  b.nextState[2] += cdx
  b.nextState[3] += cdy
}

function computeCollision(dx, dy, relativeVelocityX, relativeVelocityY): DiskDiskBounce {
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
