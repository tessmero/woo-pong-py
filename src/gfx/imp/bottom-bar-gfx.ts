/**
 * @file bottom-bar-gfx.ts
 *
 * Controls along the bottom of the screen.
 */

import { rectContainsPoint, type Rectangle, type Vec2 } from 'util/math-util'
import { GfxRegion } from '../gfx-region'
import type { PinballWizard } from 'pinball-wizard'

const LAYOUT_KEYS = ['bsp', 'clock', 'pause', 'play', 'fast', 'faster'] as const
type LayoutKey = (typeof LAYOUT_KEYS)[number]
type Layout = Record<LayoutKey, Rectangle>

export class BottomBarGfx extends GfxRegion {
  static {
    GfxRegion.register('bottom-bar-gfx', () => new BottomBarGfx())
  }

  down(pw: PinballWizard, mousePos: Vec2) {
    console.log('bottom bar down', this._hovered)
    this._held = this._hovered
  }

  private _hovered: LayoutKey | null = null
  private _held: LayoutKey | null = null
  private readonly _active: Set<LayoutKey> = new Set()
  move(pw: PinballWizard, mousePos: Vec2) {
    // console.log('bottom-bar move', JSON.stringify(mousePos))

    this._hovered = null
    if (!this._layout) return

    for (const [key, rect] of Object.entries(this._layout)) {
      if (rectContainsPoint(rect, ...mousePos.map(v => v * window.devicePixelRatio) as Vec2)) {
        this._hovered = key as LayoutKey
        console.log('bottom bar hoevered', key)
        return
      }
    }
  }

  leave(pw: PinballWizard, mousePos: Vec2) {
    this._hovered = null
  }

  up(pw: PinballWizard, mousePos: Vec2) {
    this._held = null
  }

  onResize(rect: Rectangle): void {
    this._computeLayout(rect)
  }

  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    ctx.clearRect(...rect)

    ctx.lineWidth = 4
    ctx.strokeStyle = 'green'
    ctx.strokeRect(...rect)

    if (!this._layout) return
    for (const [btnName, innerRect] of Object.entries(this._layout)) {
      const isHovered = this._hovered === btnName
      ctx.strokeStyle = isHovered ? 'red' : 'blue'
      ctx.strokeRect(...innerRect)

      const isHeld = this._held === btnName
      if (isHeld) {
        ctx.fillRect(...innerRect)
      }
    }
  }

  private _layout: Layout | null = null
  private _computeLayout(rect: Rectangle) {
    const [x, y, w, h] = rect
    const clockWidthFactor = 3 // how many btn widths in clock width
    const btnWidth = w / (5 + clockWidthFactor)
    const clockWidth = btnWidth * clockWidthFactor
    this._layout = {
      bsp: [x, y, btnWidth, h],
      clock: [x + btnWidth, y, clockWidth, h],
      pause: [x + btnWidth + clockWidth, y, btnWidth, h],
      play: [x + btnWidth + clockWidth + btnWidth, y, btnWidth, h],
      fast: [x + btnWidth + clockWidth + 2 * btnWidth, y, btnWidth, h],
      faster: [x + btnWidth + clockWidth + 3 * btnWidth, y, btnWidth, h],
    }
  }
}

// const ethBtns: Array<PlayingElem> = [
//   ...Object.values(speedBtns),
// ]
