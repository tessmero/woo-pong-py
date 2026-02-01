/**
 * @file sim-gfx.ts
 *
 * Graphics region for sim (Binary Space Partitioning) visuals.
 */

import type { PinballWizard } from 'pinball-wizard'
import { GfxRegion } from '../gfx-region'
import { twopi, type Rectangle, type Vec2 } from 'util/math-util'
import { Graphics } from 'gfx/graphics'
import { CLICKABLE_RADSQ, VALUE_SCALE } from 'simulation/constants'
import { drawDisk, drawDiskCrown, drawDiskHalo } from 'gfx/disk-gfx-util'
import { drawObstacles } from 'gfx/obstacle-gfx-util'
import type { Barrier } from 'simulation/barrier'
import { fillFrameBetweenRectAndRounded, strokeInnerRoundedRect } from '../canvas-rounded-rect-util'
import { BallSelectionPanel } from 'ball-selection-panel'

const ballFlashDuration = 2000 // ms
const ballFlashCycles = 5 // cycles per duration

export class SimGfx extends GfxRegion {
  static {
    GfxRegion.register('sim-gfx', () => new SimGfx())
  }

  down(pw: PinballWizard, mousePos: Vec2) {
    if (BallSelectionPanel.isShowing) {
      return
    }
    pw.isMouseDown = true
    pw.dragY = mousePos[1]
    pw.trySelectDisk(pw.hoveredDiskIndex)
    Graphics.cvs.style.setProperty('cursor', 'default')
  }

  screenToSimPos(screenPos: Vec2): Vec2 {
    const dpr = window.devicePixelRatio
    const { _drawRect, drawOffset, drawSimScale } = this
    const x = (screenPos[0] * dpr - _drawRect[0]) / drawSimScale - drawOffset[0] / drawSimScale
    const y = (screenPos[1] * dpr - _drawRect[1]) / drawSimScale - drawOffset[1] / drawSimScale
    return [x, y]
  }

  simToScreenPos(simPos: Vec2): Vec2 {
    const dpr = window.devicePixelRatio
    const { _drawRect, drawOffset, drawSimScale } = this
    const x = ((simPos[0] + drawOffset[0] / drawSimScale) * drawSimScale + _drawRect[0]) / dpr
    const y = ((simPos[1] + drawOffset[1] / drawSimScale) * drawSimScale + _drawRect[1]) / dpr
    return [x, y]
  }

  move(pw: PinballWizard, mousePos: Vec2, inputId: 'mouse' | number) {
    if (BallSelectionPanel.isShowing) {
      pw.isMouseDown = false
      return
    }

    if (pw.isMouseDown && inputId === 'mouse') {
      pw.camera.drag(pw.dragY, mousePos[1])
      pw.dragY = mousePos[1]
    }

    // idleCountdown = IDLE_DELAY
    const { drawOffset } = this

    pw.mousePos[0] = (mousePos[0] - drawOffset[0] - this._drawRect[0])
    pw.mousePos[1] = (mousePos[1] - drawOffset[1] - this._drawRect[1])

    // const dpr = window.devicePixelRatio

    // compute mouse pos in terms of simulation units
    const [simMouseX, simMouseY] = this.screenToSimPos(mousePos)
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

  leave(_pw: PinballWizard, _mousePos: Vec2) {
    // do nothing
  }

  up(pw: PinballWizard, _mousePos: Vec2) {
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
    const rad = 20 // DISK_RADIUS * VALUE_SCALE * this.drawSimScale
    const x = this.drawOffset[0] + rawx * this.drawSimScale
    const y = this.drawOffset[1] + rawy * this.drawSimScale
    return [
      x - rad + Graphics.cssLeft,
      y - rad + this._drawRect[1] / window.devicePixelRatio,
      2 * rad, 2 * rad,
    ]
  }

  drawFinish(ctx: CanvasRenderingContext2D, finish: Barrier) {
    // Checker size is 1/10 the width, height is 4 squares
    const [x, y, w, _h] = finish.xywh
    const squareSize = w / 10
    const nCols = 10
    const nRows = 4
    const h = nRows * squareSize
    for (let row = 0; row < nRows; row++) {
      for (let col = 0; col < nCols; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#eee' : '#555'
        ctx.fillRect(x + col * squareSize, y + row * squareSize, squareSize, squareSize)
      }
    }
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

  private _updateFlashingState(): boolean {
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

    return isFlashOn
  }

  public fillRoundedMarginCorners(ctx: CanvasRenderingContext2D, _pw: PinballWizard) {
    fillFrameBetweenRectAndRounded(ctx, this._drawRect)
  }

  private _drawRect: Rectangle = [1, 1, 1, 1]
  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    const isFlashOn = this._updateFlashingState()

    this._drawRect = rect
    const [x, y, w, h] = rect
    const sim = pw.activeSim
    const { followDiskIndex, selectedDiskIndex: selectedDiskIndex, hoveredDiskIndex } = pw
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

    ctx.save()
    ctx.translate(x, y + this.drawOffset[1])
    ctx.scale(this.drawSimScale, this.drawSimScale)
    this.drawFinish(ctx, sim.finish)
    ctx.restore()

    // trace edges around main view with a filled frame between rounded and regular rect
    // fillFrameBetweenRectAndRounded(ctx, rect, 'rgba(0,0,0,0.15)')
    strokeInnerRoundedRect(ctx, rect, 'black')

    ctx.save()
    ctx.translate(x, y + this.drawOffset[1])
    ctx.scale(this.drawSimScale, this.drawSimScale)
    ctx.lineWidth = VALUE_SCALE

    // Disk.updateHistory(sim.disks) // add to graphical tail

    // this._drawBoundsInnerEdges(ctx, pw)

    drawObstacles(ctx, pw)

    // this._drawBounds(ctx, pw)
    // this._drawBoundsOuterEdges(ctx, pw)

    for (const [_diskIndex, disk] of sim.disks.entries()) {
      drawDisk(ctx, disk)
      if (isFlashOn) {
        drawDiskHalo(ctx, disk)
      }
    }

    if (hoveredDiskIndex !== -1) {
      drawDiskHalo(ctx, sim.disks[hoveredDiskIndex])
    }
    if (followDiskIndex !== -1) {
      drawDiskHalo(ctx, sim.disks[followDiskIndex])
    }

    if (selectedDiskIndex !== -1) {
      drawDiskCrown(ctx, sim.disks[selectedDiskIndex])
    }

    // for (const barrier of sim.barriers) {
    //   Graphics.drawBarrier(barrier)
    // }

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
}
