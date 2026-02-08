/**
 * @file settings-gfx.ts
 *
 * Setttings panel.
 */

import { GfxRegion } from 'gfx/gfx-region'
import type { PinballWizard, InputId } from 'pinball-wizard'
import type { Vec2, Rectangle } from 'util/math-util'

export class SettingsGfx extends GfxRegion {
  static {
    GfxRegion.register('settings-gfx', () => new SettingsGfx())
  }

  _entranceStartTime = 0
  startEntrance() {
    this._entranceStartTime = performance.now()
  }

  _exitStartTime = 0
  startExit() {
    this._exitStartTime = performance.now()
  }

  down(pw: PinballWizard, mousePos: Vec2, inputId: InputId): boolean {
    // throw new Error('Method not implemented.')
    return false // do not consume event
  }

  move(pw: PinballWizard, mousePos: Vec2, inputId: InputId): void {
    // throw new Error('Method not implemented.')
  }

  leave(pw: PinballWizard, mousePos: Vec2, inputId: InputId): void {
    // throw new Error('Method not implemented.')
  }

  up(pw: PinballWizard, mousePos: Vec2, inputId: InputId): void {
    // throw new Error('Method not implemented.')
  }

  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    const [x, y, w, h] = rect

    ctx.fillStyle = 'red'
    ctx.fillRect(x + 100, y + 100, 100, 100)
  }
}
