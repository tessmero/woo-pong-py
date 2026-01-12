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
import { Disk } from 'simulation/disk'
import type { BreakoutRoom } from 'rooms/imp/breakout-room'

const cvs = document.getElementById('sim-canvas') as HTMLCanvasElement
const ctx = cvs.getContext('2d') as CanvasRenderingContext2D

export class Graphics {
  static cvs = cvs
  static ctx = ctx

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

  static innerWidth = 1
  static onResize() {
    const dpr = window.devicePixelRatio
    cvs.width = cvs.clientWidth * dpr
    cvs.height = cvs.clientHeight * dpr

    const maxWidth = 600 * dpr
    Graphics.innerWidth = Math.min(maxWidth, cvs.width)

    Graphics.drawOffset[0] = (cvs.width - Graphics.innerWidth) / 2
  }

  static drawOffset: Vec2 = [0, 0] // set in draw

  static drawSimScale: number = 1 // set in drawSim
  static drawSim(sim: Simulation, selectedDiskIndex: number) {
    const scale = Graphics.innerWidth / 100 / VALUE_SCALE
    Graphics.drawSimScale = scale
    // Graphics.drawScale = scale

    ctx.clearRect(0, 0, cvs.width, cvs.height)
    ctx.save()
    ctx.translate(...Graphics.drawOffset)
    ctx.scale(scale, scale)
    ctx.lineWidth = VALUE_SCALE

    // Disk.updateHistory(sim.disks) // add to graphical tail

    for (const [diskIndex, disk] of sim.disks.entries()) {
      const isSelected = (diskIndex === selectedDiskIndex)
      const isWinner = (diskIndex === sim.winningDiskIndex)
      drawDisk(ctx, disk, isSelected, isWinner)
    }
    for (const obstacle of sim.obstacles) {
      Graphics.drawObstacle(obstacle)
    }
    // for (const barrier of sim.barriers) {
    //   Graphics.drawBarrier(barrier)
    // }
    Graphics.drawFinish(sim.finish)

    // // debug camera target height
    // ctx.strokeStyle = 'green'
    // ctx.lineWidth = 0.4 * VALUE_SCALE
    // const camY = Graphics.drawOf
    // ctx.strokeRect(...sim.level.bounds)

    // debug bounds
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 0.4 * VALUE_SCALE
    ctx.strokeRect(...sim.level.bounds)

    // // debug room bounds
    // ctx.strokeStyle = 'blue'
    // ctx.fillStyle = 'blue'
    // const gfxScale = 1 / 10 // extra scale factor needed to support text
    // ctx.scale(1 / gfxScale, 1 / gfxScale)
    // ctx.font = `${1 * VALUE_SCALE}px serif`
    // ctx.lineWidth = 0.2 * VALUE_SCALE * gfxScale
    // for (const room of sim.level.rooms) {
    //   const [x, y, w, h] = room.bounds
    //   // console.log(`room bounds: ${JSON.stringify(room.bounds)}`)
    //   ctx.strokeRect(x * gfxScale, y * gfxScale, w * gfxScale, h * gfxScale)

    //   if (room.name === 'breakout-room') {
    //     ctx.fillText(`SCORE: ${(room as BreakoutRoom).score}`, x * gfxScale, y * gfxScale)
    //   }
    //   else {
    //     ctx.fillText(room.name, x * gfxScale, y * gfxScale)
    //   }
    // }

    // // draw labels on breakout bricks
    // for (const obstacle of sim.obstacles) {
    //   if (obstacle.label && !obstacle.isHidden) {
    //     const [x, y] = obstacle.pos
    //     ctx.fillText(obstacle.label, x * gfxScale, y * gfxScale)
    //   }
    // }

    ctx.restore()

    // // debug inner width
    // ctx.strokeStyle = 'red'
    // ctx.lineWidth = 1
    // ctx.strokeRect(Graphics.drawOffset[0], 0, Graphics.innerWidth, cvs.height)
  }

  static drawCursor(pos: Vec2) {
    // console.log(`cursor: ${JSON.stringify(pos.map(val => val * VALUE_SCALE))}`)
    const x = (Graphics.drawOffset[0] + pos[0]) * window.devicePixelRatio
    const y = (Graphics.drawOffset[1] + pos[1]) * window.devicePixelRatio
    ctx.fillStyle = 'rgba(100,100,100,.5)'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.arc(x, y, 10, 0, twopi)
    ctx.fill()
  }
}
