/**
 * @file graphics.ts
 *
 * Main entry point for drawing sim-with-controls view.
 */

import type { Rectangle, Vec2 } from 'util/math-util'
import { twopi } from 'util/math-util'
import { DISK_RADIUS } from 'simulation/constants'
import { Scrollbar } from 'scrollbar'
import type { PinballWizard } from 'pinball-wizard'
import { BallSelectionPanel } from 'ball-selection-panel'
import { type GfxRegionName } from 'imp-names'
import { GfxRegion } from './gfx-region'

// const cvs = ((typeof document === 'undefined') ? null : document.getElementById('sim-canvas')) as HTMLCanvasElement
// const ctx = (cvs ? cvs.getContext('2d') : null) as CanvasRenderingContext2D

export const OBSTACLE_FILL = '#888'
export const OBSTACLE_STROKE = '#000'

export class Graphics {
  static get cvs() { return this._testCanvas }

  static innerWidth = 1
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

    // test new graphics
    const _root: Rectangle = [
      cssLeft, 0,
      cssWidth + scrollbar[2],
      cssHeight,
    ]

    const testCvs = this._testCanvas // new canvas in front
    testCvs.style.setProperty('position', `absolute`)
    testCvs.style.setProperty('left', `${_root[0]}px`)
    testCvs.style.setProperty('top', `${_root[1]}px`)
    testCvs.style.setProperty('width', `${_root[2]}px`)
    testCvs.style.setProperty('height', `${_root[3]}px`)
    testCvs.width = _root[2] * window.devicePixelRatio
    testCvs.height = _root[3] * window.devicePixelRatio

    this._testCvs = testCvs
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
    }

    // call all regions' onResize callbacks
    Object.keys(this._regions).forEach((gfxName) => {
      GfxRegion.create(gfxName as GfxRegionName)
        .onResize(this._regions[gfxName].map(v => v * window.devicePixelRatio))
    })
  }

  static get _testCanvas() {
    return document.getElementById('test-canvas') as HTMLCanvasElement
  }

  static cssLeft = 0

  private static _regions: Partial<Record<GfxRegionName, Rectangle>> = {}
  private static _testCvs

  static get regions() { return Graphics._regions }

  static drawNew(pw: PinballWizard) {
    // draw all regions on test canvas
    const testCtx = this._testCvs.getContext('2d') as CanvasRenderingContext2D
    if (pw) {
      Object.keys(this._regions).forEach((gfxName) => {
        GfxRegion.create(gfxName as GfxRegionName)
          .draw(testCtx, pw, this._regions[gfxName].map(v => v * window.devicePixelRatio))
      })
    }
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
