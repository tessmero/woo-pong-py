/**
 * @file top-bar-gfx.ts
 *
 * Controls along the top of the screen.
 */


import type { PinballWizard } from 'pinball-wizard'
import { GfxRegion } from '../gfx-region'
import type { Rectangle, Vec2 } from 'util/math-util'
import { STEPS_BEFORE_BRANCH, stepsToSeconds } from 'simulation/constants'

import { formatTime, getStatusText } from 'guis/imp/playing-gui'
import { setupRubikText } from '../canvas-text-util'



export class TopBarGfx extends GfxRegion {
  static {
    GfxRegion.register('top-bar-gfx', () => new TopBarGfx())
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

  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    const [x, y, w, h] = rect

    const progress = Math.min(1, pw.activeSim.stepCount / STEPS_BEFORE_BRANCH)

    ctx.fillStyle = 'white'
    ctx.fillRect(x, y, w, h)

    ctx.fillStyle = '#ccc'
    ctx.fillRect(x, y, w * progress, h)

    const steps = pw.activeSim.stepCount
    const seconds = stepsToSeconds(steps)

    ctx.save()
    ctx.translate(x + w / 2, y + h / 2)
    setupRubikText(ctx, h, 'black')
    ctx.fillText(getStatusText(pw, seconds), 0, 0)
    ctx.restore()
  }

  private getCurrentTime(pw: PinballWizard) {
    const steps = pw.activeSim.stepCount
    const seconds = stepsToSeconds(steps)
    const label = formatTime(seconds)
    return label
  }
}
