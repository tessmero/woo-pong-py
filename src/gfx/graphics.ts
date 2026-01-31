/**
 * @file graphics.ts
 *
 * Main entry point for drawing sim-with-controls view.
 */

import type { Rectangle, Vec2 } from 'util/math-util'
import { twopi } from 'util/math-util'
import { DISK_RADIUS } from 'simulation/constants'
import type { PinballWizard } from 'pinball-wizard'
import { type GfxRegionName } from 'imp-names'
import { GfxRegion } from './gfx-region'
import type { ScrollbarGfx } from './imp/scrollbar-gfx'
import type { SimGfx } from './imp/sim-gfx'

// const cvs = ((typeof document === 'undefined') ? null : document.getElementById('sim-canvas')) as HTMLCanvasElement
// const ctx = (cvs ? cvs.getContext('2d') : null) as CanvasRenderingContext2D

export const OBSTACLE_FILL = '#888'
export const OBSTACLE_STROKE = '#000'

const pixelAnimSpeed = 8e-3// fraction per ms

export const gutterPx = 4
const leftGutterWidthPx = gutterPx
const midGutterWidthPx = gutterPx
const rightGutterWidthPx = gutterPx

export class Graphics {
  static get cvs() { return this._getMainCanvas() }

  static innerWidth = 1

  static pixelAnim = 0 // 0-1 state
  static targetPixelAnim = 0 // 0 or 1 target state
  static updatePixelAnim(dt: number) {
    if (this.pixelAnim === this.targetPixelAnim) return
    const delta = dt * pixelAnimSpeed
    if (this.pixelAnim < this.targetPixelAnim) {
      this.pixelAnim = Math.min(this.targetPixelAnim, this.pixelAnim + delta)
    }
    if (this.pixelAnim > this.targetPixelAnim) {
      this.pixelAnim = Math.max(this.targetPixelAnim, this.pixelAnim - delta)
    }
    Graphics._glassCvs.style.setProperty('display', this.pixelAnim === 0 ? 'none' : 'block')

    this._updateCanvasDims() // update width and height if necessary
  }

  public static get cssLeft() {
    return this._rootRect[0]
  }

  private static _rootRect: Rectangle = [1, 1, 1, 1]
  private static _updateCanvasDims() {
    const _root = Graphics._rootRect
    const mainCvs = Graphics._mainCvs
    const glassCvs = Graphics._glassCvs

    // compute main canvas dimensions (maybe big pixels)
    const mainWidth = Math.floor(_root[2] * window.devicePixelRatio / Graphics.mainPixelScale)
    const mainHeight = Math.floor(_root[3] * window.devicePixelRatio / Graphics.mainPixelScale)
    if (mainWidth !== mainCvs.width || mainHeight !== mainCvs.height) {
      mainCvs.width = mainWidth
      mainCvs.height = mainHeight
      const scale = mainWidth / (_root[2] * window.devicePixelRatio)
      this._mainCtx.setTransform(scale, 0, 0, scale, 0, 0)
    }

    // comput glass canvas dimensions wtih big pixels
    const glassWidth = _root[2] * window.devicePixelRatio / Graphics.glassPixelScale
    const glassHeight = _root[3] * window.devicePixelRatio / Graphics.glassPixelScale
    if (glassWidth !== glassCvs.width || glassHeight !== glassCvs.height) {
      glassCvs.width = glassWidth
      glassCvs.height = glassHeight
    }
  }

  // public static isTitleScreen = true
  public static get mainPixelScale() {
    // if( this.isTitleScreen ) return 10
    return Math.floor(1 + this.pixelAnim * 9)// physical pixels per big pixel
    // return Math.floor(4 + this.pixelAnim * 6)// physical pixels per big pixel
  }

  public static glassPixelScale = 40 // physical pixels per big pixel

  public static hasSpaceOnSides = false // if true, draw extra outer left and right edges

  static onResize(pw?: PinballWizard) {
    const dpr = window.devicePixelRatio
    const screenWidth = window.innerWidth * dpr
    const screenHeight = window.innerHeight * dpr
    // cvs.width = cvs.clientWidth * dpr
    // cvs.height = cvs.clientHeight * dpr

    // compute sim bounds
    const maxWidth = 600 * dpr
    this.hasSpaceOnSides = (screenWidth > maxWidth)
    if (this.hasSpaceOnSides && pw && !pw.isTitleScreen) {
      Graphics.cvs.style.setProperty('border-left', '2px solid black')
      Graphics.cvs.style.setProperty('border-right', '2px solid black')
    }
    else {
      Graphics.cvs.style.setProperty('border-left', 'none')
      Graphics.cvs.style.setProperty('border-right', 'none')
    }
    const rootWidth = Math.min(maxWidth, screenWidth)
    const rootWidthPx = Math.floor(rootWidth / dpr)
    const cssHeight = Math.floor(screenHeight / dpr)
    const simCssLeft = Math.floor((screenWidth - rootWidth) / 2 / dpr)
    let simCssWidth = rootWidthPx
    let scrollbarWidth = 1

    if (pw) {
      // compute scrollbar bounds
      const scrollbarHeight = Math.min(600, window.innerHeight)
      const levelShape = pw?.activeSim?.level?.bounds ?? [1, 1, 1, 1]
      scrollbarWidth = scrollbarHeight * (levelShape[2] / levelShape[3])
      simCssWidth = rootWidthPx - scrollbarWidth - leftGutterWidthPx - midGutterWidthPx - rightGutterWidthPx
    }

    // test new graphics
    const _root: Rectangle = [
      simCssLeft, 0,
      rootWidthPx,
      cssHeight,
    ]
    Graphics.innerWidth = _root[2] * dpr

    const mainCvs = this._getMainCanvas() // new canvas in front
    const glassCvs = this._getGlassCanvas()

    for (const cvs of ([mainCvs, glassCvs] as const)) {
      cvs.style.setProperty('position', `absolute`)
      cvs.style.setProperty('left', `${_root[0]}px`)
      cvs.style.setProperty('top', `${_root[1]}px`)
      cvs.style.setProperty('width', `${_root[2]}px`)
      cvs.style.setProperty('height', `${_root[3]}px`)
    }

    this._mainCvs = mainCvs
    this._mainCtx = mainCvs.getContext('2d') as CanvasRenderingContext2D
    // this._mainCtx.imageSmoothingEnabled = false
    // this._mainCtx.lineCap = 'butt'

    this._glassCvs = glassCvs
    this._glassCtx = glassCvs.getContext('2d') as CanvasRenderingContext2D
    this._glassCtx.imageSmoothingEnabled = false

    this._rootRect = _root
    this._updateCanvasDims()

    const barHeightPx = 60 / dpr

    this._pxRegions = {
      'sim-gfx': [
        leftGutterWidthPx, barHeightPx,
        simCssWidth, cssHeight - barHeightPx * 2,
      ],
      'scrollbar-gfx': [
        leftGutterWidthPx + simCssWidth + midGutterWidthPx, barHeightPx,
        scrollbarWidth,
        cssHeight - barHeightPx * 2,
      ],
      'bottom-bar-gfx': [
        0, _root[3] - barHeightPx,
        _root[2],
        barHeightPx,
      ],
      'top-bar-gfx': [
        0, 0,
        _root[2],
        barHeightPx,
      ],
      'glass-gfx': [
        0, 0,
        _root[2], _root[3],
      ],
    }

    const gutterHeightPx = _root[3] - 2 * barHeightPx
    this._pxGutters = [
      [0, barHeightPx, leftGutterWidthPx, gutterHeightPx], // left
      // mid between sim and scrollbar
      [leftGutterWidthPx + simCssWidth, barHeightPx, leftGutterWidthPx, gutterHeightPx],
      // right
      [_root[2] - rightGutterWidthPx, barHeightPx, leftGutterWidthPx, gutterHeightPx],
    ]

    // translate regions and gutters to device pixels
    this._dpRegions = {}
    for (const [name, rect] of Object.entries(this._pxRegions)) {
      this._dpRegions[name] = rect.map(
        c => c * window.devicePixelRatio,
      )
    }
    this._dpGutters = this._pxGutters.map(rect => rect.map(
      v => v * window.devicePixelRatio,
    ) as Rectangle)

    // call all regions' onResize callbacks
    Object.keys(this._dpRegions).forEach((gfxName) => {
      GfxRegion.create(gfxName as GfxRegionName)
        .onResize(this._dpRegions[gfxName])
    })
  }

  static _getGlassCanvas() {
    return document.getElementById('glass-canvas') as HTMLCanvasElement
  }

  static _getMainCanvas() {
    return document.getElementById('test-canvas') as HTMLCanvasElement
  }

  private static _pxRegions: Partial<Record<GfxRegionName, Rectangle>> = {}
  private static _dpRegions: Partial<Record<GfxRegionName, Rectangle>> = {}

  private static _pxGutters: Array<Rectangle> = []
  private static _dpGutters: Array<Rectangle> = []

  public static _mainCvs: HTMLCanvasElement
  public static _mainCtx: CanvasRenderingContext2D
  public static _glassCvs: HTMLCanvasElement
  public static _glassCtx: CanvasRenderingContext2D

  static get regions() { return Graphics._pxRegions }

  static draw(pw: PinballWizard) {
    // draw all regions
    Object.keys(this._dpRegions).forEach((gfxName) => {
      const ctx = gfxName === 'glass-gfx' ? this._glassCtx : this._mainCtx
      GfxRegion.create(gfxName as GfxRegionName)
        .draw(ctx, pw, this._dpRegions[gfxName])
    })

    const ctx = this._mainCtx

    // fill gutters
    ctx.fillStyle = OBSTACLE_FILL
    for (const rect of this._dpGutters) {
      ctx.fillRect(...rect)
    }

    // fill regions near gutters to cut out rounded corners
    ;(GfxRegion.create('sim-gfx') as SimGfx).fillRoundedMarginCorners(ctx, pw)
    ;(GfxRegion.create('scrollbar-gfx') as ScrollbarGfx).fillRoundedMarginCorners(ctx, pw)

    // draw disks on scrollbar
    ;(GfxRegion.create('scrollbar-gfx') as ScrollbarGfx)
      .drawDisks(ctx, pw, this._dpRegions['scrollbar-gfx'] as Rectangle)

    // draw view cursor on scrollbar
    ;(GfxRegion.create('scrollbar-gfx') as ScrollbarGfx)
      .drawViewRect(ctx, pw, this._dpRegions['scrollbar-gfx'] as Rectangle)

    // // draw top edge of gutters
    // ctx.strokeStyle = 'black'
    // ctx.lineWidth = 1
    // ctx.beginPath()
    // for( const [x,y,w,h] of this._dpGutters ){
    //   ctx.moveTo( x,y+1 )
    //   ctx.lineTo(x+w,y+1)
    // }
    // ctx.stroke()

    // // draw some borders
    // ctx.lineWidth = 2
    // ctx.strokeStyle = 'black'
    // ctx.strokeRect(...(this._dpRegions['sim-gfx'] as Rectangle))

    // //
    // // this.hasSpaceOnSides = false
    // if (this.hasSpaceOnSides) {
    //   const [x, y, w, h] = this._dpRegions['glass-gfx'] as Rectangle
    //   ctx.beginPath()
    //   ctx.moveTo(x + 1, y)
    //   ctx.lineTo(x + 1, y + h)
    //   ctx.moveTo(x + w - 1, y)
    //   ctx.lineTo(x + w - 1, y + h)
    //   ctx.lineWidth = 2
    //   ctx.strokeStyle = 'black'
    //   ctx.stroke()
    // }
  }

  static drawCursor(ctx: CanvasRenderingContext2D, pos: Vec2) {
    const [x, y] = pos
    ctx.fillStyle = 'rgba(100,100,100,.5)'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.arc(x, y, DISK_RADIUS, 0, twopi)
    ctx.fill()
  }

  static drawViewRect(ctx: CanvasRenderingContext2D, rect: Rectangle) {
    ctx.strokeStyle = 'black'
    ctx.lineWidth = DISK_RADIUS * 3
    ctx.strokeRect(...rect)
  }
}
