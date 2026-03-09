/**
 * @file test-page.ts
 *
 * Test page with dummy content.
 */

import { Page } from '../../page'
import { getPageSourceDimensions } from '../../../title-screen'

export class TestPage extends Page {
  static {
    // Register the test page
    Page.register('test-page', () => new TestPage())
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
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

    // Light background
    ctx.fillStyle = '#f5f5f0'
    ctx.fillRect(drawX, drawY, drawW, drawH)

    // Page border
    ctx.strokeStyle = '#8b7355'
    ctx.lineWidth = Math.max(1, pageScale * 2)
    ctx.strokeRect(drawX, drawY, drawW, drawH)

    // Title
    ctx.fillStyle = '#2c1810'
    ctx.font = `bold ${pageScale * 32}px Rubik`
    ctx.textAlign = 'left'
    ctx.fillText('How to Play', drawX + pageScale * 20, drawY + pageScale * 40)

    // Content text
    ctx.font = `${pageScale * 16}px Rubik`
    ctx.fillStyle = '#4a4a4a'
    const lineHeight = pageScale * 28
    const startY = drawY + pageScale * 60
    const texts = [
      'Guide your ball through the pinball machine.',
      'Use the flippers to keep the ball in play.',
      'Collect points by hitting targets and bumpers.',
      'Reach the highest score to master the game!',
    ]

    texts.forEach((text, index) => {
      ctx.fillText('• ' + text, drawX + pageScale * 30, startY + index * lineHeight)
    })

    // Footer decoration
    ctx.strokeStyle = '#c9a876'
    ctx.lineWidth = pageScale * 1
    ctx.beginPath()
    ctx.moveTo(drawX + pageScale * 20, drawY + drawH - pageScale * 30)
    ctx.lineTo(drawX + drawW - pageScale * 20, drawY + drawH - pageScale * 30)
    ctx.stroke()

    ctx.fillStyle = '#8b7355'
    ctx.font = `${pageScale * 14}px Rubik`
    ctx.textAlign = 'center'
    ctx.fillText('Page 2', drawX + drawW * 0.5, drawY + drawH - pageScale * 10)
  }
}

