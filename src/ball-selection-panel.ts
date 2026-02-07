/**
 * @file ball-selection-panel.ts
 *
 * Ball selection panel.
 */

import { GfxRegion } from 'gfx/gfx-region'
import { Graphics } from 'gfx/graphics'
import type { BspGfx } from 'gfx/imp/bsp-gfx'
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
    Graphics._bspCvs.style.setProperty('display', 'block')
    // ballsBtn.htmlElem?.classList.add('active')
    Graphics.targetPixelAnim = 1
    ;(GfxRegion.create('bsp-gfx') as BspGfx).startEntrance()
    pw.onResize()
  }

  static hide(pw: PinballWizard, skipResize = false) {
    Graphics._bspCvs.style.setProperty('display', 'none')
    // ballsBtn.htmlElem?.classList.remove('active')
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
}
