/**
 * @file graphics.ts
 *
 * Routines for drawing the air hockey scene on the
 * canvas 2d graphics context.
 */

import type { Barrier } from './barrier'
import { Disk } from './disk'
import type { Obstacle } from './obstacle'

export class Graphics {
  /**
   * Draw a sliding disk.
   * @param {object} ctx The graphics context
   * @param {object} disk The Disk instance to draw
   */
  static drawDisk(ctx: CanvasRenderingContext2D, disk: Disk) {
    const { x, y } = disk
    const angle = 0// disk.getAngle();

    ctx.strokeStyle = 'black'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.arc(x, y, Disk.radius, angle, angle + Math.PI * 2)
    ctx.stroke()
  }

  static drawBarrier(ctx: CanvasRenderingContext2D, barrier: Barrier) {
    ctx.fillStyle = 'black'
    ctx.fillRect(...barrier.xywh)
  }

  /**
   * Draw a solid obstacle.
   * @param {object} ctx The graphics context
   * @param {object} obstacle The Obstacle instance to draw
   */
  static drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
    ctx.fillStyle = 'black'

    ctx.beginPath()
    for (const { x, y } of obstacle.getVertices()) {
      ctx.lineTo(x, y)
    }
    ctx.closePath()

    ctx.fill()
  }
}
