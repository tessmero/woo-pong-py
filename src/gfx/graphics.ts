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

// const cvs = ((typeof document === 'undefined') ? null : document.getElementById('sim-canvas')) as HTMLCanvasElement
// const ctx = (cvs ? cvs.getContext('2d') : null) as CanvasRenderingContext2D

export const OBSTACLE_FILL = '#888'
export const OBSTACLE_STROKE = '#000'

const pixelAnimSpeed = 1e-3// fraction per ms

export class Graphics {
  static get cvs() { return this._getMainCanvas() }

  static innerWidth = 1

  static pixelAnim = 0 // 0-1 state
  static targetPixelAnim = 1 // 0 or 1 target state
  static updatePixelAnim(dt: number) {
    if (this.pixelAnim === this.targetPixelAnim) return
    const delta = dt * pixelAnimSpeed
    if (this.pixelAnim < this.targetPixelAnim) {
      this.pixelAnim = Math.min(this.targetPixelAnim, this.pixelAnim + delta)
    }
    if (this.pixelAnim > this.targetPixelAnim) {
      this.pixelAnim = Math.max(this.targetPixelAnim, this.pixelAnim - delta)
    }

    this._updateCanvasDims() // update width and height if necessary
  }

  private static _rootRect: Rectangle = [1,1,1,1]
  private static _updateCanvasDims(){
    
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

  public static get mainPixelScale() {
    return Math.floor(1 + this.pixelAnim * 9)// physical pixels per big pixel
  }

  public static glassPixelScale = 40 // physical pixels per big pixel

  static onResize(pw?: PinballWizard) {
    const dpr = window.devicePixelRatio
    const screenWidth = window.innerWidth * dpr
    const screenHeight = window.innerHeight * dpr
    // cvs.width = cvs.clientWidth * dpr
    // cvs.height = cvs.clientHeight * dpr

    // compute sim bounds
    const maxWidth = 600 * dpr
    Graphics.innerWidth = Math.min(maxWidth, screenWidth)
    let cssWidth = Math.floor(Graphics.innerWidth / dpr)
    const cssHeight = Math.floor(screenHeight / dpr)
    let cssLeft = Math.floor((screenWidth - Graphics.innerWidth) / 2 / dpr)

    let scrollbar: Rectangle = [1, 1, 1, 1]

    if (pw) {
      // compute scrollbar bounds
      const scrollbarHeight = Math.min(600, window.innerHeight)
      const levelShape = pw?.activeSim?.level?.bounds ?? [1, 1, 1, 1]
      const scrollbarWidth = scrollbarHeight * (levelShape[2] / levelShape[3])
      scrollbar = [
        cssLeft + cssWidth,
        (window.innerHeight - scrollbarHeight) / 2,
        scrollbarWidth,
        scrollbarHeight,
      ]

      if ((cssWidth + scrollbarWidth) > window.innerWidth) {
        // shrink sim and snap to left to make space for scrollbar
        cssLeft = 0
        cssWidth = window.innerWidth - scrollbarWidth
        scrollbar[0] = cssLeft + cssWidth
        Graphics.innerWidth = cssWidth * dpr
      }
      else if ((cssLeft + cssWidth + scrollbarWidth) > window.innerWidth) {
        // slide sim to left to make space for scrollbar
        cssLeft = window.innerWidth - cssWidth - scrollbarWidth
        scrollbar[0] = cssLeft + cssWidth
        Graphics.innerWidth = cssWidth * dpr
      }

      // comput eball selecion panel
      const bspHeight = 300
      const bsp: Rectangle = [
        cssLeft, window.innerHeight - bspHeight,
        cssWidth, bspHeight,
      ]
    }

    // // commit new layout
    // cvs.style.setProperty('position', `absolute`)
    // cvs.style.setProperty('width', `${cssWidth}px`)
    // cvs.style.setProperty('left', `${cssLeft}px`)
    // cvs.width = Graphics.innerWidth
    // cvs.height = cvs.clientHeight * dpr
    // // Graphics.drawOffset[0] = 0
    Graphics.cssLeft = cssLeft

    const rightGutterWidth = 10

    // test new graphics
    const _root: Rectangle = [
      cssLeft, 0,
      cssWidth + scrollbar[2] + rightGutterWidth,
      cssHeight,
    ]

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
    this._glassCvs = glassCvs
    this._glassCtx = glassCvs.getContext('2d') as CanvasRenderingContext2D

    this._rootRect = _root
    this._updateCanvasDims()

    this._regions = {
      'sim-gfx': [
        0, 60,
        cssWidth, cssHeight - 60 * 2,
      ],
      'scrollbar-gfx': [
        cssWidth, scrollbar[1],
        scrollbar[2],
        cssHeight,
      ],
      'bottom-bar-gfx': [
        0, _root[3] - 60,
        cssWidth, 60,
      ],
      'top-bar-gfx': [
        0, 0,
        cssWidth, 60,
      ],
      'glass-gfx': [
        0, 0,
        _root[2], _root[3],
      ],
    }

    // call all regions' onResize callbacks
    Object.keys(this._regions).forEach((gfxName) => {
      GfxRegion.create(gfxName as GfxRegionName)
        .onResize(this._regions[gfxName].map(v => v * window.devicePixelRatio))
    })
  }

  static _getGlassCanvas() {
    return document.getElementById('glass-canvas') as HTMLCanvasElement
  }

  static _getMainCanvas() {
    return document.getElementById('test-canvas') as HTMLCanvasElement
  }

  static cssLeft = 0

  private static _regions: Partial<Record<GfxRegionName, Rectangle>> = {}
  private static _mainCvs: HTMLCanvasElement
  private static _mainCtx: CanvasRenderingContext2D
  public static _glassCvs: HTMLCanvasElement
  public static _glassCtx: CanvasRenderingContext2D

  static get regions() { return Graphics._regions }

  static draw(pw: PinballWizard) {

    this._mainCtx.imageSmoothingEnabled = this.pixelAnim > 0

    // draw all regions
    Object.keys(this._regions).forEach((gfxName) => {
      const ctx = gfxName === 'glass-gfx' ? this._glassCtx : this._mainCtx
      GfxRegion.create(gfxName as GfxRegionName)
        .draw(ctx, pw, this._regions[gfxName].map(v => v * window.devicePixelRatio))
    })
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
    ctx.strokeStyle = 'red'
    ctx.lineWidth = DISK_RADIUS
    ctx.strokeRect(...rect)
  }
}
