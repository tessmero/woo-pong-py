/**
 * @file disk-gfx-util.ts
 *
 * Disk graphics.
 */

import { CLICKABLE_RADIUS, DISK_RADIUS, TAIL_STEPS, VALUE_SCALE } from 'simulation/constants'
import { type Disk } from 'simulation/disk'
import type { Vec2 } from 'util/math-util'
import { twopi } from 'util/math-util'
import { CROWN_FILL } from './graphics'
import { SimHistory } from 'simulation/sim-short-history'
import { Pattern } from './patterns/pattern'

const maxTailDistance = 3 * DISK_RADIUS

const isShowingTails = true

export function drawDiskHoverHalo(
  ctx: CanvasRenderingContext2D, disk: Disk,
) {
  // const [cx, cy, _dx, _dy] = disk.currentState
  const [cx, cy] = disk.displayPos

  ctx.strokeStyle = 'black'
  ctx.lineWidth = VALUE_SCALE * 0.5
  ctx.beginPath()
  ctx.arc(cx, cy, CLICKABLE_RADIUS, 0, twopi)
  ctx.stroke()
}

export function drawDiskFollowHalo(
  ctx: CanvasRenderingContext2D, disk: Disk,
) {
  // const [cx, cy, _dx, _dy] = disk.currentState
  const [cx, cy] = disk.displayPos

  // compute dash that lines up with one circum
  const dashCycles = 7
  const dashShrink = 0.2
  const circumference = 2 * Math.PI * CLICKABLE_RADIUS
  const baseLength = circumference / dashCycles
  const dashLength = baseLength * dashShrink
  const gapLength = baseLength * (1 - dashShrink)
  _dash[0] = dashLength
  _dash[1] = gapLength
  ctx.setLineDash(_dash)
  ctx.lineDashOffset = (baseLength * performance.now() * 1e-3) % circumference
  ctx.lineCap = 'round'
  const thick = VALUE_SCALE * 1

  ctx.strokeStyle = 'black'
  ctx.lineWidth = VALUE_SCALE * 0.5 + thick
  ctx.beginPath()
  ctx.arc(cx, cy, CLICKABLE_RADIUS, 0, twopi)
  ctx.stroke()

  ctx.strokeStyle = 'red'
  ctx.lineWidth = thick
  ctx.beginPath()
  ctx.arc(cx, cy, CLICKABLE_RADIUS, 0, twopi)
  ctx.stroke()

  ctx.setLineDash(_noDash)
}

const _dash = [1, 1]
const _noDash = []

/**
 * Draws a crown shape sitting on top of the disk halo.
 * The bottom edge of the crown follows the halo arc, and the top is a flat line above the halo.
 */

// Cache for the static geometry of the crown (angles and radii, not positions)
let diskCrownCache: {
  startAngle: number
  endAngle: number
  innerR: number
  outerR: number
  zigzagCount: number
  zigzagDepth: number
  outerPoints: Array<Vec2>
} | null = null

function getDiskCrownCache() {
  if (diskCrownCache) return diskCrownCache
  const haloRadius = CLICKABLE_RADIUS
  const crownHeight = haloRadius * 0.5
  const crownArcAngle = Math.PI / 4 // 90 degrees
  const startAngle = -Math.PI / 2 - crownArcAngle / 2
  const endAngle = -Math.PI / 2 + crownArcAngle / 2
  const innerR = haloRadius
  const outerR = haloRadius + crownHeight
  const zigzagCount = 7
  const zigzagDepth = crownHeight * 0.2
  const outerPoints: Array<Vec2> = []
  for (let i = 0; i < zigzagCount; i++) {
    const t = i / (zigzagCount - 1)
    const angle = startAngle + t * (endAngle - startAngle)
    const isHigh = i % 2 === 0
    const r = isHigh ? outerR : (outerR - zigzagDepth)
    outerPoints.push([r * Math.cos(angle), r * Math.sin(angle)])
  }
  diskCrownCache = {
    startAngle,
    endAngle,
    innerR,
    outerR,
    zigzagCount,
    zigzagDepth,
    outerPoints,
  }
  return diskCrownCache
}

export function drawDiskCrown(
  ctx: CanvasRenderingContext2D, disk: Disk,
) {
  const [cx, cy] = disk.displayPos
  const cache = getDiskCrownCache()

  ctx.save()
  ctx.beginPath()
  // Start at left of bottom arc
  ctx.arc(cx, cy, cache.innerR, cache.startAngle, cache.endAngle, false)
  // Draw zigzag along outer edge, right to left
  for (let i = cache.zigzagCount - 1; i >= 0; i--) {
    const pt = cache.outerPoints[i]
    const x = cx + pt[0]
    const y = cy + pt[1]
    ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = CROWN_FILL // gold color
  ctx.strokeStyle = 'black' // darker gold outline
  ctx.lineWidth = 0.4 * VALUE_SCALE
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export function drawDisk(
  ctx: CanvasRenderingContext2D, diskIndex: number, disk: Disk, stroke = 'black', fill?: string,
) {
  // const [cx, cy, _dx, _dy] = disk.currentState
  const [cx, cy] = disk.displayPos

  const edgeRad = VALUE_SCALE * 0.8
  const tailShrinkRatio = 2
  // ctx.strokeStyle = 'black'
  // ctx.beginPath()
  // ctx.arc(cx, cy, DISK_RADIUS, 0, twopi)
  // ctx.stroke()

  // draw outline
  ctx.beginPath()
  let i = 0
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, DISK_RADIUS * (1 - i * tailShrinkRatio / TAIL_STEPS), 0, twopi)
  if (isShowingTails) {
    for (const [x, y, distance] of SimHistory.tail(diskIndex)) {
      if (x === -1) continue

      // draw point in tail
      const rad = DISK_RADIUS * (1 - (Math.min(distance, maxTailDistance) / maxTailDistance))

      if (rad > 0) {
        ctx.moveTo(x, y)
        ctx.arc(x, y, rad, 0, twopi)
      }
      i++
    }
  }
  ctx.lineWidth = edgeRad
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = stroke
  ctx.stroke()
  ctx.fillStyle = fill ?? Pattern.getFillStyle(disk.pattern)
  ctx.imageSmoothingEnabled = false
  ctx.fill()
}
