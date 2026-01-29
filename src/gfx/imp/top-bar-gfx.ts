
/**
 * @file top-bar-gfx.ts
 *
 * Controls along the top of the screen.
 */

import { GfxRegion } from '../gfx-region'

export class TopBarGfx extends GfxRegion {
	static {
		GfxRegion.register('top-bar-gfx', () => new TopBarGfx())
	}
}
