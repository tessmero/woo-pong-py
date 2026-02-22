/**
 * @file timeline.ts
 *
 * Draggable timeline.
 */

import type { InputId } from 'pinball-wizard'

export class Timeline {
  public static isShowing = true
  public static draggingId: InputId | null = null

  // public static isLocked = false

  public static get isDragging() {
    return this.draggingId !== null
  }

  public static drawScale = 1 // set in scrollbar-gfx.ts
}
