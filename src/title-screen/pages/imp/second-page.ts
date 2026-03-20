/**
 * @file second-page.ts
 *
 * Test page with dummy content.
 */

import { Page } from '../../page'
import { getPageSourceDimensions } from '../../title-screen'
import { BUTTON_ICONS, type IconName } from '../../../gfx/button-icons'

export class SecondPage extends Page {
  private orderedListStartTimeMs: number | null = null
  private static readonly bulletIconCache = new Map<IconName, HTMLImageElement>()

  static {
    // Register the test page
    Page.register('second-page', () => new SecondPage())
  }

  override getStartButtonPosition(): { x: number, y: number } | null {
    // Position button at 50% width, 88.4% height (centered horizontally, near bottom)
    return { x: 0.5, y: 0.884 }
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (this.orderedListStartTimeMs === null) {
      this.orderedListStartTimeMs = performance.now()
    }

    // Get shared page dimensions
    const dims = getPageSourceDimensions()
    const sourceWidth = dims.width
    const sourceHeight = dims.height

    // Canvas is already sized correctly, fill the entire canvas
    const pageScale = Math.min(w / sourceWidth, h / sourceHeight)
    const drawW = sourceWidth * pageScale
    const drawH = sourceHeight * pageScale
    const drawX = (w - drawW) * 0.5
    const drawY = (h - drawH) * 0.5

    // // Light background
    // ctx.fillStyle = '#f5f5f0'
    // ctx.fillRect(drawX, drawY, drawW, drawH)

    // // Page border
    // ctx.strokeStyle = '#8b7355'
    // ctx.lineWidth = Math.max(1, pageScale * 2)
    // ctx.strokeRect(drawX, drawY, drawW, drawH)

    this._drawOrderedList(ctx, drawX, drawY, drawW, drawH, pageScale)
    // this._drawRaceDiagram(ctx, drawX, drawY, drawW, drawH, pageScale)
  }

  private _drawRaceDiagram(
    ctx: CanvasRenderingContext2D,
    drawX: number,
    drawY: number,
    drawW: number,
    drawH: number,
    _pageScale: number,
  ): void {
    const x = drawX + drawW * 0.8
    const y = drawY + drawH * 0.1
    const w = drawW * 0.1
    const h = drawH * 0.8

    drawFinish(ctx, x, y + 0.8 * h, w)

    ctx.strokeStyle = 'red'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, w, h)
  }

  private _drawOrderedList(
    ctx: CanvasRenderingContext2D,
    drawX: number,
    drawY: number,
    drawW: number,
    drawH: number,
    pageScale: number,
  ): void {
    const startY = drawY + drawH * 0.4
    const itemSpacing = drawH * 0.1
    const leftMargin = drawX + drawW * 0.1
    const nowMs = performance.now()
    const elapsedMs = nowMs - (this.orderedListStartTimeMs ?? nowMs)
    const fadeDurationMs = 200
    const itemStaggerMs = 750

    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.lineWidth = 0.75 * 5 * pageScale
    ctx.strokeStyle = 'black'

    listItems.forEach((item, index) => {
      const y = startY + index * itemSpacing
      const itemElapsedMs = elapsedMs - (index + 1) * itemStaggerMs
      const alpha = Math.max(0, Math.min(1, itemElapsedMs / fadeDurationMs))

      if (alpha <= 0) return

      ctx.save()
      ctx.globalAlpha = alpha

      const iconSize = 35 * 5 * pageScale
      const iconX = drawW - iconSize - 50 * 5 * pageScale
      const iconY = y + 2 * 5 * pageScale
      const icon = SecondPage._getBulletIcon(item.iconName)
      if (icon.complete) {
        ctx.drawImage(icon, iconX, iconY, iconSize, iconSize)
      }

      // Number
      ctx.font = `bold ${20 * 5 * pageScale}px Rubik`
      ctx.fillStyle = '#444'
      ctx.fillText(item.number, leftMargin, y)
      // ctx.strokeText(item.number, leftMargin, y)

      // Title
      ctx.font = `bold ${18 * 5 * pageScale}px Rubik`
      const numberWidth = ctx.measureText(item.number).width
      const titleX = leftMargin + numberWidth + 15 * 5 * pageScale
      ctx.fillStyle = '#444'
      ctx.fillText(item.strong, titleX, y)
      // ctx.strokeText(item.strong, titleX, y)

      // Description
      ctx.font = `${14 * 5 * pageScale}px Rubik`
      ctx.fillStyle = '#666'
      const descriptionY = y + 22 * 5 * pageScale
      ctx.fillText(item.description, titleX, descriptionY)

      ctx.restore()
    })
  }

  private static _toSolidBlackSvg(svg: string): string {
    return svg
      .replace(/currentColor/g, '#000')
      .replace(/fill="none"/g, 'fill="#000"')
  }

  private static _getBulletIcon(iconName: IconName): HTMLImageElement {
    const cached = SecondPage.bulletIconCache.get(iconName)
    if (cached) return cached

    const icon = new Image()
    const solidSvg = SecondPage._toSolidBlackSvg(BUTTON_ICONS[iconName])
    icon.src = `data:image/svg+xml;utf8,${encodeURIComponent(solidSvg)}`
    SecondPage.bulletIconCache.set(iconName, icon)
    return icon
  }
}

const listItems = [
  {
    number: '1.',
    strong: 'Observe',
    description: 'Watch and remain open-minded',
    iconName: 'eye' as const,
  },
  {
    number: '2.',
    strong: 'Choose',
    description: 'Predict which ball will finish first',
    iconName: 'choose' as const,
  },
  {
    number: '3.',
    strong: 'Grow',
    description: 'Unlock the subconscious',
    iconName: 'grow' as const,
  },
]

function drawFinish(ctx: CanvasRenderingContext2D, x, y, w) {
  const pad = w / 10
  x += pad
  w -= 2 * pad
  const squareSize = w / 10
  const nCols = 10
  const nRows = 4
  // const h = nRows * squareSize
  for (let row = 0; row < nRows; row++) {
    for (let col = 0; col < nCols; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? 'white' : 'black'
      ctx.fillRect(x + col * squareSize, y + row * squareSize, squareSize, squareSize)
    }
  }
}
