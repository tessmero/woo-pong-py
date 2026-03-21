/**
 * @file ball-party-panel.ts
 *
 * Ball party panel singleton.
 */

import { GfxRegion } from 'gfx/regions/gfx-region'
import { Graphics } from 'gfx/graphics'
import type { PinballWizard } from 'pinball-wizard'
import { Panel } from './panel'
import type { BspGfx } from 'gfx/regions/imp/bsp-gfx'

class BallPartyPanel extends Panel {
  protected _show(_pw: PinballWizard) {
    // ballsBtn.htmlElem?.classList.add('active')
    Graphics.targetBspAnim = 1
    ;(GfxRegion.create('bsp-gfx') as BspGfx).startEntrance()
  }

  protected _hide(_pw: PinballWizard) {
    // ballsBtn.htmlElem?.classList.remove('active')
    Graphics.targetBspAnim = 0
    ;(GfxRegion.create('bsp-gfx') as BspGfx).startExit()
  }
}

export const ballPartyPanel = new BallPartyPanel('bsp-canvas')
