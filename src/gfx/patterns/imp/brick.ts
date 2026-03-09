/**
 * @file brick.ts
 *
 * Brick pattern.
 */

import { Pattern } from '../pattern'
import { makeCanvas } from '../pattern-util'

export class Brick extends Pattern {
  static {
    Pattern.register('brick', () => new Brick())
  }

  public override getScale(): number {
    return 1 / 20
  }

  protected override getCanvas(): HTMLCanvasElement | null {
    return createBrickPattern()
  }
}

function createBrickPattern(
  color1 = '#000',
  color2 = '#fff',
  resolution = 512,
) {
  const patternCanvas = makeCanvas(resolution, resolution)
  const ctx = patternCanvas.getContext('2d') as CanvasRenderingContext2D

  const squareSize = resolution / 10
  const thickness = resolution / 50

  ctx.fillStyle = color2
  ctx.fillRect(0, 0, patternCanvas.width, patternCanvas.height)

  ctx.strokeStyle = color1
  ctx.lineWidth = thickness

  //   ctx.rotate(pio4)

  const x0 = -resolution
  const x1 = 2 * resolution

  let x = 0
  let y = 0
  let i = 0
  let j = 0

  function brick() {
    const sizeY = squareSize
    const sizeX = 2 * squareSize
    ctx.strokeRect(x, y, sizeX, sizeY)
  }

  for (x = x0; x < x1; x += squareSize) {
    j = 0
    for (y = x0; y < x1; y += squareSize) {
      if (i % 2 === j % 2) {
        brick()
      }
      j++
    }
    i++
  }

  return patternCanvas
}
