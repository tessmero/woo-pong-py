/**
 * @file bottom-bar-gfx.ts
 *
 * Controls along the bottom of the screen.
 */

import { rectContainsPoint, type Rectangle, type Vec2 } from 'util/math-util'
import { GfxRegion } from '../gfx-region'
import type { PinballWizard } from 'pinball-wizard'
import type { IconName } from 'gfx/button-icons'
import { BUTTON_ICONS } from 'gfx/button-icons'
import { Graphics } from 'gfx/graphics'
import { stepsToSeconds } from 'simulation/constants'
import { formatTime } from 'guis/imp/playing-gui'
import { BallSelectionPanel } from 'ball-selection-panel'

const LAYOUT_KEYS = ['bsp', 'clock', 'pause', 'play', 'fast', 'faster'] as const
type LayoutKey = (typeof LAYOUT_KEYS)[number]
type Layout = Record<LayoutKey, Rectangle>

const activeCheckers: Record<LayoutKey, (pw: PinballWizard) => boolean> = {
  bsp: () => false,
  clock: () => false,
  pause: pw => pw.speed === 'paused',
  play: pw => pw.speed === 'normal',
  fast: pw => pw.speed === 'fast',
  faster: pw => pw.speed === 'faster',
}

const clickActions: Record<LayoutKey, (pw: PinballWizard) => void> = {
  bsp: (pw) => { BallSelectionPanel.toggle() },
  clock: () => {},
  pause: (pw) => { pw.speed = 'paused' },
  play: (pw) => { pw.speed = 'normal' },
  fast: (pw) => { pw.speed = 'fast' },
  faster: (pw) => { pw.speed = 'faster' },
}

export class BottomBarGfx extends GfxRegion {
  static {
    GfxRegion.register('bottom-bar-gfx', () => new BottomBarGfx())
  }

  down(pw: PinballWizard, mousePos: Vec2) {
    console.log('bottom bar down', this._hovered)
    this._held = this._hovered

    if (this._held) {
      clickActions[this._held](pw)
    }
  }

  private _hovered: LayoutKey | null = null
  private _held: LayoutKey | null = null
  move(pw: PinballWizard, mousePos: Vec2) {
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

    for (const key of Object.keys(this._layout) as Array<LayoutKey>) {
      const innerRect = this._layout[key]
      const isHovered = this._hovered === key
      const isHeld = this._held === key
      const isActive = activeCheckers[key](pw)

      // Draw button background
      ctx.save()
      if (isActive) {
        ctx.fillStyle = 'black'
        ctx.fillRect(...innerRect)
      }
      else if (isHeld) {
        ctx.globalAlpha = 0.15
        ctx.fillStyle = ctx.strokeStyle
        ctx.fillRect(...innerRect)
      }
      ctx.restore()

      // Draw border
      ctx.strokeStyle = isHovered ? 'red' : (isActive ? 'white' : 'blue')
      ctx.strokeRect(...innerRect)

      if (key === 'clock') {
        // Draw the current time string centered in the rect
        const [x, y, w, h] = innerRect
        ctx.save()
        ctx.font = `bold ${Math.floor(h * 0.55)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = isActive ? 'white' : 'black'
        ctx.fillText(this.getCurrentTime(pw), x + w / 2, y + h / 2)
        ctx.restore()
      }
      else if (BUTTON_ICONS[key]) {
        // Draw icon
        this._drawBtn(ctx, innerRect, key, isActive)
      }
    }
  }

  // Efficient SVG icon rendering: cache per icon as ImageBitmap
  private static _iconCache: Partial<Record<IconName, ImageBitmap | null>> = {}
  private static _iconCachePending: Partial<Record<IconName, Promise<ImageBitmap> | null>> = {}

  /**
   * Draws the icon. Only draws if already loaded (never triggers async load).
   * If active, draws icon in white; otherwise, uses currentColor (black).
   */
  private _drawBtn(ctx: CanvasRenderingContext2D, rect: Rectangle, icon: IconName, active: boolean) {
    const [x, y, w, h] = rect
    const cache = BottomBarGfx._iconCache
    const PADDING_FRAC = 0.18 // 18% padding on each side
    if (cache[icon]) {
      const img = cache[icon]!
      // Calculate padded area
      const padW = w * PADDING_FRAC
      const padH = h * PADDING_FRAC
      const availW = w - 2 * padW
      const availH = h - 2 * padH
      // Maintain aspect ratio
      const imgAspect = img.width / img.height
      const rectAspect = availW / availH
      let drawW = availW, drawH = availH
      if (imgAspect > rectAspect) {
        drawW = availW
        drawH = availW / imgAspect
      }
      else {
        drawH = availH
        drawW = availH * imgAspect
      }
      const drawX = x + (w - drawW) / 2
      const drawY = y + (h - drawH) / 2
      ctx.save()
      if (active) {
        ctx.globalCompositeOperation = 'destination-out'
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH)
      ctx.restore()
    }
    else {
      // Draw a placeholder
      ctx.save()
      ctx.globalAlpha = 0.2
      ctx.fillStyle = '#888'
      ctx.fillRect(x, y, w, h)
      ctx.restore()
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

  /**
   * Preload all icon SVGs as ImageBitmaps. Call this once at startup.
   */
  static async loadAllImages() {
    const iconNames = Object.keys(BUTTON_ICONS) as Array<IconName>
    const cache = BottomBarGfx._iconCache
    const pending = BottomBarGfx._iconCachePending
    const promises: Array<Promise<void>> = []
    for (const icon of iconNames) {
      if (!cache[icon] && !pending[icon]) {
        const svg = BUTTON_ICONS[icon]
        const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(svgBlob)
        const img = new window.Image()
        pending[icon] = new Promise<ImageBitmap>((resolve) => {
          img.onload = () => {
            createImageBitmap(img).then((bitmap) => {
              cache[icon] = bitmap
              resolve(bitmap)
              URL.revokeObjectURL(url)
            })
          }
          img.onerror = () => {
            cache[icon] = null
            resolve(null as any)
            URL.revokeObjectURL(url)
          }
          img.src = url
        })
        promises.push(pending[icon]!.then(() => {}))
      }
    }
    await Promise.all(promises)
  }
}

// const ethBtns: Array<PlayingElem> = [
//   ...Object.values(speedBtns),
// ]
