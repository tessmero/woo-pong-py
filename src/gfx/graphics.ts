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
import { GfxRegion } from './regions/gfx-region'
import type { SimGfx } from './regions/imp/sim-gfx'
import type { ScrollbarGfx } from './regions/imp/scrollbar-gfx'
import { drawRoundedRect } from './canvas-rounded-rect-util'

// const cvs = ((typeof document === 'undefined') ? null : document.getElementById('sim-canvas')) as HTMLCanvasElement
// const ctx = (cvs ? cvs.getContext('2d') : null) as CanvasRenderingContext2D

export const CROWN_FILL = 'rgb(255, 208, 52)'
export const OBSTACLE_FILL = '#888'
export const OBSTACLE_STROKE = '#000'

const bspAnimSpeed = 2e-3// fraction per ms
const stgAnimSpeed = 4e-3// fraction per ms

export const gutterPx = 3
const leftGutterWidthPx = gutterPx
const midGutterWidthPx = gutterPx
const rightGutterWidthPx = gutterPx

export const CANVASES = ['main', 'bsp', 'settings', 'start'] as const
export type CanvasName = (typeof CANVASES)[number]

export class Graphics {
  static get cvs() { return this._canvases['main'] }

  static innerWidth = 1

  static bspAnim = 0 // 0-1 state
  static targetBspAnim = 0 // 0 or 1 target state
  static updateBspAnim(dt: number) {
    if (this.bspAnim === this.targetBspAnim) return
    const delta = dt * bspAnimSpeed
    if (this.bspAnim < this.targetBspAnim) {
      this.bspAnim = Math.min(this.targetBspAnim, this.bspAnim + delta)
    }
    if (this.bspAnim > this.targetBspAnim) {
      this.bspAnim = Math.max(this.targetBspAnim, this.bspAnim - delta)
    }
    Graphics._canvases['bsp'].style.setProperty('display', this.bspAnim === 0 ? 'none' : 'block')

    this._updateCanvasDims() // update width and height if necessary
  }

  static stgAnim = 0 // 0-1 state
  static targetStgAnim = 0 // 0 or 1 target state
  static updateStgAnim(dt: number) {
    if (this.stgAnim === this.targetStgAnim) return
    const delta = dt * stgAnimSpeed
    if (this.stgAnim < this.targetStgAnim) {
      this.stgAnim = Math.min(this.targetStgAnim, this.stgAnim + delta)
    }
    if (this.stgAnim > this.targetStgAnim) {
      this.stgAnim = Math.max(this.targetStgAnim, this.stgAnim - delta)
    }
    Graphics._canvases['settings'].style.setProperty('display', this.stgAnim === 0 ? 'none' : 'block')

    this._updateCanvasDims() // update width and height if necessary
  }

  public static get cssLeft() {
    return this._rootRect[0]
  }

  public static _rootRect: Rectangle = [1, 1, 1, 1]
  private static _updateCanvasDims() {
    const dpr = window.devicePixelRatio
    const _root = Graphics._rootRect
    const mainCvs = Graphics._canvases['main']

    // compute main canvas dimensions (maybe big pixels)
    const mainWidth = Math.floor(_root[2] * dpr / Graphics.mainPixelScale)
    const mainHeight = Math.floor(_root[3] * dpr / Graphics.mainPixelScale)
    if (mainWidth !== mainCvs.width || mainHeight !== mainCvs.height) {
      mainCvs.width = mainWidth
      mainCvs.height = mainHeight
      const scale = mainWidth / (_root[2] * dpr)
      this._contexts['main'].setTransform(scale, 0, 0, scale, 0, 0)
    }

    // bsp always has small pixels
    const smallPxCanvases: Array<CanvasName> = ['bsp', 'settings', 'start']
    for (const name of smallPxCanvases) {
      const cvs = Graphics._canvases[name]
      cvs.width = _root[2] * dpr
      cvs.height = _root[3] * dpr
    }
  }

  // public static isTitleScreen = true
  public static get mainPixelScale() {
    // if( this.isTitleScreen ) return 10

    const pixelAnim = Math.max(this.bspAnim, this.stgAnim)

    return Math.floor(1 + pixelAnim * 9 * window.devicePixelRatio)// physical pixels per big pixel
    // return Math.floor(4 + this.pixelAnim * 6)// physical pixels per big pixel
  }

  public static get glassPixelScale() { return 60 * window.devicePixelRatio }

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
    // if (this.hasSpaceOnSides && pw && !pw.isTitleScreen) {
    //   Graphics.cvs.style.setProperty('border-left', '2px solid black')
    //   Graphics.cvs.style.setProperty('border-right', '2px solid black')
    // }
    // else {
    //   Graphics.cvs.style.setProperty('border-left', 'none')
    //   Graphics.cvs.style.setProperty('border-right', 'none')
    // }
    const rootWidth = pw ? Math.min(maxWidth, screenWidth) : screenWidth
    const rootWidthPx = Math.floor(rootWidth / dpr)
    const cssHeight = Math.floor(screenHeight / dpr)
    const simCssLeft = Math.floor((screenWidth - rootWidth) / 2 / dpr)
    let simCssWidth = rootWidthPx
    let scrollbarWidth = 1

    if (pw) {
      // compute scrollbar bounds
      const levelShape = [...(pw?.activeSim?.level?.bounds ?? [1, 1, 1, 1])]
      levelShape[3] *= 1.2
      const scrollbarHeight = Math.min(600, window.innerHeight)
      scrollbarWidth = scrollbarHeight * (levelShape[2] / levelShape[3])
      simCssWidth = rootWidthPx - scrollbarWidth - leftGutterWidthPx - midGutterWidthPx - rightGutterWidthPx
    }

    //
    const _root: Rectangle = [
      simCssLeft, 0,
      rootWidthPx,
      cssHeight,
    ]
    Graphics.innerWidth = _root[2] * dpr

    this._canvases = Object.fromEntries(
      CANVASES.map(name => [name, this._getCanvas(name)]),
    ) as Record<CanvasName, HTMLCanvasElement>

    this._contexts = Object.fromEntries(
      CANVASES.map(name => [name, this._getCanvas(name).getContext('2d')]),
    ) as Record<CanvasName, CanvasRenderingContext2D>

    for (const cvs of Object.values(this._canvases)) {
      cvs.style.setProperty('position', `absolute`)
      cvs.style.setProperty('left', `${_root[0]}px`)
      cvs.style.setProperty('top', `${_root[1]}px`)
      cvs.style.setProperty('width', `${_root[2]}px`)
      cvs.style.setProperty('height', `${_root[3]}px`)
    }

    // this._mainCtx.imageSmoothingEnabled = false
    // this._mainCtx.lineCap = 'butt'

    this._contexts['bsp'].imageSmoothingEnabled = false

    this._contexts['settings'].imageSmoothingEnabled = false

    this._rootRect = _root
    this._updateCanvasDims()

    const barHeightPx = 50 // / dpr

    this._pxRegions = {
      'sim-gfx': [
        leftGutterWidthPx, barHeightPx,
        simCssWidth, cssHeight - barHeightPx * 2,
      ],
      'start-gfx': [
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
      'timeline-gfx': [
        0, _root[3] - barHeightPx - barHeightPx,
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
      'bsp-gfx': [
        0, 0,
        _root[2], _root[3],
      ],
      'settings-gfx': [
        0, 0,
        _root[2], _root[3],
      ],
    }
    this.revRegionNames = Object.keys(this._pxRegions).reverse() as Array<GfxRegionName>

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

  static _getCanvas(name: CanvasName) {
    return document.getElementById(`${name}-canvas`) as HTMLCanvasElement
  }

  public static revRegionNames: Array<GfxRegionName> = []
  private static _pxRegions: Partial<Record<GfxRegionName, Rectangle>> = {}
  private static _dpRegions: Partial<Record<GfxRegionName, Rectangle>> = {}

  private static _pxGutters: Array<Rectangle> = []
  private static _dpGutters: Array<Rectangle> = []

  public static _canvases: Record<CanvasName, HTMLCanvasElement>
  public static _contexts: Record<CanvasName, CanvasRenderingContext2D>

  static get regions() { return Graphics._pxRegions }

  static draw(pw: PinballWizard) {

    // needed for some reason
    drawRoundedRect(this._contexts['main'], [10,10,10,10], false, false, true)

    // draw all regions
    Object.keys(this._dpRegions).forEach((gfxName) => {
      // const ctx = this._contexts['main']

      // if (gfxName === 'glass-gfx') {
      //   if (!ballSelectionPanel.isShowing) {
      //     return // skip drawing glass effect
      //   }
      //   // ctx = this._glassCtx
      // }

      const region = GfxRegion.create(gfxName as GfxRegionName)
      if (region.shouldDraw(pw)) {
        const ctx = this._contexts[region.targetCanvas]
        region.draw(ctx, pw, this._dpRegions[gfxName])
      }
    })

    const ctx = this._contexts['main']

    // fill gutters
    ctx.fillStyle = OBSTACLE_FILL
    for (const rect of this._dpGutters) {
      ctx.fillRect(...rect)
    }

    const sim = GfxRegion.create('sim-gfx') as SimGfx
    const scrollbar = GfxRegion.create('scrollbar-gfx') as ScrollbarGfx

    // fill regions near gutters to cut out rounded corners
    sim.fillRoundedMarginCorners(ctx, pw)
    scrollbar.fillRoundedMarginCorners(ctx, pw)

    // draw disks on scrollbar
    scrollbar.drawDisks(ctx, pw, this._dpRegions['scrollbar-gfx'] as Rectangle)

    // draw view cursor on scrollbar
    scrollbar.drawViewRect(ctx, pw, this._dpRegions['scrollbar-gfx'] as Rectangle)

    // draw annotations for hovered and selected disks in sim
    sim.drawHalos(ctx, pw)

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

    // // debug
    // drawRoundedRect(ctx, [100, 100, 100, 100])

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
}
