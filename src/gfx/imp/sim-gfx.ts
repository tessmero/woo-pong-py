/**
 * @file sim-gfx.ts
 *
 * Graphics region for sim (Binary Space Partitioning) visuals.
 */

import type { PinballWizard } from 'pinball-wizard'
import { GfxRegion } from '../gfx-region'
import type { Rectangle, Vec2 } from 'util/math-util'
import { Graphics } from 'gfx/graphics'

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

  move(pw: PinballWizard, mousePos: Vec2) {
    // idleCountdown = IDLE_DELAY
    const { drawOffset, drawSimScale } = Graphics

    pw.mousePos[0] = (mousePos[0] - drawOffset[0])
    pw.mousePos[1] = (mousePos[1] - drawOffset[1])

    // compute mouse pos in terms of simulation units
    const simMouseX = mousePos[0] / drawSimScale * window.devicePixelRatio - drawOffset[0] / drawSimScale
    const simMouseY = mousePos[1] / drawSimScale * window.devicePixelRatio - drawOffset[1] / drawSimScale
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

    pw.hoveredDiskIndex = pw.getHoveredDiskIndex()

    if (pw.hoveredDiskIndex === -1 || pw.hasBranched || pw.hoveredDiskIndex === pw.selectedDiskIndex) {
      Graphics.cvs.style.setProperty('cursor', 'default')
    }
    else {
      Graphics.cvs.style.setProperty('cursor', 'pointer') // can select disk
    }
  }

  leave(pw: PinballWizard, mousePos: Vec2) {
	// do nothing
  }

  up(pw: PinballWizard, mousePos: Vec2) {
    pw.isMouseDown = false
    pw.camera.endDrag()
  }

  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    // do nothing
  }
}
