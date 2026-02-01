/**
 * @file disk-gfx-util.ts
 *
 * Disk graphics.
 */

import { CLICKABLE_RADIUS, DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'
import { tailLength, type Disk } from 'simulation/disk'
import type { Vec2 } from 'util/math-util'
import { twopi } from 'util/math-util'
import { CROWN_FILL } from './graphics'

const maxTailDistance = 3 * DISK_RADIUS

const isShowingTails = true

export function drawDiskHalo(
  ctx: CanvasRenderingContext2D, disk: Disk,
) {
  // const [cx, cy, _dx, _dy] = disk.currentState
  const [cx, cy] = disk.interpolatedPos

  ctx.strokeStyle = 'black'
  ctx.lineWidth = VALUE_SCALE * 0.5
  ctx.beginPath()
  ctx.arc(cx, cy, CLICKABLE_RADIUS, 0, twopi)
  ctx.stroke()
}

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
  const [cx, cy] = disk.interpolatedPos
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
  ctx.lineWidth = .4 * VALUE_SCALE
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export function drawDisk(
  ctx: CanvasRenderingContext2D, disk: Disk,
) {
  // const [cx, cy, _dx, _dy] = disk.currentState
  const [cx, cy] = disk.interpolatedPos

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
  ctx.arc(cx, cy, DISK_RADIUS * (1 - i * tailShrinkRatio / tailLength), 0, twopi)
  if (isShowingTails) {
    for (const [x, y, distance] of disk.history()) {
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
  ctx.strokeStyle = 'black'
  ctx.stroke()
  ctx.fillStyle = PATTERN_FILLERS[disk.pattern]
  ctx.imageSmoothingEnabled = false
  ctx.fill()
}

export const DISK_PATTERNS = [
  'white', 'black', 'v-stripe', 'h-stripe', 'checkered', 'hex-a', 'hex-b',
] as const

export type DiskPattern = (typeof DISK_PATTERNS)[number]

function createHexDotsPattern(
  dotColor = '#000', bgColor = '#fff',
  dotRadius = 12, spacing = 32,
) {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d') as CanvasRenderingContext2D
  const h = spacing * Math.sqrt(3) / 2
  c.width = spacing * 2
  c.height = h * 2
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, c.width, c.height)
  for (let r = 0; r < 2; r++) {
    for (let q = 0; q < 2; q++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const x = q * spacing + (r * spacing) / 2 + dx * c.width
          const y = r * h + dy * c.height
          ctx.beginPath()
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
          ctx.fillStyle = dotColor
          ctx.fill()
        }
      }
    }
  }
  return c
  // const p = ctx.createPattern(c, 'repeat') as CanvasPattern
  // p.setTransform(new DOMMatrix().scale(VALUE_SCALE / 10, VALUE_SCALE / 10))
  // return p
}

function createHorizontalStripePattern(
  stripeColor = '#000', bgColor = '#fff',
  stripeHeight = 1, gapHeight = 1,
) {
  if (typeof document === 'undefined') return null
  const patternCanvas = document.createElement('canvas')
  const totalHeight = stripeHeight + gapHeight

  patternCanvas.width = 1 // Only need 1px width for horizontal stripes
  patternCanvas.height = totalHeight

  const pctx = patternCanvas.getContext('2d') as CanvasRenderingContext2D

  // Background (gap)
  pctx.fillStyle = bgColor
  pctx.fillRect(0, 0, patternCanvas.width, patternCanvas.height)

  // Stripe at the top
  pctx.fillStyle = stripeColor
  pctx.fillRect(0, 0, patternCanvas.width, stripeHeight)

  return patternCanvas
  // const pattern = pctx.createPattern(patternCanvas, 'repeat') as CanvasPattern
  // pattern.setTransform(new DOMMatrix().scale(VALUE_SCALE, VALUE_SCALE))
  // return pattern
}

// NEW: vertical stripes for v-stripe
function createVerticalStripePattern(
  stripeColor = '#000',
  bgColor = '#fff',
  stripeWidth = 1,
  gapWidth = 1,
) {
  if (typeof document === 'undefined') return null
  const patternCanvas = document.createElement('canvas')
  const totalWidth = stripeWidth + gapWidth

  // Only need full pattern width; 1px height is enough
  patternCanvas.width = totalWidth
  patternCanvas.height = 1

  const pctx = patternCanvas.getContext('2d') as CanvasRenderingContext2D

  // Background (gap)
  pctx.fillStyle = bgColor
  pctx.fillRect(0, 0, patternCanvas.width, patternCanvas.height)

  // Stripe on the left
  pctx.fillStyle = stripeColor
  pctx.fillRect(0, 0, stripeWidth, patternCanvas.height)

  return patternCanvas
  // const pattern = pctx.createPattern(patternCanvas, 'repeat') as CanvasPattern
  // pattern.setTransform(new DOMMatrix().scale(VALUE_SCALE, VALUE_SCALE))
  // return pattern
}

function createCheckeredPattern(
  color1 = '#000',
  color2 = '#fff',
  squareSize = 512 / 8,
  resolution = 512,
) {
  if (typeof document === 'undefined') return null
  // Create a larger canvas for higher resolution
  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = resolution
  patternCanvas.height = resolution
  const pctx = patternCanvas.getContext('2d') as CanvasRenderingContext2D

  pctx.fillStyle = 'white'
  pctx.fillRect(0, 0, patternCanvas.width, patternCanvas.height)

  // Fill the canvas with rotated checkers
  // Calculate the number of squares needed to cover the diagonal
  const numSquares = Math.ceil(resolution / squareSize) * 2
  for (let i = -numSquares; i < numSquares; i++) {
    for (let j = -numSquares; j < numSquares; j++) {
      // Checkerboard pattern: alternate colors
      const isColor1 = (i + j) % 2 === 0
      pctx.save()
      // Center the rotation
      pctx.translate(resolution / 2, resolution / 2)
      pctx.rotate(Math.PI / 4)
      // Draw the square
      pctx.fillStyle = isColor1 ? color1 : color2

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const s = Math.random()
          pctx.fillRect(
            ((i + 2 * dx) * squareSize) - resolution / 2,
            ((j + 2 * dy) * squareSize) - resolution / 2,
            squareSize * s,
            squareSize * s,
          )
        }
      }
      pctx.restore()
    }
  }
  return patternCanvas
  // const pattern = pctx.createPattern(patternCanvas, 'repeat') as CanvasPattern
  // pattern.setTransform(new DOMMatrix().scale(VALUE_SCALE / 50, VALUE_SCALE / 50))
  // return pattern
}

export const PATTERN_CANVASES = {
  'v-stripe': createVerticalStripePattern(),
  'h-stripe': createHorizontalStripePattern(),
  'checkered': createCheckeredPattern(),
  'hex-a': createHexDotsPattern('#000', '#fff'),
  'hex-b': createHexDotsPattern('#fff', '#000', 4),
} as const satisfies Partial<Record<DiskPattern, HTMLCanvasElement | null>>

export const PATTERN_SCALES: Record<DiskPattern, number> = {
  'black': VALUE_SCALE,
  'white': VALUE_SCALE,
  'h-stripe': VALUE_SCALE,
  'v-stripe': VALUE_SCALE,
  'checkered': VALUE_SCALE / 50,
  'hex-a': VALUE_SCALE / 10,
  'hex-b': VALUE_SCALE / 10,
}

export const PATTERN_FILLERS: Record<DiskPattern, CanvasPattern | string> = {
  'black': 'black',
  'white': 'white',
  'h-stripe': buildPattern('h-stripe'),
  'v-stripe': buildPattern('v-stripe'),
  'checkered': buildPattern('checkered'),
  'hex-a': buildPattern('hex-a'),
  'hex-b': buildPattern('hex-b'),
}

export function buildPattern(
  key: DiskPattern, scale = 1,
): CanvasPattern | string {
  const cvs = PATTERN_CANVASES[key]
  if (!cvs) return 'white'
  const pctx = cvs.getContext('2d') as CanvasRenderingContext2D
  const pattern = pctx.createPattern(cvs, 'repeat') as CanvasPattern
  scale *= PATTERN_SCALES[key]
  pattern.setTransform(new DOMMatrix().scale(scale, scale))
  return pattern
}
