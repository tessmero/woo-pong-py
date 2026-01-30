/**
 * @file sim-gfx.ts
 *
 * Graphics region for sim (Binary Space Partitioning) visuals.
 */

import type { PinballWizard } from 'pinball-wizard'
import { GfxRegion } from '../gfx-region'
import { twopi, type Rectangle, type Vec2 } from 'util/math-util'
import { Graphics } from 'gfx/graphics'
import { CLICKABLE_RADSQ, DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'
import { drawDisk, drawDiskCrown, drawDiskHalo } from 'gfx/disk-gfx-util'
import { drawObstacles } from 'gfx/obstacle-gfx-util'
import type { Barrier } from 'simulation/barrier'

const ballFlashDuration = 2000 // ms
const ballFlashCycles = 5 // cycles per duration

export class SimGfx extends GfxRegion {
  static {
    GfxRegion.register('sim-gfx', () => new SimGfx())
  }

  down(pw: PinballWizard, mousePos: Vec2) {
    pw.isMouseDown = true
    pw.dragY = mousePos[1]
    pw.trySelectDisk(pw.hoveredDiskIndex)
    Graphics.cvs.style.setProperty('cursor', 'default')
  }

  move(pw: PinballWizard, mousePos: Vec2, inputId: 'mouse' | number) {
    if (pw.isMouseDown && inputId === 'mouse') {
      pw.camera.drag(pw.dragY, mousePos[1])
      pw.dragY = mousePos[1]
    }

    // idleCountdown = IDLE_DELAY
    const { drawOffset, drawSimScale } = this

    pw.mousePos[0] = (mousePos[0] - drawOffset[0] - this._drawRect[0])
    pw.mousePos[1] = (mousePos[1] - drawOffset[1] - this._drawRect[1])

    const dpr = window.devicePixelRatio

    // compute mouse pos in terms of simulation units
    const simMouseX = (mousePos[0] * dpr - this._drawRect[0]) / drawSimScale - drawOffset[0] / drawSimScale
    const simMouseY = (mousePos[1] * dpr - this._drawRect[1]) / drawSimScale - drawOffset[1] / drawSimScale
    pw.simMousePos[0] = simMouseX
    pw.simMousePos[1] = simMouseY

    // this.simViewRect[0] = drawOffset[0] / drawSimScale
    // this.simViewRect[1] = -drawOffset[1] / drawSimScale
    // if( this.activeSim )this.simViewRect[2] = this.activeSim.level.bounds[2]
    // this.simViewRect[3] = window.innerHeight / drawSimScale * window.devicePixelRatio

    // // // debug, position obstacle on mouse
    // const obs = this.activeSim.obstacles.at(-1) as Obstacle
    // obs.pos[0] = simMouseX
    // obs.pos[1] = simMouseY

    // // debug identify hovered room
    // for (const [roomIndex, room] of this.activeSim.level.rooms.entries()) {
    //   const bounds = room.bounds
    //   if (rectContainsPoint(bounds, simMouseX, simMouseY)) {
    //     console.log(`hovered room ${roomIndex}`)
    //   }
    // }

    // this.gui.move(this, this.mousePos)

    pw.hoveredDiskIndex = this.getHoveredDiskIndex(pw)

    if (pw.hoveredDiskIndex === -1 || pw.hasBranched || pw.hoveredDiskIndex === pw.selectedDiskIndex) {
      Graphics.cvs.style.setProperty('cursor', 'default')
    }
    else {
      Graphics.cvs.style.setProperty('cursor', 'pointer') // can select disk
    }
  }

  public getHoveredDiskIndex(pw: PinballWizard): number {
    let minD2 = CLICKABLE_RADSQ
    let result = -1
    for (const [diskIndex, disk] of pw.activeSim.disks.entries()) {
      const [x, y] = disk.interpolatedPos
      const distSquared
        = Math.pow(pw.simMousePos[0] - x, 2)
          + Math.pow(pw.simMousePos[1] - y, 2)
      if (distSquared < minD2) {
        minD2 = distSquared
        result = diskIndex
      }
    }
    return result
  }

  leave(pw: PinballWizard, mousePos: Vec2) {
    // do nothing
  }

  up(pw: PinballWizard, mousePos: Vec2) {
    pw.isMouseDown = false
    pw.camera.endDrag()
  }

  public drawSimScale: number = 1 // set in drawSim
  public drawOffset: Vec2 = [0, 0]
  private _updateSimViewRect(pw: PinballWizard) {
    const { drawOffset, drawSimScale } = this
    pw.simViewRect[0] = drawOffset[0] / drawSimScale
    pw.simViewRect[1] = -drawOffset[1] / drawSimScale
    pw.simViewRect[2] = this._drawRect[2] / drawSimScale
    // if (pw.activeSim)pw.simViewRect[2] = pw.activeSim.level.bounds[2]
    pw.simViewRect[3] = this._drawRect[3] / drawSimScale

    // // debug, shrink simViewRect
    // const shrinkFraction = 0.2
    // const shrinkAmt = pw.simViewRect[3] * shrinkFraction
    // pw.simViewRect[1] += shrinkAmt
    // pw.simViewRect[3] -= 2 * shrinkAmt
  }

  locateDiskOnScreen(pw: PinballWizard, diskIndex: number): Rectangle {
    const disk = pw.activeSim.disks[diskIndex]
    const [rawx, rawy] = disk.interpolatedPos
    const rad = DISK_RADIUS * VALUE_SCALE * this.drawSimScale
    const x = this.drawOffset[0] + rawx * this.drawSimScale
    const y = this.drawOffset[1] + rawy * this.drawSimScale
    return [
      x - rad + Graphics.cssLeft, y - rad, 2 * rad, 2 * rad,
    ]
  }

  drawFinish(ctx: CanvasRenderingContext2D, finish: Barrier) {
    ctx.fillStyle = 'rgba(0,255,0,0.5)'
    ctx.fillRect(...finish.xywh)
  }

  drawBarrier(ctx: CanvasRenderingContext2D, barrier: Barrier) {
    if (barrier.isHidden) return
    ctx.fillStyle = 'black'
    ctx.fillRect(...barrier.xywh)
  }

  private _flashStartTime = -1
  public startFlashing() {
    this._flashStartTime = performance.now()
  }

  private _drawRect: Rectangle = [1, 1, 1, 1]
  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    let isFlashOn = false
    if (this._flashStartTime > -1) {
      const t = performance.now()
      const flashCountdown = this._flashStartTime - t + ballFlashDuration
      if (flashCountdown > 0) {
        const angle = (flashCountdown / ballFlashDuration) * twopi * ballFlashCycles
        if (Math.sin(angle) > 0) {
          isFlashOn = true
        }
      }
    }

    this._drawRect = rect
    const [x, y, w, h] = rect
    const sim = pw.activeSim
    const { selectedDiskIndex, hoveredDiskIndex, simViewRect } = pw
    const scale = (w) / 100 / VALUE_SCALE
    this.drawSimScale = scale
    const dpr = window.devicePixelRatio

    this.drawOffset[0] = x * dpr * this.drawSimScale
    this.drawOffset[1] = (y * dpr * this.drawSimScale)
      + (pw.camera.pos * scale)
      // + Graphics.cvs.height / 2
      + rect[3] * window.devicePixelRatio / 2

    this._updateSimViewRect(pw)

    ctx.clearRect(x, y, w, h)

    // debug
    ctx.lineWidth = 3 * window.devicePixelRatio
    ctx.strokeStyle = 'black'
    ctx.strokeRect(x, y, w, h)

    ctx.save()
    ctx.translate(x, y + this.drawOffset[1])
    ctx.scale(scale, scale)
    ctx.lineWidth = VALUE_SCALE

    // Disk.updateHistory(sim.disks) // add to graphical tail

    // this._drawBoundsInnerEdges(ctx, pw)

    drawObstacles(ctx, pw)

    // this._drawBounds(ctx, pw)
    // this._drawBoundsOuterEdges(ctx, pw)

    for (const [diskIndex, disk] of sim.disks.entries()) {
      drawDisk(ctx, disk)
      if (isFlashOn) {
        drawDiskHalo(ctx, disk)
      }
    }

    if (hoveredDiskIndex !== -1) {
      drawDiskHalo(ctx, sim.disks[hoveredDiskIndex])
    }

    if (selectedDiskIndex !== -1) {
      drawDiskCrown(ctx, sim.disks[selectedDiskIndex])
    }

    // for (const barrier of sim.barriers) {
    //   Graphics.drawBarrier(barrier)
    // }
    this.drawFinish(ctx, sim.finish)

    // // debug camera target height
    // ctx.strokeStyle = 'green'
    // ctx.lineWidth = 0.4 * VALUE_SCALE
    // const camY = Graphics.drawOf
    // ctx.strokeRect(...sim.level.bounds)

    // // debug bounds
    // ctx.strokeStyle = 'red'
    // ctx.lineWidth = 0.5 * VALUE_SCALE
    // ctx.strokeRect(...sim.level.bounds)

    // // debug mouse pose
    // Graphics.drawCursor(pw.simMousePos)

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

  // private _drawBoundsOuterEdges(ctx: CanvasRenderingContext2D, pw: PinballWizard) {
  //   const mainThick = 2 * VALUE_SCALE

  //   const thick = 0.6 * VALUE_SCALE
  //   const viewRect = pw.simViewRect
  //   const x0 = viewRect[0] - mainThick / 2
  //   const y0 = viewRect[1]
  //   const x1 = x0 + viewRect[2] + mainThick
  //   const y1 = y0 + viewRect[3]

  //   ctx.lineWidth = thick
  //   ctx.strokeStyle = 'red'
  //   ctx.beginPath()

  //   // outer left edge
  //   ctx.moveTo(x0, y0)
  //   ctx.lineTo(x0, y1)

  //   // outer right edge
  //   ctx.moveTo(x1, y0)
  //   ctx.lineTo(x1, y1)

  //   ctx.stroke()
  // }

  // private _drawBoundsInnerEdges(ctx: CanvasRenderingContext2D, pw: PinballWizard) {
  //   const mainThick = 2 * VALUE_SCALE

  //   const thick = 0.6 * VALUE_SCALE

  //   const viewRect = pw.simViewRect
  //   const x0 = viewRect[0]
  //   const y0 = viewRect[1]
  //   const x1 = x0 + viewRect[2]
  //   const y1 = y0 + viewRect[3]

  //   ctx.lineWidth = thick
  //   ctx.strokeStyle = 'black'
  //   ctx.beginPath()

  //   // left
  //   ctx.moveTo(x0, y0)
  //   ctx.lineTo(x0, y1)

  //   // right
  //   ctx.moveTo(x1, y0)
  //   ctx.lineTo(x1, y1)

  //   // bottom
  //   ctx.moveTo(x0,y1)
  //   ctx.lineTo(x1,y1)

  //   ctx.stroke()
  // }

  // private _drawBounds(ctx: CanvasRenderingContext2D, pw: PinballWizard) {
  //   // draw level bounds
  //   const thick = 2 * VALUE_SCALE

  //   const viewRect = pw.simViewRect
  //   const x0 = viewRect[0]
  //   const y0 = viewRect[1]
  //   const x1 = x0 + viewRect[2]
  //   const y1 = y0 + viewRect[3]
  //   ctx.fillStyle = OBSTACLE_FILL
  //   ctx.fillRect(x0 - thick, y0, thick, y1 - y0)
  //   ctx.fillRect(x1, y0, thick, y1 - y0)
  // }
}
