/**
 * @file graphics.ts
 *
 * Routines for drawing the air hockey scene on the
 * canvas 2d graphics context.
 */

import type { Vec2 } from 'util/math-util'
import { twopi } from 'util/math-util'
import type { Barrier } from '../simulation/barrier'
import type { Obstacle } from '../simulation/obstacle'
import { drawDisk } from './disk-gfx'
import type { Simulation } from 'simulation/simulation'
import { VALUE_SCALE } from 'simulation/constants'

const cvs = document.getElementById('sim-canvas') as HTMLCanvasElement
const ctx = cvs.getContext('2d') as CanvasRenderingContext2D

export class Graphics {
  static cvs = cvs
  static ctx = ctx

  static drawCursor(pos: Vec2) {
    const x = pos[0] * window.devicePixelRatio
    const y = pos[1] * window.devicePixelRatio
    ctx.fillStyle = 'rgba(100,100,100,.5)'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.arc(x, y, 10, 0, twopi)
    ctx.fill()
  }

  static drawFinish(finish: Barrier) {
    ctx.fillStyle = 'rgba(0,255,0,0.5)'
    ctx.fillRect(...finish.xywh)
  }

  static drawBarrier(barrier: Barrier) {
    if (barrier.isHidden) return
    ctx.fillStyle = 'black'
    ctx.fillRect(...barrier.xywh)
  }

  static drawObstacle(obstacle: Obstacle) {
    ctx.fillStyle = 'black'

    const {
      isHidden, pos, points,
      // boundingRect, collisionRect
    } = obstacle

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

  static onResize() {
    cvs.width = cvs.clientWidth * window.devicePixelRatio
    cvs.height = cvs.clientHeight * window.devicePixelRatio
  }

  static drawSim(sim: Simulation, selectedDiskIndex: number) {
    ctx.clearRect(0, 0, cvs.width, cvs.height)
    ctx.save()
    ctx.scale(10 / VALUE_SCALE, 10 / VALUE_SCALE)
    ctx.lineWidth = VALUE_SCALE
    for (const [diskIndex, disk] of sim.disks.entries()) {
      const isSelected = (diskIndex === selectedDiskIndex)
      const isWinner = (diskIndex === sim.winningDiskIndex)
      drawDisk(ctx, disk, isSelected, isWinner)
    }
    for (const obstacle of sim.obstacles) {
      Graphics.drawObstacle(obstacle)
    }
    for (const barrier of sim.barriers) {
      Graphics.drawBarrier(barrier)
    }
    Graphics.drawFinish(sim.finish)
    ctx.restore()
  }
}
