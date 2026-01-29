
/**
 * @file top-bar-gfx.ts
 *
 * Controls along the top of the screen.
 */

import { PinballWizard } from 'pinball-wizard'
import { GfxRegion } from '../gfx-region'
import { Rectangle, Vec2 } from 'util/math-util'

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
		// do nothing
	  }
}
