/**
 * @file test-page.ts
 *
 * Test page with dummy content.
 */

import { Page } from '../../page'
import { getPageSourceDimensions } from '../../../title-screen'

export class TestPage extends Page {
  private orderedListStartTimeMs: number | null = null

  static {
    // Register the test page
    Page.register('test-page', () => new TestPage())
  }

  override getStartButtonPosition(): { x: number, y: number } | null {
    // Position button at 50% width, 85% height (centered horizontally, near bottom)
    return { x: 0.5, y: 0.85 }
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
  }

  private _drawOrderedList(
    ctx: CanvasRenderingContext2D,
    drawX: number,
    drawY: number,
    drawW: number,
    drawH: number,
    pageScale: number,
  ): void {
    const listItems = [
      { number: '1.', strong: 'Observe', description: 'Watch and remain open-minded' },
      { number: '2.', strong: 'Choose', description: 'Predict which ball will finish first' },
      { number: '3.', strong: 'Grow', description: 'Unlock the power of your subconscious' },
    ]

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
      const itemElapsedMs = elapsedMs - (index+1) * itemStaggerMs
      const alpha = Math.max(0, Math.min(1, itemElapsedMs / fadeDurationMs))

      if (alpha <= 0) return

      ctx.save()
      ctx.globalAlpha = alpha

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
}

