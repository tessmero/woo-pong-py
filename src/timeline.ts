/**
 * @file timeline.ts
 *
 * Draggable timeline.
 */

import type { InputId } from 'pinball-wizard'

let _isShowing = false
let _anim = 0 // opacity
const animSpeed = 1e-2 // fraction per ms
let lastAnimTime = 0 // system time

export class Timeline {
  public static draggingId: InputId | null = null

  // logical state
  public static get isShowing() { return _isShowing }

  // opacity
  public static get anim(): number { return _anim }

  public static updateAnim() {
    const targetAnim = _isShowing ? 1 : 0
    if (_anim === targetAnim) return

    const t = performance.now()
    const dt = t - lastAnimTime
    lastAnimTime = t
    const delta = dt * animSpeed * (_isShowing ? 1 : -1)
    _anim = Math.min(1, Math.max(0, _anim + delta))
  }

  // public static isLocked = false

  public static toggle() {
    if (_isShowing) {
      Timeline.hide()
    }
    else {
      Timeline.show()
    }
  }

  public static show() {
    lastAnimTime = performance.now()
    _isShowing = true
  }

  public static hide() {
    lastAnimTime = performance.now()
    _isShowing = false
  }

  public static get isDragging() {
    return this.draggingId !== null
  }

  public static drawScale = 1 // set in scrollbar-gfx.ts
}
