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
import { drawButton as drawIconOnButton } from 'gfx/icons-gfx-util'
import { ballSelectionPanel } from 'overlay-panels/ball-selection-panel'
import { settingsPanel } from 'overlay-panels/settings-panel'
import { Timeline } from 'timeline'

type ButtonSpec = {
  activeChecker: (pw: PinballWizard) => boolean
  clickAction: (pw: PinballWizard, xFrac: number) => void
}

const _BUTTONS = {
  bsp: {
    activeChecker: () => ballSelectionPanel.isShowing,
    clickAction: (pw: PinballWizard, _xFrac: number) => {
      shortVibrate(pw)
      ballSelectionPanel.toggle(pw)
    },
  },
  clock: {
    activeChecker: () => Timeline.isShowing,
    clickAction: (pw: PinballWizard, _xFrac: number) => {
      shortVibrate(pw)
      Timeline.toggle()
    },
  },
  pause: {
    activeChecker: (pw: PinballWizard) => pw.speed === 'paused',
    clickAction: (pw: PinballWizard, _xFrac: number) => { pw.speed = 'paused' },
  },
  play: {
    activeChecker: (pw: PinballWizard) => pw.speed === 'normal',
    clickAction: (pw: PinballWizard, _xFrac: number) => { pw.speed = 'normal' },
  },
  fast: {
    activeChecker: (pw: PinballWizard) => pw.speed === 'fast',
    clickAction: (pw: PinballWizard, _xFrac: number) => { pw.speed = 'fast' },
  },
  faster: {
    activeChecker: (pw: PinballWizard) => pw.speed === 'faster',
    clickAction: (pw: PinballWizard, _xFrac: number) => { pw.speed = 'faster' },
  },
} as const satisfies Record<string, ButtonSpec>

type LayoutKey = keyof typeof _BUTTONS
type Layout = Record<LayoutKey, Rectangle>

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

  down(pw: PinballWizard, mousePos: Vec2) {
    // console.log('bottom bar down', this._hovered)
    this._held = this._hovered

    if (this._held) {
      const rect = this._layout![this._held]
      const xFrac = (mousePos[0] * window.devicePixelRatio - rect[0]) / rect[2]
      _BUTTONS[this._held].clickAction(pw, xFrac)
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
        if (key !== 'clock' && !_BUTTONS[key as LayoutKey].activeChecker(pw)) {
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

  public override shouldDraw(pw: PinballWizard): boolean {
    return pw.activeSim && pw.activeSim.stepCount > 0
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
      const isActive = _BUTTONS[key].activeChecker(pw)

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
        isHovered,
        false, // key === 'clock', // no light/shadow slivers for clock
      )

      // // Draw border
      // ctx.strokeStyle = isHovered ? 'red' : (isActive ? 'white' : 'blue')
      // ctx.strokeRect(...innerRect)

      if (key === 'clock') {
        const [x, y, w, h] = innerRect

        // Draw the current time string centered in the rect
        ctx.save()
        ctx.translate(x + w / 2, y + h / 2)
        setupRubikText(ctx, h, 'black')// isActive ? 'white' : 'black')
        ctx.fillText(this.getCurrentTime(pw), 0, 0)
        ctx.restore()
      }
      else if (BUTTON_ICONS[key]) {
        // Draw icon
        drawIconOnButton(ctx, innerRect, key, isActive)
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
