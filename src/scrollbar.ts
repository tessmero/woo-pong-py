/**
 * @file scrollbar.ts
 *
 * Scrollbar with dedicated canvas similar to graphics.ts.
 */

import type { InputId } from 'pinball-wizard'

export class Scrollbar {
  public static isDragging: InputId | null = null

  public static drawScale = 1 // set in scrollbar-gfx.ts
}
