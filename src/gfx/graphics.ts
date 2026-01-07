/**
 * @file graphics.ts
 *
 * Routines for drawing the air hockey scene on the
 * canvas 2d graphics context.
 */

import type { Barrier } from '../simulation/barrier'
import type { Obstacle } from '../simulation/obstacle'
import { drawDisk } from './disk-gfx'

export class Graphics {
  static drawDisk = drawDisk

  static drawFinish(ctx: CanvasRenderingContext2D, finish: Barrier) {
    ctx.fillStyle = 'rgba(0,255,0,0.5)'
    ctx.fillRect(...finish.xywh)
  }

  static drawBarrier(ctx: CanvasRenderingContext2D, barrier: Barrier) {
    if (barrier.isHidden) return
    ctx.fillStyle = 'black'
    ctx.fillRect(...barrier.xywh)
  }

  static drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
    ctx.fillStyle = 'black'

    const { isHidden, pos, points, boundingRect, collisionRect } = obstacle

    if (isHidden) return

    // // debug
    // ctx.strokeStyle = 'red'
    // ctx.lineWidth = 1 * VALUE_SCALE
    // ctx.strokeRect(...boundingRect)
    // ctx.strokeStyle = 'green'
    // ctx.lineWidth = 1 * VALUE_SCALE
    // ctx.strokeRect(...collisionRect)

    ctx.beginPath()
    for (const [x, y] of points) {
      ctx.lineTo(pos[0] + x, pos[1] + y)
    }
    ctx.closePath()

    ctx.fill()
  }
}
