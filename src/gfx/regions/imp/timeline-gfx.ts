/**
 * @file timeline-gfx.ts
 *
 * Togggleable timeline.
 */

import { topConfig } from 'configs/imp/top-config'
import { drawRoundedRect } from 'gfx/canvas-rounded-rect-util'
import type { CanvasName } from 'gfx/graphics'
import { Graphics } from 'gfx/graphics'
import { GfxRegion } from 'gfx/regions/gfx-region'
import type { PinballWizard, InputId } from 'pinball-wizard'
import { HISTORY_MAX_STEPS } from 'simulation/constants'
import { Timeline } from 'timeline'
import { type Vec2, type Rectangle, rectContainsPoint, twopi } from 'util/math-util'

let drawCount = 0

export class TimelineGfx extends GfxRegion {
  static {
    GfxRegion.register('timeline-gfx', () => new TimelineGfx())
  }

  override targetCanvas: CanvasName = 'main'
  override shouldDraw() {
    return Timeline.isShowing
  }

  _entranceStartTime = 0
  startEntrance() {
    this._entranceStartTime = performance.now()
  }

  _exitStartTime = 0
  startExit() {
    this._exitStartTime = performance.now()
  }

  private _isDragging = false

  private _setSlider(pw: PinballWizard, x: number) {
    const [sx, _sy, sw, _sh] = this.sliderBar
    const fraction = Math.max(0, Math.min(1, (x - sx) / sw))

    const stepCount = Math.floor(fraction * HISTORY_MAX_STEPS)
    pw.rewindToStep(stepCount)
  }

  down(pw: PinballWizard, mousePos: Vec2, _inputId: InputId): boolean {
    const x = mousePos[0] * window.devicePixelRatio
    const y = mousePos[1] * window.devicePixelRatio
    if (rectContainsPoint(this.inner, x, y)) {
      if (rectContainsPoint(this.sliderBar, x, y)) {
        this._isDragging = true
        this._setSlider(pw, x)
      }

      return true // consume event
    }
    // throw new Error('Method not implemented.')
    return false // do not consume event
  }

  move(pw: PinballWizard, mousePos: Vec2, _inputId: InputId): void {
    const x = mousePos[0] * window.devicePixelRatio
    const y = mousePos[1] * window.devicePixelRatio
    if (rectContainsPoint(this.sliderBar, x, y)) {
      Graphics.cvs.style.setProperty('cursor', 'pointer')
    }

    if (this._isDragging) {
      this._setSlider(pw, x)
    }
  }

  leave(pw: PinballWizard, mousePos: Vec2, _inputId: InputId): void {
    const x = mousePos[0] * window.devicePixelRatio
    if (this._isDragging) {
      this._setSlider(pw, x)
    }
  }

  up(_pw: PinballWizard, _mousePos: Vec2, _inputId: InputId): void {
    this._isDragging = false
  }

  private readonly inner: Rectangle = [0, 0, 1, 1]
  private readonly sliderBar: Rectangle = [0, 0, 1, 1]
  private readonly slider: Rectangle = [0, 0, 1, 1]

  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    drawCount++
    if (drawCount === 1000) {
      Timeline.hide()
    }

    const [x, y, w, h] = rect

    const dpr = window.devicePixelRatio
    // const size = Math.min(360 * dpr, 0.9 * Math.min(w, h))// * Graphics.stgAnim

    // // debug
    // const sizeInPx = size / dpr
    // console.log('size in px', sizeInPx)

    const { inner, sliderBar, slider } = this

    const centerX = x + w / 2
    const centerY = y + h / 2

    // ctx.fillRect(...inner )

    const sliderPadding = h / 2
    const sliderThickness = h
    sliderBar[0] = x + sliderPadding
    sliderBar[1] = centerY - sliderThickness / 2
    sliderBar[2] = w - 2 * sliderPadding
    sliderBar[3] = sliderThickness

    const fraction = topConfig.flatConfig.audioLatencySteps / 250
    const sliderWidth = sliderBar[3]
    const sliderMotionWidth = sliderBar[2] - sliderWidth
    slider[0] = sliderBar[0] + fraction * sliderMotionWidth
    slider[1] = sliderBar[1]
    slider[2] = sliderWidth
    slider[3] = sliderBar[3]

    const padding = h / 4
    inner[0] = x + padding
    inner[1] = y + padding
    inner[2] = w - 2 * padding
    inner[3] = h - 2 * padding
    // drawRoundedRect(ctx, inner, false, false, true)

    // if (Graphics.stgAnim < 0.5) return // skip drawing any contents when small

    // drawRoundedRect(ctx, topLabel, false, false, true)
    // drawRoundedRect(ctx, sliderLabel, false, false, true)

    // drawRoundedRect(ctx, sliderBar, false, false, true)
    _drawTimelineBar(ctx, pw, sliderBar, false, false)

    // drawRoundedRect(ctx, slider, this._isDragging, false, false)

    // drawRoundedRect(ctx, details, false, false, true)
  }
}

function _drawTimelineBar(
  ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle,
  isActive = false, isHovered = false,
) {
  const [x, y, w, h] = rect

  const x0 = x
  const x1 = x + w
  const thick = h / 10
  const y0 = y + h / 2 - thick / 2

  const cy = y + h / 2

  // draw draggable timeline
  const timeFrac = pw.activeSim.stepCount / HISTORY_MAX_STEPS
  const playedWidth = (x1 - x0) * timeFrac

  ctx.lineCap = 'round'
  ctx.lineWidth = thick

  // ctx.fillStyle = 'blue'
  // ctx.fillRect(x0, y0, playedWidth, thick)
  ctx.beginPath()
  ctx.moveTo(x0 + playedWidth, cy)
  ctx.lineTo(x1, cy)
  ctx.strokeStyle = 'gray'
  ctx.stroke()

  // ctx.fillStyle = 'red'
  // ctx.fillRect(x0, y0, x1 - x0, thick)
  ctx.beginPath()
  ctx.moveTo(x0, cy)
  ctx.lineTo(x0 + playedWidth, cy)
  ctx.strokeStyle = 'red'
  ctx.stroke()

  ctx.beginPath()
  const rad = h / 6
  ctx.arc(x0 + playedWidth, cy, rad, 0, twopi)
  ctx.fillStyle = 'red'
  ctx.fill()
}
