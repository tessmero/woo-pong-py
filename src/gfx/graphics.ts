/**
 * @file graphics.ts
 *
 * Routines for drawing the air hockey scene on the
 * canvas 2d graphics context.
 */

import type { Rectangle, Vec2 } from 'util/math-util'
import { twopi } from 'util/math-util'
import type { Barrier } from '../simulation/barrier'
import type { Obstacle } from '../simulation/obstacle'
import { drawDisk } from './disk-gfx'
import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'
import { Scrollbar } from 'scrollbar'
import type { PinballWizard } from 'pinball-wizard'

const cvs = ((typeof document === 'undefined') ? null : document.getElementById('sim-canvas')) as HTMLCanvasElement
const ctx = (cvs ? cvs.getContext('2d') : null) as CanvasRenderingContext2D

export const OBSTACLE_FILL = '#888'
export const OBSTACLE_STROKE = '#000'

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

  static traceObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
    const {
      isHidden, pos, points,
      // boundingRect, collisionRect
    } = obstacle

    if (isHidden) return

    ctx.beginPath()
    for (const [x, y] of points) {
      ctx.lineTo(pos[0] + x, pos[1] + y)
    }
    ctx.closePath()
  }

  static innerWidth = 1
  static onResize(pw: PinballWizard) {
    const dpr = window.devicePixelRatio
    const screenWidth = window.innerWidth * dpr
    // cvs.width = cvs.clientWidth * dpr
    // cvs.height = cvs.clientHeight * dpr

    // compute sim bounds
    const maxWidth = 600 * dpr
    Graphics.innerWidth = Math.min(maxWidth, screenWidth)
    let cssWidth = Math.floor(Graphics.innerWidth / dpr)
    let cssLeft = Math.floor((screenWidth - Graphics.innerWidth) / 2 / dpr)

    // compute scrollbar bounds
    const scrollbarHeight = Math.min(600, window.innerHeight)
    const levelShape = pw?.activeSim?.level?.bounds ?? [1, 1, 1, 1]
    const scrollbarWidth = scrollbarHeight * (levelShape[2] / levelShape[3])
    const scrollbar: Rectangle = [
      cssLeft + cssWidth,
      (window.innerHeight - scrollbarHeight) / 2,
      scrollbarWidth,
      scrollbarHeight,
    ]

    if ((cssWidth + scrollbarWidth) > window.innerWidth) {
      // shrink sim and snap to left to make space for scrollbar
      cssLeft = 0
      cssWidth = window.innerWidth - scrollbarWidth
      scrollbar[0] = cssLeft + cssWidth
      Graphics.innerWidth = cssWidth * dpr
    }
    else if ((cssLeft + cssWidth + scrollbarWidth) > window.innerWidth) {
      // slide sim to left to make space for scrollbar
      cssLeft = window.innerWidth - cssWidth - scrollbarWidth
      scrollbar[0] = cssLeft + cssWidth
      Graphics.innerWidth = cssWidth * dpr
    }

    // commit new layout
    cvs.style.setProperty('position', `absolute`)
    cvs.style.setProperty('width', `${cssWidth}px`)
    cvs.style.setProperty('left', `${cssLeft}px`)
    cvs.width = Graphics.innerWidth
    cvs.height = cvs.clientHeight * dpr
    Graphics.drawOffset[0] = 0
    Scrollbar.setBounds(scrollbar, pw)
  }

  static drawOffset: Vec2 = [0, 0] // set in draw

  static drawSimScale: number = 1 // set in drawSim
  static drawSim(pw: PinballWizard) {
    Graphics._updateSimViewRect(pw)

    const sim = pw.activeSim
    const { selectedDiskIndex, simViewRect } = pw
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

    const vy0 = simViewRect[1]
    const vy1 = vy0 + simViewRect[3]
    ctx.fillStyle = OBSTACLE_FILL
    ctx.strokeStyle = OBSTACLE_STROKE
    ctx.lineWidth = .4 * VALUE_SCALE
    for (const obstacle of sim.obstacles) {
      const [_x, y, _w, h] = obstacle.collisionRect
      if (y > vy1) {
        // console.log('skip obstacle below view')
        continue // obstacle below view
      }
      if ((y + h) < vy0) {
        // console.log('skip obstacle above view')
        continue // obstacle above view
      }
      Graphics.traceObstacle(ctx, obstacle)
      ctx.fill()
      ctx.stroke()

      // // debug
      // ctx.strokeStyle = 'red'
      // ctx.lineWidth = 1 * VALUE_SCALE
      // ctx.strokeRect(...boundingRect)
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

    // // debug bounds
    // ctx.strokeStyle = 'red'
    // ctx.lineWidth = 0.5 * VALUE_SCALE
    // ctx.strokeRect(...sim.level.bounds)

    // draw level bounds
    const thick = 2 * VALUE_SCALE
    const x0 = sim.level.bounds[0]
    const y0 = sim.level.bounds[1]
    const x1 = x0 + sim.level.bounds[2]
    const y1 = y0 + sim.level.bounds[3]
    ctx.fillStyle = OBSTACLE_FILL
    ctx.fillRect(x0 - thick, y0, thick, y1 - y0)
    ctx.fillRect(x1, y0, thick, y1 - y0)

    // debug mouse pose
    Graphics.drawCursor(pw.simMousePos)

    // // debug view rect
    // Graphics.drawViewRect(ctx, pw.simViewRect)

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

  private static _updateSimViewRect(pw: PinballWizard) {
    const { drawOffset, drawSimScale } = this
    pw.simViewRect[0] = drawOffset[0] / drawSimScale
    pw.simViewRect[1] = -drawOffset[1] / drawSimScale
    pw.simViewRect[2] = Graphics.innerWidth / drawSimScale
    // if (pw.activeSim)pw.simViewRect[2] = pw.activeSim.level.bounds[2]
    pw.simViewRect[3] = window.innerHeight / drawSimScale * window.devicePixelRatio

    // // debug, shrink simViewRect
    // const shrinkFraction = 0.2
    // const shrinkAmt = pw.simViewRect[3] * shrinkFraction
    // pw.simViewRect[1] += shrinkAmt
    // pw.simViewRect[3] -= 2 * shrinkAmt
  }

  static drawCursor(pos: Vec2) {
    const [x, y] = pos
    ctx.fillStyle = 'rgba(100,100,100,.5)'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.arc(x, y, DISK_RADIUS, 0, twopi)
    ctx.fill()
  }

  static drawViewRect(ctx: CanvasRenderingContext2D, rect: Rectangle) {
    ctx.strokeStyle = 'red'
    ctx.lineWidth = DISK_RADIUS
    ctx.strokeRect(...rect)
  }
}
