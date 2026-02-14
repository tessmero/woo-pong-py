/**
 * @file diamond-a.ts
 *
 * Diamond pattern.
 */

import { pio4 } from 'util/math-util'
import { Pattern } from '../pattern'

export class DiamondA extends Pattern {
  static {
    Pattern.register('diamond-a', () => new DiamondA())
  }

  public override getScale(): number {
    return 1 / 20
  }

  protected override getCanvas(): HTMLCanvasElement | null {
    return createDiamondPattern()
  }
}

function createDiamondPattern(
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

  const squareSize = resolution / 6 * Math.SQRT2
  const thickness = squareSize / 8

  ctx.fillStyle = color2
  ctx.fillRect(0, 0, patternCanvas.width, patternCanvas.height)

  ctx.strokeStyle = color1
  ctx.lineWidth = thickness

  ctx.rotate(pio4)

  const x0 = -resolution
  const x1 = 2 * resolution

  let x = 0
  let y = 0
  let i = 0
  let j = 0

  function sr(shrink: number) {
    const offset = shrink * thickness / 2
    const size = squareSize - 2 * offset
    ctx.strokeRect(x + offset, y + offset, size, size)
  }

  for (x = x0; x < x1; x += squareSize) {
    j = 0
    for (y = x0; y < x1; y += squareSize) {
      if ((i + j) % 2) {
        sr(1)
        sr(5)
      }
      else {
        sr(3)
        sr(7)
      }
      j++
    }
    i++
  }

  return patternCanvas
}
