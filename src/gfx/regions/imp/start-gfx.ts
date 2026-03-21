/**
 * @file start-gfx.ts
 *
 * Temporary top layer of graphics that fade during simulation start sequence.
 */

import type { PinballWizard, InputId } from 'pinball-wizard'
import { type Vec2, type Rectangle } from 'util/math-util'
import { GfxRegion } from '../gfx-region'
import { OBSTACLE_FILL, type CanvasName } from 'gfx/graphics'
import { VALUE_SCALE } from 'simulation/constants'
import { drawDisk } from 'gfx/disk-gfx-util'

let isShowing = false

export class StartGfx extends GfxRegion {
  static {
    GfxRegion.register('start-gfx', () => new StartGfx())
  }

  override targetCanvas: CanvasName = 'start'
  override shouldDraw(pw: PinballWizard) {
    return pw.activeSim && pw.activeSim.stepCount < 2000 // ballSelectionPanel.isShowing
  }

  public drawSimScale: number = 1 // set in drawSim
  public drawOffset: Vec2 = [0, 0]
  private _drawRect: Rectangle = [1, 1, 1, 1]
  protected override _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    // throw new Error("Method not implemented.");
    if (pw.activeSim.stepCount < 0 && !isShowing) {
      isShowing = true
      document.getElementById('start-canvas-container')!.classList.remove('hidden')
    }
    if (pw.activeSim.stepCount > 0 && isShowing) {
      isShowing = false
      // Graphics._canvases['start'].classList.add('hidden')
      document.getElementById('start-canvas-container')!.classList.add('hidden')
    }

    // const isFlashOn = false //this._updateFlashingState()

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

    // this._updateSimViewRect(pw)

    // ctx.clearRect(x, y, w, h)
    ctx.clearRect(0, 0, w * 2, h * 2)

    ctx.save()
    ctx.translate(x, y + this.drawOffset[1])
    ctx.scale(this.drawSimScale, this.drawSimScale)
    ctx.lineWidth = VALUE_SCALE

    // Disk.updateHistory(sim.disks) // add to graphical tail

    // this._drawBoundsInnerEdges(ctx, pw)

    const { simViewRect } = pw
    const y0 = simViewRect[1]
    const _y1 = y0 + simViewRect[3]

    // this._drawBounds(ctx, pw)
    // this._drawBoundsOuterEdges(ctx, pw)

    for (const [diskIndex, disk] of sim.disks.entries()) {
      drawDisk(ctx, diskIndex, disk, 'white', OBSTACLE_FILL)
    }

    // // debug impact sounds
    // const rad = DISK_RADIUS / 2
    // ctx.fillStyle = 'yellow'
    // for (const impact of getRecentImpacts()) {
    //   ctx.fillRect(
    //     impact.pos[0] - rad, impact.pos[1] - rad,
    //     2 * rad, 2 * rad,
    //   )
    // }

    // this.drawHalos(ctx,pw)

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
    ctx.strokeStyle = 'blue'
    ctx.fillStyle = 'blue'
    const gfxScale = 1 / 10 // extra scale factor needed to support text
    ctx.scale(1 / gfxScale, 1 / gfxScale)
    ctx.font = `${Math.floor(0.3 * VALUE_SCALE)}px serif`

    ctx.restore()
  }

  override down(_pw: PinballWizard, _mousePos: Vec2, _inputId: InputId): boolean {
    return false
    // throw new Error("Method not implemented.");
  }

  override move(_pw: PinballWizard, _mousePos: Vec2, _inputId: InputId): void {
    // throw new Error("Method not implemented.");
  }

  override leave(_pw: PinballWizard, _mousePos: Vec2, _inputId: InputId): void {
    // throw new Error("Method not implemented.");
  }

  override up(_pw: PinballWizard, _mousePos: Vec2, _inputId: InputId): void {
    // throw new Error("Method not implemented.");
  }
}
