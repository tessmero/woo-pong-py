/**
 * @file glass-gfx.ts
 *
 * Region in front of other regions.
 */

import type { PinballWizard } from 'pinball-wizard'
import { GfxRegion } from '../gfx-region'
import type { Rectangle, Vec2 } from 'util/math-util'

export class GlassGfx extends GfxRegion {
  static {
    GfxRegion.register('glass-gfx', () => new GlassGfx())
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
    ctx.globalCompositeOperation = 'copy'
    ctx.fillStyle = 'rgba(255,0,0,.1)'
    ctx.fillRect(...rect)
  }
}
