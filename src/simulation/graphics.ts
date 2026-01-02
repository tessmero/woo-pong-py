/**
 * @file graphics.ts
 *
 * Routines for drawing the air hockey scene on the
 * canvas 2d graphics context.
 */

import { twopi } from 'util/math-util'
import type { Barrier } from './barrier'
import { DISK_RADIUS, valueScale } from './constants'
import { tailLength, type Disk } from './disk'
import type { Obstacle } from './obstacle'

export class Graphics {
  /**
   * Draw a sliding disk.
   * @param {object} ctx The graphics context
   * @param {object} disk The Disk instance to draw
   */
  static drawDisk(ctx: CanvasRenderingContext2D, disk: Disk) {
    const [cx, cy, _dx, _dy] = disk.currentState

    // ctx.strokeStyle = 'black'
    // ctx.beginPath()
    // ctx.arc(cx, cy, DISK_RADIUS, 0, twopi)
    // ctx.stroke()

    ctx.fillStyle = 'black'
    ctx.beginPath()
    let i = 0
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, DISK_RADIUS * (1 - i / tailLength / 2), 0, twopi)
    for (const [x, y] of disk.history()) {
      // draw point in tail
      ctx.moveTo(x, y)
      ctx.arc(x, y, DISK_RADIUS * (1 - i / tailLength / 2), 0, twopi)
      i++
    }
    ctx.fill()

    const edgeThickness = valueScale * 1
    ctx.fillStyle = 'white'
    ctx.beginPath()
    i = 0
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, Math.max(0, DISK_RADIUS * (1 - i / tailLength / 2) - edgeThickness), 0, twopi)
    for (const [x, y] of disk.history()) {
      // draw point in tail
      ctx.moveTo(x, y)
      ctx.arc(x, y, Math.max(0, DISK_RADIUS * (1 - i / tailLength / 2) - edgeThickness), 0, twopi)
      i++
    }
    ctx.fill()
  }

  static drawBarrier(ctx: CanvasRenderingContext2D, barrier: Barrier) {
    ctx.fillStyle = 'black'
    ctx.fillRect(...barrier.xywh)
  }

  static drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
    ctx.fillStyle = 'black'

    const { pos, points, boundingRect, collisionRect } = obstacle

    // debug
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 1 * valueScale
    ctx.strokeRect(...boundingRect)
    ctx.strokeStyle = 'green'
    ctx.lineWidth = 1 * valueScale
    ctx.strokeRect(...collisionRect)

    ctx.beginPath()
    for (const [x, y] of points) {
      ctx.lineTo(pos[0] + x, pos[1] + y)
    }
    ctx.closePath()

    ctx.fill()
  }
}
