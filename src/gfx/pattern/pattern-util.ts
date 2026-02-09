/**
 * @file pattern-util.ts
 *
 * Pattern util.
 */

import type { PatternName } from 'imp-names'
import { Pattern } from './pattern'
import { VALUE_SCALE } from 'simulation/constants'

export function buildFillStyle(
  name: PatternName,
  cvs: HTMLCanvasElement | null,
  scaleMult = 1,
): CanvasPattern | string {
  if (!cvs) return name

  const pattern = Pattern.create(name)
  const scale = scaleMult * VALUE_SCALE * pattern.getScale()

  const pctx = cvs.getContext('2d') as CanvasRenderingContext2D
  const result = pctx.createPattern(cvs, 'repeat') as CanvasPattern
  result.setTransform(new DOMMatrix().scale(scale, scale))
  return result
}

export function createHexDotsPattern(
  dotColor = '#000', bgColor = '#fff',
  dotRadius = 240, spacing = 640,
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

export function createHorizontalStripePattern(
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
export function createVerticalStripePattern(
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

export function createCheckeredPattern(
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

export function createFencePattern(
  color1 = '#000',
  color2 = '#fff',
  resolution = 512,
) {
  if (typeof document === 'undefined') return null
  // Create a larger canvas for higher resolution
  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = resolution
  patternCanvas.height = resolution
  const ctx = patternCanvas.getContext('2d') as CanvasRenderingContext2D

  ctx.fillStyle = color2
  ctx.fillRect(0, 0, patternCanvas.width, patternCanvas.height)

  ctx.strokeStyle = color1
  ctx.lineWidth = resolution / 30

  const spacing = resolution / 5
  const slopes = [-1, 1]
  const y0 = 0
  const y1 = resolution
  // Draw diagonal lines
  for (let x = -resolution; x < 2 * resolution; x += spacing) {
    for (const slope of slopes) {
      const x0 = x - slope * resolution / 2
      const x1 = x + slope * resolution / 2
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
    }
  }
  ctx.stroke()

  // fill squares at intersection points
  const squareSize = resolution / 17
  ctx.fillStyle = 'black'
  for (let xA = -resolution; xA < 2 * resolution; xA += spacing) {
    for (let xB = -resolution; xB < 2 * resolution; xB += spacing) {
      const x = (xA + xB) / 2
      const y = (xA - xB + resolution) / 2
      ctx.fillRect(x - squareSize / 2, y - squareSize / 2, squareSize, squareSize)
    }
  }

  return patternCanvas
}
