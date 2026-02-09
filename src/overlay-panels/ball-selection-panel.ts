/**
 * @file ball-selection-panel.ts
 *
 * Ball selection panel singleton.
 */

import { GfxRegion } from 'gfx/regions/gfx-region'
import { Graphics } from 'gfx/graphics'
import type { PinballWizard } from 'pinball-wizard'
import { Panel } from './panel'
import { BspGfx } from 'gfx/regions/imp/bsp-gfx';

class BallSelectionPanel extends Panel {
  protected _show(pw: PinballWizard) {
    // ballsBtn.htmlElem?.classList.add('active')
    Graphics.targetBspAnim = 1
    ;(GfxRegion.create('bsp-gfx') as BspGfx).startEntrance()
  }

  protected _hide(pw: PinballWizard) {
    // ballsBtn.htmlElem?.classList.remove('active')
    Graphics.targetBspAnim = 0
    ;(GfxRegion.create('bsp-gfx') as BspGfx).startExit()
  }
}

export const ballSelectionPanel = new BallSelectionPanel('bsp-canvas')
