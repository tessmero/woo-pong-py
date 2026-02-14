/**
 * @file bottom-bar-gfx.ts
 *
 * Controls along the bottom of the screen.
 */

import { rectContainsPoint, type Rectangle, type Vec2 } from 'util/math-util'
import { GfxRegion } from '../gfx-region'
import type { PinballWizard } from 'pinball-wizard'
import { BUTTON_ICONS } from 'gfx/button-icons'
import { Graphics, gutterPx } from 'gfx/graphics'

import { stepsToSeconds } from 'simulation/constants'
import { formatTime } from 'guis/imp/playing-gui'
import { setupRubikText } from '../../canvas-text-util'
import { drawRoundedRect, ROUNDED_RECT_PADDING } from 'gfx/canvas-rounded-rect-util'
import { shortVibrate } from 'util/vibrate'
import { drawButton } from 'gfx/btn-gfx-util'
import { ballSelectionPanel } from 'overlay-panels/ball-selection-panel'
import { settingsPanel } from 'overlay-panels/settings-panel'

const _LAYOUT_KEYS = ['bsp', 'clock', 'pause', 'play', 'fast', 'faster'] as const
type LayoutKey = (typeof _LAYOUT_KEYS)[number]
type Layout = Record<LayoutKey, Rectangle>

const activeCheckers: Record<LayoutKey, (pw: PinballWizard) => boolean> = {
  bsp: () => ballSelectionPanel.isShowing,
  clock: () => false,
  pause: pw => pw.speed === 'paused',
  play: pw => pw.speed === 'normal',
  fast: pw => pw.speed === 'fast',
  faster: pw => pw.speed === 'faster',
}

const clickActions: Record<LayoutKey, (pw: PinballWizard) => void> = {
  bsp: (pw) => {
    if (!ballSelectionPanel.isShowing) {
      shortVibrate(pw)
    }
    ballSelectionPanel.toggle(pw)
  },
  clock: () => {
    // do nothing
  },
  pause: (pw) => { pw.speed = 'paused' },
  play: (pw) => { pw.speed = 'normal' },
  fast: (pw) => { pw.speed = 'fast' },
  faster: (pw) => { pw.speed = 'faster' },
}

export class BottomBarGfx extends GfxRegion {
  static {
    GfxRegion.register('bottom-bar-gfx', () => new BottomBarGfx())
  }

  public tsLocateElement(id: string): Rectangle | undefined {
    id = id.replace('Btn', '')
    if (this._layout && this._layout[id]) {
      const [x, y, w, h] = this._layout[id]
      return [
        x / window.devicePixelRatio + Graphics.cssLeft,
        y / window.devicePixelRatio,
        w, h,
      ]
    }
  }

  down(pw: PinballWizard, _mousePos: Vec2) {
    // console.log('bottom bar down', this._hovered)
    this._held = this._hovered

    if (this._held) {
      clickActions[this._held](pw)
    }
    return false
  }

  private _hovered: LayoutKey | null = null
  private _held: LayoutKey | null = null
  move(pw: PinballWizard, mousePos: Vec2) {
    if (ballSelectionPanel.isShowing || settingsPanel.isShowing) {
      this._hovered = null
      this._held = null
      return
    }
    // console.log('bottom-bar move', JSON.stringify(mousePos))

    this._hovered = null
    if (!this._layout) return

    for (const [key, rect] of Object.entries(this._layout)) {
      if (rectContainsPoint(rect, ...mousePos.map(v => v * window.devicePixelRatio) as Vec2)) {
        this._hovered = key as LayoutKey
        if (key !== 'clock' && !activeCheckers[key](pw)) {
          Graphics.cvs.style.setProperty('cursor', 'pointer')
        }
        return
      }
    }
  }

  private getCurrentTime(pw: PinballWizard) {
    const steps = pw.activeSim.stepCount
    const seconds = stepsToSeconds(steps)
    const label = formatTime(seconds)
    return label
  }

  leave(_pw: PinballWizard, _mousePos: Vec2) {
    this._hovered = null
  }

  up(_pw: PinballWizard, _mousePos: Vec2) {
    this._held = null
  }

  override onResize(rect: Rectangle): void {
    this._computeLayout(rect)
  }

  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    // ctx.clearRect(...rect)

    ctx.fillStyle = '#888'
    ctx.fillRect(...rect)

    // ctx.lineWidth = 4
    // ctx.strokeStyle = 'green'
    // ctx.strokeRect(...rect)

    if (!this._layout) return

    for (const key of Object.keys(this._layout) as Array<LayoutKey>) {
      const innerRect = this._layout[key]
      const isHovered = this._hovered === key
      // const isHeld = this._held === key
      const isActive = activeCheckers[key](pw)

      // // Draw button background
      // ctx.save()
      // if (isActive) {
      //   ctx.fillStyle = 'black'
      //   ctx.fillRect(...innerRect)
      // }
      // else if (isHeld) {
      //   ctx.globalAlpha = 0.15
      //   ctx.fillStyle = ctx.strokeStyle
      //   ctx.fillRect(...innerRect)
      // }
      // ctx.restore()

      drawRoundedRect(ctx, innerRect, isActive,
        isHovered && key !== 'clock', // no change when hovering over clock
        key === 'clock', // no light/shadow slivers for clock
      )

      // // Draw border
      // ctx.strokeStyle = isHovered ? 'red' : (isActive ? 'white' : 'blue')
      // ctx.strokeRect(...innerRect)

      if (key === 'clock') {
        // Draw the current time string centered in the rect
        const [x, y, w, h] = innerRect
        ctx.save()
        ctx.translate(x + w / 2, y + h / 2)
        setupRubikText(ctx, h, 'black')// isActive ? 'white' : 'black')
        ctx.fillText(this.getCurrentTime(pw), 0, 0)
        ctx.restore()
      }
      else if (BUTTON_ICONS[key]) {
        // Draw icon
        drawButton(ctx, innerRect, key, isActive)
      }
    }
  }

  private _layoutBounds: Rectangle = [1, 1, 1, 1]
  private _layout: Layout | null = null
  private _computeLayout(rect: Rectangle) {
    this._layoutBounds = rect
    const dpr = window.devicePixelRatio
    const shrinkX = (gutterPx + 2) * dpr
    const shrinkY = (ROUNDED_RECT_PADDING + 2) * dpr

    let [x, y, w, h] = rect
    x += shrinkX
    y += shrinkY
    w -= 2 * shrinkX
    h -= 2 * shrinkY

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
