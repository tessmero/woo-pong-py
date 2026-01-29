/**
 * @file bottom-bar-gfx.ts
 *
 * Controls along the bottom of the screen.
 */

import { GfxRegion } from '../gfx-region'

export class BottomBarGfx extends GfxRegion {
  static {
    GfxRegion.register('bottom-bar-gfx', () => new BottomBarGfx())
  }
}
