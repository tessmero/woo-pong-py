/**
 * @file fence.ts
 *
 * Fence pattern.
 */

import { Pattern } from '../pattern'

export class Fence extends Pattern {
  static {
    Pattern.register('fence', () => new Fence())
  }

  public getScale(): number {
    return 1 / 20
  }

  protected getCanvas(): HTMLCanvasElement | null {
    return createFencePattern()
  }
}

function createFencePattern(
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
  ctx.lineWidth = resolution / 40

  ctx.scale(1, 2)

  const spacing = resolution / 6
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
  const squareSize = resolution / 22
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
