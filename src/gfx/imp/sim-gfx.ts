
/**
 * @file sim-gfx.ts
 *
 * Graphics region for sim (Binary Space Partitioning) visuals.
 */

import { GfxRegion } from '../gfx-region'

export class SimGfx extends GfxRegion {
	static {
		GfxRegion.register('sim-gfx', () => new SimGfx())
	}
}
