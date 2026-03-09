/**
 * @file title-screen.ts
 *
 * Title screen with 3-body problem animation.
 */

import { Pattern } from 'gfx/patterns/pattern'
import { buildFillStyle } from 'gfx/patterns/pattern-util'
import type { PatternName } from 'imp-names'
import { VALUE_SCALE } from 'simulation/constants'
import { HILBERT_HEIGHT, HILBERT_WIDTH, N_HILBERT_FRAMES, N_HILBERT_POINTS } from 'hilbert-constants'
import type { HilbertLut } from 'simulation/luts/imp/hilbert-lut'
import { Lut } from 'simulation/luts/lut'
import type { Vec2 } from 'util/math-util'
import { lerp, twopi } from 'util/math-util'

let _isHilbertEnabled = false

export type TitleCoverLetterAsset = {
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

export type TitleCoverPartAsset = {
  img: HTMLImageElement
}

let _coverBackground: HTMLImageElement | null = null
let _coverPartA: HTMLImageElement | null = null
let _coverPartB: HTMLImageElement | null = null
const _coverLetters: Array<AnimatedCoverLetter> = []
let _coverSourceWidth = 1
let _coverSourceHeight = 1

export function setTitleCoverBackground(bg: HTMLImageElement) {
  _coverBackground = bg
}

export function setTitleCoverParts(parts: { partA: TitleCoverPartAsset, partB: TitleCoverPartAsset }) {
  _coverPartA = parts.partA.img
  _coverPartB = parts.partB.img
}

export function setTitleCoverLetters(
  letters: Array<TitleCoverLetterAsset>,
  sourceWidth: number,
  sourceHeight: number,
) {
  _coverLetters.length = 0
  _coverSourceWidth = Math.max(1, sourceWidth)
  _coverSourceHeight = Math.max(1, sourceHeight)

  letters.forEach((letter, index) => {
    const seed = index + 1
    _coverLetters.push({
      ...letter,
      phase: seed * 1.618,
      freq: 0.7 + (seed % 7) * 0.08,
      scaleAmp: 0.015 + (seed % 5) * 0.003,
      driftPx: 0.4 + (seed % 6) * 0.2,
    })
  })
}

export function onTitleScreenResize() {
  // // Graphics.onResize()
  // const { cvs } = getTitleScreenCanvas()
  // cvs.width = cvs.clientWidth * window.devicePixelRatio
  // cvs.height = cvs.clientHeight * window.devicePixelRatio
  // console.log('title screen resize', cvs.width, cvs.height)
}

export class TitleScreen {
  static update(_dt: number) {
    // getScaledPattern('diamond-a')

    // _updateTitleSim(dt)
    // _drawTitleSim()

    const { cvs, ctx } = getTitleScreenCanvas()
    cvs.width = cvs.clientWidth * window.devicePixelRatio
    cvs.height = cvs.clientHeight * window.devicePixelRatio
    // const cvs = Graphics._canvases['main']
    // const ctx = Graphics._contexts['main']
    if (!ctx) return
    const w = cvs.width, h = cvs.height
    ctx.clearRect(0, 0, w, h)

    const inset = 0.08
    const targetW = w * (1 - inset * 2)
    const targetH = h * (1 - inset * 2)
    coverScale = Math.min(targetW / _coverSourceWidth, targetH / _coverSourceHeight)
    drawW = _coverSourceWidth * coverScale
    drawH = _coverSourceHeight * coverScale
    drawX = (w - drawW) * 0.5
    drawY = (h - drawH) * 0.5
    ctx.imageSmoothingEnabled = true

    _drawStaticCoverBackground(ctx, w, h)
    _drawCoverPartB(ctx)

    // draw animated cover letters
    _drawAnimatedCoverLetters(ctx, w, h)
    _drawCoverPartA(ctx)

    // _drawQuantum()
    // if (_isHilbertEnabled) {
    //   _drawWooPong()
    // }
  }

  static startHilbert() {
    _isHilbertEnabled = true
  }
}

let drawX = 0
let drawY = 0
let drawW = 100
let drawH = 100
let coverScale = 1

function _drawStaticCoverBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (!_coverBackground) return
  ctx.drawImage(_coverBackground, drawX, drawY, drawW, drawH)
  ctx.restore()
}

function _drawCoverPartA(ctx: CanvasRenderingContext2D) {
  if (!_coverPartA) return
  ctx.drawImage(_coverPartA, drawX, drawY, drawW, drawH)
}

function _drawCoverPartB(ctx: CanvasRenderingContext2D) {
  if (!_coverPartB) return
  ctx.drawImage(_coverPartB, drawX, drawY, drawW, drawH)
}

const _drawOrder = [6, 5, 4, 3, 2, 1, 0, 13, 12, 11, 10, 9, 8, 7]

function _drawAnimatedCoverLetters(ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (_coverLetters.length === 0) return

  const t = performance.now() * 1e-3
  for (const letterIndex of _drawOrder) {
    const letter = _coverLetters[letterIndex]
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

  // // Debug: outline full inscribed cover bounds.
  // ctx.save()
  // ctx.strokeStyle = '#00ff66'
  // ctx.lineWidth = Math.max(1, Math.floor(window.devicePixelRatio))
  // ctx.strokeRect(drawX, drawY, drawW, drawH)
  // ctx.restore()
}


let _canvasAndContext
export function getTitleScreenCanvas():
{ cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
  if (!_canvasAndContext) {
    const iframe = document.getElementById('title-iframe') as HTMLIFrameElement

    const inner = iframe.contentDocument as Document
    const cvs = inner.getElementById('bg-canvas') as HTMLCanvasElement
    _canvasAndContext = {
      cvs, ctx: cvs.getContext('2d'),
    }
  }
  return _canvasAndContext
}
