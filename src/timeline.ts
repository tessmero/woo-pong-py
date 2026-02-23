/**
 * @file timeline.ts
 *
 * Draggable timeline.
 */

import type { InputId } from 'pinball-wizard'

export class Timeline {
  private static _isShowing = false
  public static get isShowing() { return this._isShowing }
  public static draggingId: InputId | null = null

  // public static isLocked = false

  public static toggle() {
    if (Timeline._isShowing) {
      Timeline.hide()
    }
    else {
      Timeline.show()
    }
  }

  public static show() {
    Timeline._isShowing = true
  }

  public static hide() {
    Timeline._isShowing = false
  }

  public static get isDragging() {
    return this.draggingId !== null
  }

  public static drawScale = 1 // set in scrollbar-gfx.ts
}
