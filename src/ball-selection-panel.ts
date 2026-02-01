/**
 * @file ball-selection-panel.ts
 *
 * Ball selection panel.
 */

import { GfxRegion } from 'gfx/gfx-region'
import { Graphics } from 'gfx/graphics'
import { BspGfx } from 'gfx/imp/bsp-gfx'
import { ballsBtn } from 'guis/imp/playing-gui'
import type { PinballWizard } from 'pinball-wizard'
import { type Rectangle } from 'util/math-util'

export class BallSelectionPanel {
  static isRepaintQueued = false

  private static _drawScale = 1
  private static _bounds: Rectangle = [1, 1, 1, 1]

  public static get isShowing() {
    return Graphics._bspCvs.style.display !== 'none'
  }

  static show(pw: PinballWizard) {
    Graphics._glassCvs.style.setProperty('display', 'block')
    Graphics._bspCvs.style.setProperty('display', 'block')
    ballsBtn.htmlElem?.classList.add('active')
    Graphics.targetPixelAnim = 1
    ;(GfxRegion.create('bsp-gfx') as BspGfx).startEntrance()
    pw.onResize()
  }

  static hide(pw: PinballWizard, skipResize = false) {
    Graphics._glassCvs.style.setProperty('display', 'none')
    Graphics._bspCvs.style.setProperty('display', 'none')
    ballsBtn.htmlElem?.classList.remove('active')
    Graphics.targetPixelAnim = 0
    ;(GfxRegion.create('bsp-gfx') as BspGfx).startExit()
    if (!skipResize) {
      pw.onResize()
    }
  }

  static toggle(pw: PinballWizard) {
    if (BallSelectionPanel.isShowing) {
      BallSelectionPanel.hide(pw)
    }
    else {
      BallSelectionPanel.show(pw)
    }
  }

  // static initListeners(pw: PinballWizard) {
  //   if (didInitListeners) {
  //     throw new Error('BallSelectionPanel.initListeners() called multiple times')
  //   }
  //   didInitListeners = true
  //   cvs.addEventListener('pointerdown', (e) => {
  //     const i = getBspHoveredDiskIndexPe(e)
  //     pw.trySelectDisk(i)
  //     cvs.style.setProperty('cursor', 'default')
  //   })

  //   cvs.addEventListener('pointermove', (e) => {
  //     const i = getBspHoveredDiskIndexPe(e)
  //     if (i === -1 || pw.hasBranched || i === pw.selectedDiskIndex) {
  //       cvs.style.setProperty('cursor', 'default')
  //     }
  //     else {
  //       cvs.style.setProperty('cursor', 'pointer')
  //     }
  //   })
  // }

  static draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    // if (cvs.style.display === 'none') {
    //   return // not visible
    // }

  }
}
