/**
 * @file top-bar-gfx.ts
 *
 * Controls along the top of the screen.
 */

import type { PinballWizard } from 'pinball-wizard'
import { rectContainsPoint, type Rectangle, type Vec2 } from 'util/math-util'
import { SECONDS_BEFORE_BRANCH, STEPS_BEFORE_BRANCH, stepsToSeconds } from 'simulation/constants'

import { Graphics, gutterPx, OBSTACLE_FILL } from 'gfx/graphics'
import { drawRoundedRect, fillFrameBetweenRectAndRounded, ROUNDED_RECT_PADDING } from 'gfx/canvas-rounded-rect-util'
import { BUTTON_ICONS } from 'gfx/button-icons'
import { drawButton } from 'gfx/icons-gfx-util'
import { shortVibrate } from 'util/vibrate'
import { settingsPanel } from 'overlay-panels/settings-panel'
import { GfxRegion } from '../gfx-region'
import { drawText } from 'gfx/canvas-text-util'
import { ballSelectionPanel } from 'overlay-panels/ball-selection-panel'
import { scorePanel } from 'overlay-panels/score-panel'
import { ballPartyPanel } from 'overlay-panels/ball-party-panel'

type ButtonSpec = {
  activeChecker: (pw: PinballWizard) => boolean
  clickAction: (pw: PinballWizard) => void
}

const _BUTTONS = {
  settings: {
    activeChecker: () => settingsPanel.isShowing,
    clickAction: (pw: PinballWizard) => {
      if (!settingsPanel.isShowing) {
        shortVibrate(pw)
      }
      settingsPanel.toggle(pw)
    },
  },
  home: {
    activeChecker: (pw: PinballWizard) => pw.gameState === 'home',
    clickAction: (pw: PinballWizard) => {
      if (pw.gameState === 'home') {
        pw.gameState = 'playing'
      }
      else {
        pw.gameState = 'home'
      }
      pw.reset()
    },
  },
  score: {
    activeChecker: () => scorePanel.isShowing,
    clickAction: (pw: PinballWizard) => {
      if (!scorePanel.isShowing) {
        shortVibrate(pw)
      }
      scorePanel.toggle(pw)
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
  playAgain: {
    activeChecker: pw => pw.activeSim.winningDiskIndex !== -1,
    clickAction: (pw) => {
      ballSelectionPanel.hide(pw, true)
      shortVibrate(pw)
      pw.reset()
      Graphics.targetBspAnim = 0
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
      home: [x + btnWidth, y, btnWidth, h], // test
      score: [x + 2 * btnWidth, y, btnWidth, h], // test
      party: [x + 3 * btnWidth, y, btnWidth, h], // test
      playAgain: [x + w - 2 * btnWidth, y, 2 * btnWidth, h],
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
    return pw.activeSim && pw.activeSim.stepCount > 0
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

    const label = getStatusText(pw)
    // const label = `step ${pw.activeSim._stepCount}`
    // debug
    // const label = `${Scrollbar.isDragging}`
    drawText(ctx, rect, label)
  }
}

const pad = 8
const _padded: Rectangle = [0, 0, 1, 1]

function getStatusText(
  pw: PinballWizard,
) {
  const maxSteps = pw.activeSim._maxStepCount // maximum reached step count
  if (maxSteps >= STEPS_BEFORE_BRANCH) {
    // user passed branching points and may have rewinded
    if (pw.activeSim.winningDiskIndex !== -1) {
      return 'finished'
    }
    return `Choice locked`
  }

  const steps = pw.activeSim.stepCount // displayed step count
  const secondsElapsed = stepsToSeconds(steps)
  const remainingSeconds = SECONDS_BEFORE_BRANCH - secondsElapsed

  if (pw.activeSim.winningDiskIndex !== -1) {
    return 'finished'
  }
  if (pw.isHalted) {
    return `you must choose a ball`
  }
  const i = pw.selectedDiskIndex
  if (i === -1) {
    return `${remainingSeconds} sec choose a ball`
  }
  if (pw.hasBranched) {
    return `Choice locked`
  }

  // const patternName = pinballWizard.activeSim.disks[i].pattern
  return `${remainingSeconds} sec to reconsider`
}

