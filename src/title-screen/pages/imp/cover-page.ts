/**
 * @file cover-page.ts
 *
 * Title screen cover page implementation.
 */

import { Page } from '../../page'

type TitleCoverLetterAsset = {
  img: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
}

type AnimatedCoverLetter = TitleCoverLetterAsset & {
  phase: number
  freq: number
  scaleAmp: number
  driftPx: number
}

type TitleCoverForegroundAsset = {
  img: HTMLImageElement
}

export class CoverPage extends Page {
  static {
    // Register the cover page
    Page.register('cover-page', () => new CoverPage())
  }

  private coverBackground: HTMLImageElement | null = null
  private coverForeground: HTMLImageElement | null = null
  private coverLetters: Array<AnimatedCoverLetter> = []
  private coverSourceWidth = 1
  private coverSourceHeight = 1

  setCoverBackground(bg: HTMLImageElement) {
    this.coverBackground = bg
  }

  setCoverForeground(foreground: TitleCoverForegroundAsset) {
    this.coverForeground = foreground.img
  }

  setCoverLetters(
    letters: Array<TitleCoverLetterAsset>,
    sourceWidth: number,
    sourceHeight: number,
  ) {
    this.coverLetters.length = 0
    this.coverSourceWidth = Math.max(1, sourceWidth)
    this.coverSourceHeight = Math.max(1, sourceHeight)

    letters.forEach((letter, index) => {
      const seed = index + 1
      this.coverLetters.push({
        ...letter,
        phase: seed * 1.618,
        freq: 0.7 + (seed % 7) * 0.08,
        scaleAmp: 0.015 + (seed % 5) * 0.003,
        driftPx: 0.4 + (seed % 6) * 0.2,
      })
    })
  }

  override getStartButtonPosition(): { x: number, y: number } | null {
    // Position button at 50% width, 88.4% height (centered horizontally, near bottom)
    return { x: 0.5, y: 0.884 }
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.clearRect(0, 0, w, h)

    // Canvas is already sized correctly, fill the entire canvas
    const coverScale = Math.min(w / this.coverSourceWidth, h / this.coverSourceHeight)
    const drawW = this.coverSourceWidth * coverScale
    const drawH = this.coverSourceHeight * coverScale
    const drawX = (w - drawW) * 0.5
    const drawY = (h - drawH) * 0.5

    ctx.imageSmoothingEnabled = true

    // Draw background
    if (this.coverBackground) {
      ctx.drawImage(this.coverBackground, drawX, drawY, drawW, drawH)
    }

    // Draw animated letters
    this._drawAnimatedLetters(ctx, drawX, drawY, drawW, drawH, coverScale)

    // Draw foreground (front layer)
    if (this.coverForeground) {
      ctx.drawImage(this.coverForeground, drawX, drawY, drawW, drawH)
    }
  }

  private _drawAnimatedLetters(
    ctx: CanvasRenderingContext2D,
    drawX: number,
    drawY: number,
    drawW: number,
    drawH: number,
    coverScale: number,
  ) {
    if (this.coverLetters.length === 0) return

    const t = performance.now() * 1e-3
    const drawOrder = [6, 5, 4, 3, 2, 1, 0, 13, 12, 11, 10, 9, 8, 7]

    for (const letterIndex of drawOrder) {
      if (letterIndex >= this.coverLetters.length) continue

      const letter = this.coverLetters[letterIndex]
      const baseX = drawX + letter.x * coverScale
      const baseY = drawY + letter.y * coverScale
      const baseW = letter.width * coverScale
      const baseH = letter.height * coverScale
      const centerX = baseX + baseW * 0.5
      const centerY = baseY + baseH * 0.5

      const wobble = t * letter.freq + letter.phase
      const driftX = Math.sin(wobble) * letter.driftPx
      const driftY = Math.cos(wobble * 1.13) * letter.driftPx * 0.8
      const letterScale = 1 + Math.sin(wobble * 1.21) * letter.scaleAmp

      ctx.save()
      ctx.translate(centerX + driftX, centerY + driftY)
      ctx.scale(letterScale, letterScale)
      ctx.drawImage(letter.img, -baseW * 0.5, -baseH * 0.5, baseW, baseH)
      ctx.restore()
    }
  }
}
