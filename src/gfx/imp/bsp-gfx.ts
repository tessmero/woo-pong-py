
/**
 * @file bsp-gfx.ts
 *
 * Graphics region for BSP (Binary Space Partitioning) visuals.
 */

import { GfxRegion } from '../gfx-region'

export class BspGfx extends GfxRegion {
	static {
		GfxRegion.register('bsp-gfx', () => new BspGfx())
	}
}
