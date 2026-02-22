/**
 * @file top-bar-gfx.ts
 *
 * Controls along the top of the screen.
 */

import type { PinballWizard } from 'pinball-wizard'
import { rectContainsPoint, type Rectangle, type Vec2 } from 'util/math-util'
import { STEPS_BEFORE_BRANCH, stepsToSeconds } from 'simulation/constants'

import { formatTime, getStatusText } from 'guis/imp/playing-gui'
import { Graphics, gutterPx, OBSTACLE_FILL } from 'gfx/graphics'
import { drawRoundedRect, fillFrameBetweenRectAndRounded, ROUNDED_RECT_PADDING } from 'gfx/canvas-rounded-rect-util'
import { BUTTON_ICONS } from 'gfx/button-icons'
import { drawButton } from 'gfx/icons-gfx-util'
import { shortVibrate } from 'util/vibrate'
import { settingsPanel } from 'overlay-panels/settings-panel'
import { GfxRegion } from '../gfx-region'
import { drawText } from 'gfx/canvas-text-util'
import { ballSelectionPanel } from 'overlay-panels/ball-selection-panel'

const _LAYOUT_KEYS = ['settings', 'status'] as const
type LayoutKey = (typeof _LAYOUT_KEYS)[number]
type Layout = Record<LayoutKey, Rectangle>

const activeCheckers: Record<LayoutKey, (pw: PinballWizard) => boolean> = {
  settings: () => settingsPanel.isShowing,
  status: () => false,
}

const clickActions: Record<LayoutKey, (pw: PinballWizard) => void> = {
  settings: (pw) => {
    // console.log('top-bar-gfx clickActions.settings')
    if (!settingsPanel.isShowing) {
      shortVibrate(pw)
    }
    settingsPanel.toggle(pw)
  },
  status: () => {
    // do nothing
  },
}

export class TopBarGfx extends GfxRegion {
  static {
    GfxRegion.register('top-bar-gfx', () => new TopBarGfx())
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
      status: [x + btnWidth, y, w - btnWidth, h],
    }
  }

  down(pw: PinballWizard, _mousePos: Vec2) {
    // console.log('top bar down', this._hovered)
    this._held = this._hovered

    if (this._held) {
      clickActions[this._held](pw)
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
        if (key !== 'status' && !activeCheckers[key](pw)) {
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
    return pw.activeSim.stepCount > 0
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

      drawRoundedRect(ctx, innerRect, isActive, isHovered)

      // // Draw border
      // ctx.strokeStyle = isHovered ? 'red' : (isActive ? 'white' : 'blue')
      // ctx.strokeRect(...innerRect)

      if (BUTTON_ICONS[key]) {
        // Draw icon
        drawButton(ctx, innerRect, key, isActive)
      }
    }
  }

  private _drawStatus(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    const [x, y, w, h] = rect

    const progress = Math.min(1, pw.activeSim.stepCount / STEPS_BEFORE_BRANCH)

    ctx.fillStyle = '#ccc'
    // ctx.fillStyle = OBSTACLE_FILL
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2)

    _padded[0] = x + pad
    _padded[1] = y + pad
    _padded[2] = w - 2 * pad
    _padded[3] = h - 2 * pad
    ctx.fillStyle = OBSTACLE_FILL
    fillFrameBetweenRectAndRounded(ctx,
      _padded,
      pad,
    )

    ctx.fillStyle = OBSTACLE_FILL
    ctx.fillRect(x, y, w * progress, h)

    const steps = pw.activeSim.stepCount
    const seconds = stepsToSeconds(steps)

    const label = getStatusText(pw, seconds)
    // debug
    // const label = `${Scrollbar.isDragging}`
    drawText(ctx, rect, label)
  }

  private getCurrentTime(pw: PinballWizard) {
    const steps = pw.activeSim.stepCount
    const seconds = stepsToSeconds(steps)
    const label = formatTime(seconds)
    return label
  }
}

const pad = 8
const _padded: Rectangle = [0, 0, 1, 1]
