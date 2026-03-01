
/**
 * @file disk-disk-lut.ts
 *
 * Lookup table for disk-disk collisions.
 */

import { LUT_BLOBS } from 'set-by-build'
import { Lut, i16 } from '../lut'
import type { LeafSchema, LeafValues } from '../lut'
import type { Disk } from 'simulation/disk'
import { DISK_RADIUS, INT16_MAX, INT16_MIN } from 'simulation/constants'
import { playImpact } from 'audio/collision-sounds'

let _ddlCache: DiskDiskLut | null = null
function _getDdl() {
  return _ddlCache ??= Lut.create('disk-disk-lut') as DiskDiskLut
}

const cacheScale = 1e2

export const speedDetail = 20 // half size of cache along relative vx and vy
const maxAxisSpeed = cacheScale * speedDetail
export const speedToIndex = speed => Math.floor(speed * speedDetail / maxAxisSpeed)
export const indexToSpeed = i => i * maxAxisSpeed / speedDetail

export const offsetDetail = 10 // hald size of cache along dx and dy
const maxOffset = 2 * DISK_RADIUS
export const offsetToIndex = offset => Math.floor(offset * offsetDetail / maxOffset)
export const indexToOffset = i => i * maxOffset / offsetDetail

const ddlSchema: LeafSchema = [i16('cx'), i16('cy'), i16('cdx'), i16('cdy')]

export class DiskDiskLut extends Lut {
  static {
    Lut.register('disk-disk-lut', {
      depth: 4,
      schema: ddlSchema,
      factory: () => new DiskDiskLut(),
    })
  }

  schema = ddlSchema
  blobUrl = LUT_BLOBS.DISK_DISK_LUT.url
  blobHash = LUT_BLOBS.DISK_DISK_LUT.hash
  detail = [
    offsetDetail * 2 + 1,
    offsetDetail * 2 + 1,
    speedDetail * 2 + 1,
    speedDetail * 2 + 1,
  ]

  // Antipodal symmetry: collision(-dx,-dy,-vx,-vy) = -collision(dx,dy,vx,vy)
  private readonly centers = [offsetDetail, offsetDetail, speedDetail, speedDetail]

  override get symmetric(): boolean { return true }

  override isCanonical(index: Array<number>): boolean {
    for (let i = 0; i < index.length; i++) {
      const ri = index[i] - this.centers[i]
      if (ri < 0) return true // lexicographically below center
      if (ri > 0) return false // lexicographically above center
    }
    return true // center point itself
  }

  override mirrorIndex(index: Array<number>): Array<number> {
    return index.map((v, i) => 2 * this.centers[i] - v)
  }

  computeLeaf(index: Array<number>): LeafValues | null {
    const dx = indexToOffset(index[0] - offsetDetail)
    const dy = indexToOffset(index[1] - offsetDetail)
    const vx = indexToSpeed(index[2] - speedDetail)
    const vy = indexToSpeed(index[3] - speedDetail)
    return computeCollision(dx, dy, vx, vy)
  }
}

function computeCollision(dx, dy, relativeVelocityX, relativeVelocityY): LeafValues | null {
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

    const result = {
      cx: Math.round(nx * separation),
      cy: Math.round(ny * separation),
      cdx: -Math.round(impulse * nx),
      cdy: -Math.round(impulse * ny),
    }

    for (const value of Object.values(result)) {
      if (value < INT16_MIN || value > INT16_MAX) {
        return null // adjustment would be outside of encode-able range
      }
    }

    return result
  }
  return null
}

export function collideDisks(a: Disk, b: Disk): boolean {
  // index based on relative position
  const dxi = offsetToIndex(b.currentState.x - a.currentState.x)
  const dyi = offsetToIndex(b.currentState.y - a.currentState.y)

  if (Math.abs(dxi) > offsetDetail) {
    return false // disks are not colliding
  }
  if (Math.abs(dyi) > offsetDetail) {
    return false // disks are not colliding
  }

  // index based on relative velocity
  let vxi = speedToIndex(b.currentState.dx - a.currentState.dx)
  let vyi = speedToIndex(b.currentState.dy - a.currentState.dy)

  if (Math.abs(vxi) > speedDetail) {
    vxi = speedDetail * Math.sign(vxi)
  }
  if (Math.abs(vyi) > speedDetail) {
    vyi = speedDetail * Math.sign(vyi)
  }

  const ddl = _getDdl()
  const cellIdx = ddl.flatIndex(
    dxi + offsetDetail, dyi + offsetDetail, vxi + speedDetail, vyi + speedDetail)

  if (!ddl.hasLeafAt(cellIdx)) return false // disks are not colliding (near-miss)
  const cx = ddl.get(cellIdx, 'cx')
  const cy = ddl.get(cellIdx, 'cy')
  const cdx = ddl.get(cellIdx, 'cdx')
  const cdy = ddl.get(cellIdx, 'cdy')

  a.nextState.x -= cx
  a.nextState.y -= cy
  b.nextState.x += cx
  b.nextState.y += cy
  a.nextState.dx -= cdx
  a.nextState.dy -= cdy
  b.nextState.dx += cdx
  b.nextState.dy += cdy

  playImpact(a.nextState, true, 2 * Math.hypot(cdx, cdy))

  return true
}


// Self-contained Python implementation of collideDisks and helpers, as a string for export
export const PY_COLLIDE_DISKS = `
import numpy as np

# Assumptions:
# - DISK_DISK_LUT.lut is a numpy array of shape (21, 21, 41, 41, 4)
# - DISK_RADIUS is defined
# - Each disk has .currentState and .nextState, each with x, y, dx, dy

DISK_RADIUS = ${DISK_RADIUS}
OFFSET_DETAIL = ${offsetDetail}
SPEED_DETAIL = ${speedDetail}
MAX_OFFSET = 2 * DISK_RADIUS
MAX_AXIS_SPEED = 1e2 * SPEED_DETAIL

def offset_to_index(offset):
  return int(np.floor(offset * OFFSET_DETAIL / MAX_OFFSET))

def speed_to_index(speed):
  return int(np.floor(speed * SPEED_DETAIL / MAX_AXIS_SPEED))

def collide_disks(a, b, DISK_DISK_LUT):
  # index based on relative position
  dxi = offset_to_index(b.currentState.x - a.currentState.x)
  dyi = offset_to_index(b.currentState.y - a.currentState.y)

  if abs(dxi) > OFFSET_DETAIL:
    return False
  if abs(dyi) > OFFSET_DETAIL:
    return False

  # index based on relative velocity
  vxi = speed_to_index(b.currentState.dx - a.currentState.dx)
  vyi = speed_to_index(b.currentState.dy - a.currentState.dy)

  if abs(vxi) > SPEED_DETAIL:
    vxi = SPEED_DETAIL * np.sign(vxi)
  if abs(vyi) > SPEED_DETAIL:
    vyi = SPEED_DETAIL * np.sign(vyi)

  # Shift indices to [0, size)
  dxi += OFFSET_DETAIL
  dyi += OFFSET_DETAIL
  vxi += SPEED_DETAIL
  vyi += SPEED_DETAIL

  # Check bounds
  if not (0 <= dxi < 2*OFFSET_DETAIL+1 and 0 <= dyi < 2*OFFSET_DETAIL+1 and 0 <= vxi < 2*SPEED_DETAIL+1 and 0 <= vyi < 2*SPEED_DETAIL+1):
    return False

  cell = DISK_DISK_LUT.lut[dxi, dyi, vxi, vyi]
  cx, cy, cdx, cdy = cell

  if np.isnan(cx):
    return False  # no collision (near-miss)

  a.nextState.x -= cx
  a.nextState.y -= cy
  b.nextState.x += cx
  b.nextState.y += cy
  a.nextState.dx -= cdx
  a.nextState.dy -= cdy
  b.nextState.dx += cdx
  b.nextState.dy += cdy
  
  return True
`