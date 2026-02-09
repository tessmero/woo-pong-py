/**
 * @file settings-gfx.ts
 *
 * Setttings panel.
 */

import { topConfig } from 'configs/imp/top-config'
import { drawRoundedRect } from 'gfx/canvas-rounded-rect-util'
import { drawText } from 'gfx/canvas-text-util'
import { Graphics } from 'gfx/graphics'
import { GfxRegion } from 'gfx/regions/gfx-region'
import type { PinballWizard, InputId } from 'pinball-wizard'
import { STEP_DURATION } from 'simulation/constants'
import { type Vec2, type Rectangle, rectContainsPoint } from 'util/math-util'

export class SettingsGfx extends GfxRegion {
  static {
    GfxRegion.register('settings-gfx', () => new SettingsGfx())
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
    const [sx, sy, sw, sh] = this.sliderBar
    const fraction = Math.max(0, Math.min(1, (x - sx) / sw))
    const value = Math.floor(fraction * 250)
    const item = topConfig.tree.children.audioLatencySteps
    item.value = value
    item.onChange()
  }

  down(pw: PinballWizard, mousePos: Vec2, inputId: InputId): boolean {
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

  move(pw: PinballWizard, mousePos: Vec2, inputId: InputId): void {
    const x = mousePos[0] * window.devicePixelRatio
    const y = mousePos[1] * window.devicePixelRatio
    if (rectContainsPoint(this.sliderBar, x, y)) {
      Graphics.cvs.style.setProperty('cursor', 'pointer')
    }

    if (this._isDragging) {
      this._setSlider(x)
    }
  }

  leave(pw: PinballWizard, mousePos: Vec2, inputId: InputId): void {
    const x = mousePos[0] * window.devicePixelRatio
    if (this._isDragging) {
      this._setSlider(x)
    }
  }

  up(pw: PinballWizard, mousePos: Vec2, inputId: InputId): void {
    this._isDragging = false
  }

  private readonly inner: Rectangle = [0, 0, 1, 1]
  private readonly topLabel: Rectangle = [0, 0, 1, 1]
  private readonly sliderBar: Rectangle = [0, 0, 1, 1]
  private readonly slider: Rectangle = [0, 0, 1, 1]
  private readonly sliderLabel: Rectangle = [0, 0, 1, 1]
  private readonly details: Rectangle = [0, 0, 1, 1]

  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    const [x, y, w, h] = rect

    const dpr = window.devicePixelRatio
    const size = Math.min(360 * dpr, 0.9 * Math.min(w, h)) * Graphics.stgAnim

    // // debug
    // const sizeInPx = size / dpr
    // console.log('size in px', sizeInPx)

    const { inner, sliderBar, slider, topLabel, sliderLabel, details } = this

    const centerX = x + w / 2
    const centerY = y + h / 2

    inner[0] = centerX - size / 2
    inner[1] = centerY - size / 2
    inner[2] = size
    inner[3] = size
    // ctx.fillRect(...inner )

    topLabel[0] = inner[0]
    topLabel[1] = inner[1]
    topLabel[2] = inner[2]
    topLabel[3] = 40 * dpr

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

    sliderLabel[0] = sliderBar[0]
    sliderLabel[1] = sliderBar[1] - sliderBar[3]
    sliderLabel[2] = sliderBar[2]
    sliderLabel[3] = sliderBar[3]

    details[0] = sliderBar[0]
    details[1] = sliderBar[1] + sliderBar[3]
    details[2] = sliderBar[2]
    details[3] = sliderBar[3]

    drawRoundedRect(ctx, inner, false, false, true)

    if (Graphics.stgAnim < 0.5) return // skip drawing any contents when small

    // drawRoundedRect(ctx, topLabel, false, false, true)
    // drawRoundedRect(ctx, sliderLabel, false, false, true)
    drawRoundedRect(ctx, sliderBar, false, false, true)
    drawRoundedRect(ctx, slider, this._isDragging, false, false)
    // drawRoundedRect(ctx, details, false, false, true)

    if (Graphics.stgAnim < 1) return // skip drawing labels when small
    drawText(ctx, topLabel, 'SETTINGS')
    drawText(ctx, sliderLabel, 'Audio Latency Correction')

    const alc = Math.round(topConfig.flatConfig.audioLatencySteps * STEP_DURATION)
    drawText(ctx, details, `${alc} ms`)
    details[1] += details[3] * 2
    drawText(ctx, details, 'used to correct for delay')
    details[1] += details[3] * 0.8
    drawText(ctx, details, 'when using wireless earbuds')
  }
}
