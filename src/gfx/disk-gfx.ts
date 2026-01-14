/**
 * @file disk-gfx.ts
 *
 * Disk graphics.
 */

import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'
import { tailLength, type Disk } from 'simulation/disk'
import { twopi } from 'util/math-util'

const maxTailDistance = 3 * DISK_RADIUS

const isShowingTails = true

export function drawDisk(
  ctx: CanvasRenderingContext2D, disk: Disk,
  isSelected = false, isWinner = false,
) {
  // const [cx, cy, _dx, _dy] = disk.currentState
  const [cx, cy] = disk.interpolatedPos

  const edgeRad = VALUE_SCALE * 0.5 * (isSelected ? 5 : 1)
  const tailShrinkRatio = 2
  // ctx.strokeStyle = 'black'
  // ctx.beginPath()
  // ctx.arc(cx, cy, DISK_RADIUS, 0, twopi)
  // ctx.stroke()

  // draw outline
  ctx.fillStyle = 'black'
  ctx.beginPath()
  let i = 0
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, DISK_RADIUS * (1 - i * tailShrinkRatio / tailLength), 0, twopi)
  if (isShowingTails) {
    for (const [x, y, distance] of disk.history()) {
      // draw point in tail
      ctx.moveTo(x, y)
      const rad = DISK_RADIUS * (1 - (Math.min(distance, maxTailDistance) / maxTailDistance))
      ctx.arc(x, y, rad, 0, twopi)
      i++
    }
  }
  ctx.lineWidth = edgeRad
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
  dotRadius = 12, spacing = 32, resolution = 128,
) {
  if (typeof document === 'undefined') return bgColor
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
  const p = ctx.createPattern(c, 'repeat') as CanvasPattern
  p.setTransform(new DOMMatrix().scale(VALUE_SCALE / 10, VALUE_SCALE / 10))
  return p
}

function createHorizontalStripePattern(
  stripeColor = '#000', bgColor = '#fff',
  stripeHeight = 1, gapHeight = 1,
) {
  if (typeof document === 'undefined') return 'white'
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

  const pattern = pctx.createPattern(patternCanvas, 'repeat') as CanvasPattern
  pattern.setTransform(new DOMMatrix().scale(VALUE_SCALE, VALUE_SCALE))
  return pattern
}

// NEW: vertical stripes for v-stripe
function createVerticalStripePattern(
  stripeColor = '#000',
  bgColor = '#fff',
  stripeWidth = 1,
  gapWidth = 1,
) {
  if (typeof document === 'undefined') return 'white'
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

  const pattern = pctx.createPattern(patternCanvas, 'repeat') as CanvasPattern
  pattern.setTransform(new DOMMatrix().scale(VALUE_SCALE, VALUE_SCALE))
  return pattern
}

function createCheckeredPattern(
  color1 = '#000',
  color2 = '#fff',
  squareSize = 512/8,
  resolution = 512,
) {
  if (typeof document === 'undefined') return 'white'
  // Create a larger canvas for higher resolution
  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = resolution
  patternCanvas.height = resolution
  const pctx = patternCanvas.getContext('2d') as CanvasRenderingContext2D

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
        ((i+2*dx) * squareSize) - resolution / 2,
        ((j+2*dy) * squareSize) - resolution / 2,
        squareSize * s,
        squareSize * s
      )
    }
  }
      pctx.restore()
    }
  }
  const pattern = pctx.createPattern(patternCanvas, 'repeat') as CanvasPattern
  pattern.setTransform(new DOMMatrix().scale(VALUE_SCALE / 50, VALUE_SCALE / 50))
  return pattern
}

const PATTERN_FILLERS: Record<DiskPattern, CanvasPattern | string> = {
  'black': 'black',
  'white': 'white',
  'v-stripe': createVerticalStripePattern(),
  'h-stripe': createHorizontalStripePattern(),
  'checkered': createCheckeredPattern(),
  'hex-a': createHexDotsPattern('#000', '#fff'),
  'hex-b': createHexDotsPattern('#fff', '#000', 4),
}
