/**
 * @file scrollbar-gfx.ts
 *
 * Graphics region for scrollbars.
 */

import type { Rectangle, Vec2 } from 'util/math-util'
import { GfxRegion } from '../gfx-region'
import { traceObstacle } from 'gfx/obstacle-gfx-util'
import type { PinballWizard } from 'pinball-wizard'
import { VALUE_SCALE } from 'simulation/constants'
import { Graphics, OBSTACLE_FILL } from 'gfx/graphics'
import { Scrollbar } from 'scrollbar'

export class ScrollbarGfx extends GfxRegion {
  static {
    GfxRegion.register('scrollbar-gfx', () => new ScrollbarGfx())
  }

  down(pw: PinballWizard, mousePos: Vec2) {
    // do nothing
  }

  move(pw: PinballWizard, mousePos: Vec2) {
    // do nothing
  }

  leave(pw: PinballWizard, mousePos: Vec2) {
    // do nothing
  }

  up(pw: PinballWizard, mousePos: Vec2) {
    // do nothing
  }

  protected _draw(
    ctx: CanvasRenderingContext2D,
    pw: PinballWizard,
    rect: Rectangle,
  ): void {
    const sim = pw.activeSim

    const [x, y, w, h] = rect

    const scale = w / 100 / VALUE_SCALE
    Scrollbar.drawScale = scale

    ctx.clearRect(x, y, w, h)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)

    if (sim) {
      ctx.fillStyle = OBSTACLE_FILL
      for (const obstacle of sim.obstacles) {
        traceObstacle(ctx, obstacle)
        ctx.fill()
      }

      // draw disks
      const selected = pw.selectedDiskIndex
      for (const [diskIndex, disk] of sim.disks.entries()) {
        const isSelected = (diskIndex === selected)
        Scrollbar.drawDisk(disk, isSelected)
      }
      if (selected !== -1) {
        const disk = sim.disks[selected]
        Scrollbar.drawDisk(disk, true)
      }

      Graphics.drawViewRect(ctx, pw.simViewRect)
    }

    ctx.restore()
  }
}
