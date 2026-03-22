/**
 * @file home-bar-gfx.ts
 *
 * Controls along the top of the screen, replaces top-bar-gfx for home screen.
 */

import type { PinballWizard } from 'pinball-wizard'
import { rectContainsPoint, type Rectangle, type Vec2 } from 'util/math-util'

import { Graphics, gutterPx } from 'gfx/graphics'
import { drawRoundedRect, ROUNDED_RECT_PADDING } from 'gfx/canvas-rounded-rect-util'
import { BUTTON_ICONS } from 'gfx/button-icons'
import { drawButton } from 'gfx/icons-gfx-util'
import { shortVibrate } from 'util/vibrate'
import { settingsPanel } from 'overlay-panels/settings-panel'
import { GfxRegion } from '../gfx-region'
import { drawText } from 'gfx/canvas-text-util'
import { ballSelectionPanel } from 'overlay-panels/ball-selection-panel'
import { ballPartyPanel } from 'overlay-panels/ball-party-panel'
import { saveHomeState } from 'home-screen/local-storage'
import { VALUE_SCALE } from 'simulation/constants'

type ButtonSpec = {
  activeChecker: (pw: PinballWizard) => boolean
  clickAction: (pw: PinballWizard) => void
}

const _BUTTONS = {
  settings: {
    activeChecker: () => settingsPanel.isShowing,
    clickAction: (pw) => {
      if (!settingsPanel.isShowing) {
        shortVibrate(pw)
      }
      settingsPanel.toggle(pw)
    },
  },
  home: {
    activeChecker: pw => pw.gameState === 'home',
    clickAction: (pw) => {
      if (pw.gameState === 'home') {
        pw.gameState = 'playing'
      }
      else {
        pw.gameState = 'home'
      }
      pw.reset()
    },
  },
  addObstacle: {
    activeChecker: pw => false,
    clickAction: (pw) => {
      const x = Math.floor(20 + 60 * Math.random())
      const y = Math.floor(20 + 60 * Math.random())
      pw.homeState.obstacles.push({ shape: 'airplane', pos: [x * VALUE_SCALE, y * VALUE_SCALE] })
      saveHomeState(pw.homeState)
    },
  },
  party: {
    activeChecker: () => ballPartyPanel.isShowing,
    clickAction: (pw: PinballWizard) => {
      if (!ballPartyPanel.isShowing) {
        shortVibrate(pw)
      }
      ballPartyPanel.toggle(pw)
    },
  },
  status: {
    activeChecker: () => false,
    clickAction: () => {
      // do nothing
    },
  },
} as const satisfies Record<string, ButtonSpec>

type LayoutKey = keyof typeof _BUTTONS
type Layout = Record<LayoutKey, Rectangle>

export class HomeBarGfx extends GfxRegion {
  static {
    GfxRegion.register('home-bar-gfx', () => new HomeBarGfx())
  }

  override onResize(rect: Rectangle): void {
    this._computeLayout(rect)
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

    const btnWidth = h
    this._layout = {
      settings: [x, y, btnWidth, h],
      home: [x + btnWidth, y, btnWidth, h], // test
      addObstacle: [x + 2 * btnWidth, y, btnWidth, h], // test
      party: [x + 3 * btnWidth, y, btnWidth, h], // test
      status: [x + 4 * btnWidth, y, w - 4 * btnWidth, h],
    }
  }

  down(pw: PinballWizard, _mousePos: Vec2) {
    // console.log('top bar down', this._hovered)
    this._held = this._hovered

    if (this._held) {
      _BUTTONS[this._held].clickAction(pw)
    }
    return false
  }

  private _hovered: LayoutKey | null = null
  private _held: LayoutKey | null = null
  move(pw: PinballWizard, mousePos: Vec2) {
    // console.log('bottom-bar move', JSON.stringify(mousePos))

    if (ballSelectionPanel.isShowing || settingsPanel.isShowing) {
      this._hovered = null
      this._held = null
      return
    }

    this._hovered = null
    if (!this._layout) return

    for (const [key, rect] of Object.entries(this._layout)) {
      if (rectContainsPoint(rect, ...mousePos.map(v => v * window.devicePixelRatio) as Vec2)) {
        this._hovered = key as LayoutKey
        if (key !== 'status' && !_BUTTONS[key as LayoutKey].activeChecker(pw)) {
          Graphics.cvs.style.setProperty('cursor', 'pointer')
        }
        return
      }
    }
  }

  leave(_pw: PinballWizard, _mousePos: Vec2) {
    this._hovered = null
  }

  up(_pw: PinballWizard, _mousePos: Vec2) {
    this._held = null
  }

  public override shouldDraw(pw: PinballWizard): boolean {
    return pw.activeSim && pw.activeSim.stepCount > 0 && pw.gameState === 'home'
  }

  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    ctx.fillStyle = '#888'
    ctx.fillRect(...rect)

    if (!this._layout) return

    this._drawStatus(ctx, pw, this._layout.status)

    // draw buttons
    for (const key of Object.keys(this._layout) as Array<LayoutKey>) {
      if (key === 'status') continue
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

      drawRoundedRect(ctx, innerRect, isActive, isHovered)

      // // Draw border
      // ctx.strokeStyle = isHovered ? 'red' : (isActive ? 'white' : 'blue')
      // ctx.strokeRect(...innerRect)

      if (BUTTON_ICONS[key]) {
        // Draw icon
        drawButton(ctx, innerRect, key as keyof typeof BUTTON_ICONS, isActive)
      }
      else {
        drawText(ctx, innerRect, key)
      }
    }
  }

  private _drawStatus(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    const [x, y, w, h] = rect

    ctx.fillStyle = '#ccc'
    // ctx.fillStyle = OBSTACLE_FILL
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2)

    const label = 'HOME'
    drawText(ctx, rect, label)
  }
}

const pad = 8
const _padded: Rectangle = [0, 0, 1, 1]
