
/**
 * @file scrollbar-gfx.ts
 *
 * Graphics region for scrollbars.
 */

import { GfxRegion } from '../gfx-region'

export class ScrollbarGfx extends GfxRegion {
	static {
		GfxRegion.register('scrollbar-gfx', () => new ScrollbarGfx())
	}
}
