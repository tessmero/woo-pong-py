/**
 * @file loop-gfx.ts
 *
 * Graphics region for loop visuals.
 */

import type { InputId, PinballWizard } from 'pinball-wizard'
import { twopi, type Rectangle, type Vec2 } from 'util/math-util'
import { Graphics } from 'gfx/graphics'
import { CLICKABLE_RADSQ, VALUE_SCALE } from 'simulation/constants'
import { drawDisk, drawDiskCrown, drawDiskFollowHalo, drawDiskHoverHalo } from 'gfx/disk-gfx-util'
import { drawObstacles } from 'gfx/obstacle-gfx-util'
import type { Barrier } from 'simulation/barrier'
import { ballSelectionPanel } from 'overlay-panels/ball-selection-panel'
import { GfxRegion } from '../gfx-region'
import { fillFrameBetweenRectAndRounded, strokeInnerRoundedRect } from 'gfx/canvas-rounded-rect-util'
import { settingsPanel } from 'overlay-panels/settings-panel'
import { Scrollbar } from 'scrollbar'

const ballFlashDuration = 2000 // ms
const ballFlashCycles = 5 // cycles per duration

const dummy: Vec2 = [0, 0]

export class LoopGfx extends GfxRegion {
  static {
    GfxRegion.register('loop-gfx', () => new LoopGfx())
  }

  down(pw: PinballWizard, mousePos: Vec2, inputId: InputId) {
    if (ballSelectionPanel.isShowing) {
      return false
    }
    if (pw.draggingId === null && !Scrollbar.isDragging) {
      pw.draggingId = inputId
      pw.dragY = mousePos[1]
    }
    const hoveredDiskIndex = this.getHoveredDiskIndex(pw)
    pw.trySelectDisk(hoveredDiskIndex)
    Graphics.cvs.style.setProperty('cursor', 'default')
    return false
  }

  screenToSimPos(screenPos: Vec2): Vec2 {
    const dpr = window.devicePixelRatio
    const { _drawRect, drawOffset, drawSimScale } = this
    dummy[0] = (screenPos[0] * dpr - _drawRect[0]) / drawSimScale - drawOffset[0] / drawSimScale
    dummy[1] = (screenPos[1] * dpr - _drawRect[1]) / drawSimScale - drawOffset[1] / drawSimScale
    return dummy
  }

  simToScreenPos(simPos: Vec2): Vec2 {
    const dpr = window.devicePixelRatio
    const { _drawRect, drawOffset, drawSimScale } = this
    dummy[0] = ((simPos[0] + drawOffset[0] / drawSimScale) * drawSimScale + _drawRect[0]) / dpr
    dummy[1] = ((simPos[1] + drawOffset[1] / drawSimScale) * drawSimScale + _drawRect[1]) / dpr
    return dummy
  }

  move(pw: PinballWizard, mousePos: Vec2, inputId: InputId) {
    if (ballSelectionPanel.isShowing || settingsPanel.isShowing) {
      pw.draggingId = null
      pw.camera.endDrag()
      return
    }

    if (pw.draggingId === inputId) {
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

    // this.gui.move(this, this.mousePos)

    pw.hoveredDiskIndex = inputId === 'mouse' ? this.getHoveredDiskIndex(pw) : -1

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
      const [x, y] = disk.displayPos
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

  leave(pw: PinballWizard, mousePos: Vec2, inputId: InputId) {
    if (ballSelectionPanel.isShowing) {
      pw.draggingId = null
      pw.camera.endDrag()
      return
    }

    if (pw.draggingId === inputId) {
      pw.camera.drag(pw.dragY, mousePos[1])
      pw.dragY = mousePos[1]
    }
  }

  up(pw: PinballWizard, _mousePos: Vec2, inputId: InputId) {
    if (inputId === pw.draggingId) {
      pw.draggingId = null
      pw.camera.endDrag()
    }
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
  }

  locateDiskOnScreen(pw: PinballWizard, diskIndex: number): Rectangle {
    const disk = pw.activeSim.disks[diskIndex]
    const [rawx, rawy] = disk.displayPos
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
    // const h = nRows * squareSize
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

  static debugTargetPos = 0

  // public override shouldDraw(pw: PinballWizard): boolean {
  //   return pw.activeSim.stepCount > 0
  // }

  private _drawRect: Rectangle = [1, 1, 1, 1]
  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    const isFlashOn = this._updateFlashingState()

    this._drawRect = rect

    const [x, y, w, h] = rect

    const sim = pw.activeSim
    // const { followDiskIndex, selectedDiskIndex: selectedDiskIndex, hoveredDiskIndex } = pw
    const scale = (w) / 100 / VALUE_SCALE
    this.drawSimScale = scale
    const dpr = window.devicePixelRatio

    this.drawOffset[0] = x * dpr * this.drawSimScale
    this.drawOffset[1] = (y * dpr * this.drawSimScale)
      + (pw.camera.pos * scale)
      // + Graphics.cvs.height / 2
      + rect[3] / 2

    this._updateSimViewRect(pw)

    const { simViewRect } = pw
    const centerDisk = pw.activeSim.disks[0].currentState
    const oldX = simViewRect[0]
    const oldY = simViewRect[1]
    simViewRect[0] = centerDisk.x - simViewRect[2] / 2
    simViewRect[1] = centerDisk.y - simViewRect[3] / 2
    const dx = (simViewRect[0] - oldX)
    const dy = (simViewRect[1] - oldY)

    ctx.clearRect(x, y, w, h)

    ctx.save()
    ctx.translate(x-(dx * this.drawSimScale), y + this.drawOffset[1]-(dy * this.drawSimScale))
    ctx.scale(this.drawSimScale, this.drawSimScale)
    this.drawFinish(ctx, sim.finish)
    ctx.restore()

    // trace edges around main view with a filled frame between rounded and regular rect
    // fillFrameBetweenRectAndRounded(ctx, rect, 'rgba(0,0,0,0.15)')
    strokeInnerRoundedRect(ctx, rect, 'black')

    ctx.save()
    ctx.translate(x-(dx * this.drawSimScale), y + this.drawOffset[1]-(dy * this.drawSimScale))
    ctx.scale(this.drawSimScale, this.drawSimScale)
    ctx.lineWidth = VALUE_SCALE

    // Disk.updateHistory(sim.disks) // add to graphical tail

    // this._drawBoundsInnerEdges(ctx, pw)

    const y0 = simViewRect[1]
    const y1 = y0 + simViewRect[3]

    for (const room of sim.level.rooms) {
      if (room.bounds[0] > y1) continue
      if (room.bounds[1] + room.bounds[3] < y0) continue
      room.drawDecorationsBelow(ctx, pw, 'sim-gfx')
    }

    drawObstacles(ctx, pw)
    // drawGasBoxes(ctx, pw)

    for (const room of sim.level.rooms) {
      if (room.bounds[0] > y1) continue
      if (room.bounds[1] + room.bounds[3] < y0) continue
      room.drawDecorations(ctx, pw, 'sim-gfx')
    }

    for (const [diskIndex, disk] of sim.disks.entries()) {
      drawDisk(ctx, diskIndex, disk)
      if (isFlashOn) {
        drawDiskHoverHalo(ctx, disk)
      }
    }
    // // debug room bounds
    ctx.strokeStyle = 'blue'
    ctx.fillStyle = 'blue'
    const gfxScale = 1 / 10 // extra scale factor needed to support text
    ctx.scale(1 / gfxScale, 1 / gfxScale)
    ctx.font = `${Math.floor(0.3 * VALUE_SCALE)}px serif`

    ctx.restore()
  }

  public drawHalos(ctx: CanvasRenderingContext2D, pw: PinballWizard) {
    const [x, y] = this._drawRect
    ctx.translate(x, y + this.drawOffset[1])
    ctx.scale(this.drawSimScale, this.drawSimScale)

    const sim = pw.activeSim
    const { hoveredDiskIndex, followDiskIndex, selectedDiskIndex } = pw
    if (hoveredDiskIndex !== -1) {
      drawDiskHoverHalo(ctx, sim.disks[hoveredDiskIndex])
    }
    if (followDiskIndex !== -1) {
      drawDiskFollowHalo(ctx, sim.disks[followDiskIndex])
    }

    if (selectedDiskIndex !== -1) {
      drawDiskCrown(ctx, sim.disks[selectedDiskIndex])
    }

    ctx.restore()
  }
}
