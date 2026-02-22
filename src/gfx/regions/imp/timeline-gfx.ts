/**
 * @file timeline-gfx.ts
 *
 * Togggleable timeline.
 */

import { topConfig } from 'configs/imp/top-config'
import { drawRoundedRect } from 'gfx/canvas-rounded-rect-util'
import { drawText } from 'gfx/canvas-text-util'
import type { CanvasName } from 'gfx/graphics'
import { Graphics } from 'gfx/graphics'
import { GfxRegion } from 'gfx/regions/gfx-region'
import { settingsPanel } from 'overlay-panels/settings-panel'
import type { PinballWizard, InputId } from 'pinball-wizard'
import { STEP_DURATION } from 'simulation/constants'
import { Timeline } from 'timeline'
import { type Vec2, type Rectangle, rectContainsPoint } from 'util/math-util'

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

  private _setSlider(x: number) {
    const [sx, _sy, sw, _sh] = this.sliderBar
    const fraction = Math.max(0, Math.min(1, (x - sx) / sw))
    const value = Math.floor(fraction * 250)
    const item = topConfig.tree.children.audioLatencySteps
    item.value = value
    item.onChange()
  }

  down(_pw: PinballWizard, mousePos: Vec2, _inputId: InputId): boolean {
    const x = mousePos[0] * window.devicePixelRatio
    const y = mousePos[1] * window.devicePixelRatio
    if (rectContainsPoint(this.inner, x, y)) {
      if (rectContainsPoint(this.sliderBar, x, y)) {
        this._isDragging = true
        this._setSlider(x)
      }

      return true // consume event
    }
    // throw new Error('Method not implemented.')
    return false // do not consume event
  }

  move(_pw: PinballWizard, mousePos: Vec2, _inputId: InputId): void {
    const x = mousePos[0] * window.devicePixelRatio
    const y = mousePos[1] * window.devicePixelRatio
    if (rectContainsPoint(this.sliderBar, x, y)) {
      Graphics.cvs.style.setProperty('cursor', 'pointer')
    }

    if (this._isDragging) {
      this._setSlider(x)
    }
  }

  leave(_pw: PinballWizard, mousePos: Vec2, _inputId: InputId): void {
    const x = mousePos[0] * window.devicePixelRatio
    if (this._isDragging) {
      this._setSlider(x)
    }
  }

  up(_pw: PinballWizard, _mousePos: Vec2, _inputId: InputId): void {
    this._isDragging = false
  }

  private readonly inner: Rectangle = [0, 0, 1, 1]
  private readonly sliderBar: Rectangle = [0, 0, 1, 1]
  private readonly slider: Rectangle = [0, 0, 1, 1]

  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    const [x, y, w, h] = rect

    const dpr = window.devicePixelRatio
    const size = Math.min(360 * dpr, 0.9 * Math.min(w, h)) * Graphics.stgAnim

    // // debug
    // const sizeInPx = size / dpr
    // console.log('size in px', sizeInPx)

    const { inner, sliderBar, slider } = this

    const centerX = x + w / 2
    const centerY = y + h / 2

    inner[0] = centerX - size / 2
    inner[1] = centerY - size / 2
    inner[2] = size
    inner[3] = size
    // ctx.fillRect(...inner )

    const sliderPadding = 40 * dpr
    const sliderThickness = 40 * dpr * 0.8
    sliderBar[0] = inner[0] + sliderPadding
    sliderBar[1] = centerY - sliderThickness / 2
    sliderBar[2] = inner[2] - 2 * sliderPadding
    sliderBar[3] = sliderThickness

    const fraction = topConfig.flatConfig.audioLatencySteps / 250
    const sliderWidth = sliderBar[3]
    const sliderMotionWidth = sliderBar[2] - sliderWidth
    slider[0] = sliderBar[0] + fraction * sliderMotionWidth
    slider[1] = sliderBar[1]
    slider[2] = sliderWidth
    slider[3] = sliderBar[3]

    drawRoundedRect(ctx, inner, false, false, true)

    if (Graphics.stgAnim < 0.5) return // skip drawing any contents when small

    // drawRoundedRect(ctx, topLabel, false, false, true)
    // drawRoundedRect(ctx, sliderLabel, false, false, true)
    drawRoundedRect(ctx, sliderBar, false, false, true)
    drawRoundedRect(ctx, slider, this._isDragging, false, false)
    // drawRoundedRect(ctx, details, false, false, true)
  }
}
