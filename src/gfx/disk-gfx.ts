/**
 * @file disk-gfx.ts
 *
 * Disk graphics.
 */

import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'
import { tailLength, type Disk } from 'simulation/disk'
import { twopi } from 'util/math-util'

const maxTailDistance = 10 * DISK_RADIUS

const isShowingTails = false

export function drawDisk(
  ctx: CanvasRenderingContext2D, disk: Disk,
  isSelected = false, isWinner = false,
) {
  // const [cx, cy, _dx, _dy] = disk.currentState
  const [cx, cy] = disk.interpolatedPos

  const edgeRad = VALUE_SCALE * 0.1 * (isSelected ? 2 : 1)
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
  ctx.arc(cx, cy, DISK_RADIUS * (1 - i * tailShrinkRatio / tailLength) + edgeRad, 0, twopi)
  if (isShowingTails) {
    for (const [x, y, distance] of disk.history()) {
      // draw point in tail
      ctx.moveTo(x, y)
      const rad = DISK_RADIUS * (1 - (Math.min(distance, maxTailDistance) / maxTailDistance)) + edgeRad
      ctx.arc(x, y, rad, 0, twopi)
      i++
    }
  }
  ctx.lineWidth = edgeRad
  ctx.stroke()

  // fill disk
  ctx.fillStyle = 'white'
  if (isWinner) {
    ctx.fillStyle = 'black'
  }
  i = 0
  const headRadius = Math.max(0, DISK_RADIUS * (1 - i * tailShrinkRatio / tailLength) - edgeRad)
  fillDiskPattern(ctx, cx, cy, headRadius, disk.pattern)
  if (isShowingTails) {
    for (const [x, y, distance] of disk.history()) {
    // draw point in tail
      const tailRadius = Math.max(0,
        DISK_RADIUS * (1 - (Math.min(distance, maxTailDistance) / maxTailDistance)) - edgeRad,
      )
      fillDiskPattern(ctx, x, y, tailRadius, disk.pattern)
      i++
    }
  }
//   ctx.fill()
}

export const DISK_PATTERNS = [
  'white', 'black', 'v-stripe', 'h-stripe',
] as const

export type DiskPattern = (typeof DISK_PATTERNS)[number]

type Filler = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
) => void

const stripeThickness = DISK_RADIUS / 2

function createHorizontalStripePattern(
  stripeColor = '#000', bgColor = '#fff', 
  stripeHeight = 1 * VALUE_SCALE, gapHeight = 1 * VALUE_SCALE
) {
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

  // Use this canvas as a repeating pattern
  return pctx.createPattern(patternCanvas, 'repeat') as CanvasPattern
}


// NEW: vertical stripes for v-stripe
function createVerticalStripePattern(
  stripeColor = '#000',
  bgColor = '#fff',
  stripeWidth = 1 * VALUE_SCALE,
  gapWidth = 1 * VALUE_SCALE,
) {
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

  return pctx.createPattern(patternCanvas, 'repeat') as CanvasPattern
}


const PATTERN_FILLERS: Record<DiskPattern, CanvasPattern | string> = {
  'black': 'black',
  'white': 'white',
  'v-stripe': createVerticalStripePattern(),
  'h-stripe': createHorizontalStripePattern(),
}

function fillDiskPattern(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
  pattern: DiskPattern,
) {
    ctx.fillStyle = PATTERN_FILLERS[pattern]
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.arc(x, y, radius, 0, twopi)
    ctx.fill()
  
}
