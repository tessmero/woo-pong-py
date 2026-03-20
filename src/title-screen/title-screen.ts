/**
 * @file title-screen.ts
 *
 * Title screen with multiple pages and page-flipping animation.
 */

import { Page } from 'title-screen/page'
// Import page implementations to trigger their static register blocks
import 'title-screen/pages/imp/cover-page'
import 'title-screen/pages/imp/second-page'
import type { PageName } from 'imp-names'

export type TitleCoverLetterAsset = {
  img: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
}

export type TitleCoverForegroundAsset = {
  img: HTMLImageElement
}

// Shared source dimensions for all pages
const _pageSourceShape: { width: number, height: number } = {
  width: 1,
  height: 1,
}

export function setPageSourceDimensions(width: number, height: number) {
  _pageSourceShape.width = Math.max(1, width)
  _pageSourceShape.height = Math.max(1, height)
}

export function getPageSourceDimensions(): { width: number, height: number } {
  return _pageSourceShape
}

// Page management with animation
class PageBook {
  private pageNames: Array<PageName> = ['cover-page', 'second-page']
  private currentPageIndex = 0
  private flipState: 'idle' | 'flipping' = 'idle'
  private flipStartTime = 0
  private flipDuration = 0.2 // seconds

  getCurrentPage(): Page {
    // During flip animation, show the NEW page in background
    const index = this.flipState === 'flipping' ? this.currentPageIndex + 1 : this.currentPageIndex
    return Page.create(this.pageNames[index])
  }

  isLastPage(): boolean {
    return this.currentPageIndex === this.pageNames.length - 1
  }

  canAdvance(): boolean {
    return this.flipState === 'idle'
  }

  isFlipping(): boolean {
    return this.flipState === 'flipping'
  }

  startPageFlip(mainCtx: CanvasRenderingContext2D, mainCvs: HTMLCanvasElement): void {
    if (this.flipState !== 'idle' || this.isLastPage()) return

    // Capture current page to flip canvas
    const { cvs: flipCvs, ctx: flipCtx } = getFlipCanvas()

    // Sync flip canvas dimensions with main canvas
    flipCvs.width = mainCvs.width
    flipCvs.height = mainCvs.height

    // Copy main canvas content to flip canvas
    flipCtx.drawImage(mainCvs, 0, 0)

    this.flipState = 'flipping'
    this.flipStartTime = performance.now()
  }

  updatePageFlip(): void {
    if (this.flipState !== 'flipping') return

    const currentTime = performance.now()
    const elapsed = (currentTime - this.flipStartTime) * 1e-3 // Convert to seconds
    const progress = Math.min(1, elapsed / this.flipDuration)

    if (progress >= 1) {
      this.flipState = 'idle'
      this.currentPageIndex++
      if (this.currentPageIndex < this.pageNames.length) {
        const newPage = this.getCurrentPage()
        newPage.init()
        // Trigger button reposition for the new page
        onTitleScreenResize()
      }
    }
  }

  drawPageFlipAnimation(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (this.flipState !== 'flipping') return

    const { cvs: flipCvs } = getFlipCanvas()
    const currentTime = performance.now()
    const elapsed = (currentTime - this.flipStartTime) * 1e-3
    const progress = Math.min(1, elapsed / this.flipDuration)

    ctx.save()

    const centerX = w * 0.5
    const centerY = h * 0.5
    const slideDistance = -w * progress
    // const rotationAngle = -progress * Math.PI * 0.5

    // Translate to center, rotate around center, then slide right
    ctx.translate(centerX, centerY)
    // ctx.rotate(rotationAngle)
    ctx.translate(slideDistance, 0)
    ctx.drawImage(flipCvs, -centerX, -centerY)

    ctx.restore()
  }

  getFlipProgress(): number {
    if (this.flipState !== 'flipping') return 0
    const currentTime = performance.now()
    const elapsed = (currentTime - this.flipStartTime) * 1e-3
    return Math.min(1, elapsed / this.flipDuration)
  }
}

const _pageBook = new PageBook()

let _startButton: HTMLElement | null = null

export function setTitleScreenStartButton(button: HTMLElement) {
  _startButton = button
}

export function getTitleCanvasTransform(): {
  scale: number
  drawX: number
  drawY: number
  drawW: number
  drawH: number
} | null {
  const layout = getTitleCanvasLayout()
  const dims = getPageSourceDimensions()
  const scale = layout.pageScale
  const drawW = dims.width * scale
  const drawH = dims.height * scale
  const drawX = layout.drawX
  const drawY = layout.drawY

  return { scale, drawX, drawY, drawW, drawH }
}

function getTitleCanvasLayout(): {
  drawX: number
  drawY: number
  drawW: number
  drawH: number
  pageScale: number
} {
  // Use viewport dimensions so canvas and UI transforms stay aligned inside the iframe.
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const inset = 0
  const dims = getPageSourceDimensions()
  const targetW = viewportWidth * (1 - inset * 2)
  const targetH = viewportHeight * (1 - inset * 2)
  const pageScale = Math.min(targetW / dims.width, targetH / dims.height)
  const drawW = dims.width * pageScale
  const drawH = dims.height * pageScale
  const drawX = (viewportWidth - drawW) * 0.5
  const drawY = (viewportHeight - drawH) * 0.5

  return {
    drawX,
    drawY,
    drawW,
    drawH,
    pageScale,
  }
}

export function setTitleCoverBackground(bg: HTMLImageElement) {
  const coverPage = Page.create('cover-page') as any // eslint-disable-line  @typescript-eslint/no-explicit-any
  coverPage.setCoverBackground(bg)
}

export function setTitleCoverForeground(foreground: TitleCoverForegroundAsset) {
  const coverPage = Page.create('cover-page') as any // eslint-disable-line  @typescript-eslint/no-explicit-any
  coverPage.setCoverForeground(foreground)
}

export function setTitleCoverLetters(
  letters: Array<TitleCoverLetterAsset>,
  sourceWidth: number,
  sourceHeight: number,
) {
  const coverPage = Page.create('cover-page') as any // eslint-disable-line  @typescript-eslint/no-explicit-any
  coverPage.setCoverLetters(letters, sourceWidth, sourceHeight)
}

export function onTitleScreenResize() {
  // Graphics.onResize()

  // Position start button to align with current page's preferred position
  if (_startButton) {
    const currentPage = _pageBook.getCurrentPage()
    const buttonPos = currentPage.getStartButtonPosition()

    if (!buttonPos) {
      // Hide button if page doesn't want it
      _startButton.style.display = 'none'
      return
    }

    _startButton.style.display = ''

    const transform = getTitleCanvasTransform()
    if (transform) {
      const { scale, drawX, drawY } = transform
      const dims = getPageSourceDimensions()

      // Transform normalized coordinates to screen coordinates
      const buttonCenterX = drawX + buttonPos.x * dims.width * scale
      const buttonCenterY = drawY + buttonPos.y * dims.height * scale

      // Anchor to viewport space so section padding does not shift the button.
      _startButton.style.position = 'fixed'
      _startButton.style.left = `${buttonCenterX}px`
      _startButton.style.top = `${buttonCenterY}px`
      _startButton.style.transform = 'translate(-50%, -50%)'
    }
  }
}

export function advanceTitlePage(): boolean {
  if (!_pageBook.canAdvance()) return false

  if (_pageBook.isLastPage()) {
    return true // signal to start game
  }
  else {
    const { cvs, ctx } = getTitleScreenCanvas()
    _pageBook.startPageFlip(ctx, cvs)
    return false // don't start game yet
  }
}

export function getTitlePageFlipProgress(): number {
  return _pageBook.getFlipProgress()
}

export class TitleScreen {
  static update(_dt: number) {
    const { cvs, ctx } = getTitleScreenCanvas()
    const { drawX, drawY, drawW, drawH } = getTitleCanvasLayout()
    const dpr = Math.max(1, window.devicePixelRatio || 1)

    // Set canvas internal size to match drawable region
    cvs.width = Math.round(drawW * dpr)
    cvs.height = Math.round(drawH * dpr)

    // Position canvas via CSS to center it within parent
    cvs.style.position = 'absolute'
    cvs.style.left = `${drawX}px`
    cvs.style.top = `${drawY}px`
    cvs.style.width = `${drawW}px`
    cvs.style.height = `${drawH}px`
    cvs.style.overflow = 'hidden'

    if (!ctx) return
    const w = cvs.width
    const h = cvs.height

    // Draw current page (pages now draw to fill the entire canvas)
    const currentPage = _pageBook.getCurrentPage()
    currentPage.draw(ctx, w, h)

    // Update flip animation if in progress
    _pageBook.updatePageFlip()
    _pageBook.drawPageFlipAnimation(ctx, w, h)
  }

  static startHilbert() {
    // Deprecated - no longer used
  }
}

let _canvasAndContext: { cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D } | null = null
let _flipCanvasAndContext: { cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D } | null = null

export function getTitleScreenCanvas():
{ cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
  if (!_canvasAndContext) {
    const iframe = document.getElementById('title-iframe') as HTMLIFrameElement

    const inner = iframe.contentDocument as Document
    const cvs = inner.getElementById('bg-canvas') as HTMLCanvasElement
    _canvasAndContext = {
      cvs, ctx: cvs.getContext('2d') as CanvasRenderingContext2D,
    }
  }
  return _canvasAndContext
}

export function getFlipCanvas():
{ cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
  if (!_flipCanvasAndContext) {
    const { cvs: mainCvs } = getTitleScreenCanvas()

    // Create hidden canvas with same dimensions
    const cvs = document.createElement('canvas')
    cvs.width = mainCvs.width
    cvs.height = mainCvs.height

    cvs.style.display = 'none'
    // // Style for debugging - visible, floating on left, doesn't affect layout
    // cvs.style.position = 'fixed'
    // cvs.style.left = '10px'
    // cvs.style.top = '10px'
    // cvs.style.pointerEvents = 'none'
    // cvs.style.zIndex = '10000'
    // cvs.style.border = '2px solid red'
    // cvs.style.opacity = '0.8'
    // cvs.style.maxWidth = '200px'
    // cvs.style.maxHeight = '280px'

    document.body.appendChild(cvs)

    _flipCanvasAndContext = {
      cvs, ctx: cvs.getContext('2d') as CanvasRenderingContext2D,
    }
  }

  return _flipCanvasAndContext
}

export function initTitleScreenFlipCanvas(): void {
  // Force creation of flip canvas on page load
  getFlipCanvas()
}
