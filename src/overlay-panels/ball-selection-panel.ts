/**
 * @file ball-selection-panel.ts
 *
 * Ball selection panel singleton.
 */

import { GfxRegion } from 'gfx/gfx-region'
import { Graphics } from 'gfx/graphics'
import type { BspGfx } from 'gfx/imp/bsp-gfx'
import type { PinballWizard } from 'pinball-wizard'
import { Panel } from './panel'

class BallSelectionPanel extends Panel {
  protected _show(pw: PinballWizard) {
    // ballsBtn.htmlElem?.classList.add('active')
    Graphics.targetPixelAnim = 1
    ;(GfxRegion.create('bsp-gfx') as BspGfx).startEntrance()
  }

  protected _hide(pw: PinballWizard) {
    // ballsBtn.htmlElem?.classList.remove('active')
    Graphics.targetPixelAnim = 0
    ;(GfxRegion.create('bsp-gfx') as BspGfx).startExit()
  }
}

export const ballSelectionPanel = new BallSelectionPanel('bsp-canvas')
