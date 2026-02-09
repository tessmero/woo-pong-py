/**
 * @file settings-panel.ts
 *
 * Settings panel singleton.
 */

import { GfxRegion } from 'gfx/regions/gfx-region'
import { Graphics } from 'gfx/graphics'
import type { PinballWizard } from 'pinball-wizard'
import { Panel } from './panel'
import type { SettingsGfx } from 'gfx/regions/imp/settings-gfx'

class SettingsPanel extends Panel {
  protected _show(_pw: PinballWizard) {
    // ballsBtn.htmlElem?.classList.add('active')
    Graphics.targetStgAnim = 1
    ;(GfxRegion.create('settings-gfx') as SettingsGfx).startEntrance()
  }

  protected _hide(_pw: PinballWizard) {
    // ballsBtn.htmlElem?.classList.remove('active')
    Graphics.targetStgAnim = 0
    ;(GfxRegion.create('settings-gfx') as SettingsGfx).startExit()
  }
}

export const settingsPanel = new SettingsPanel('settings-canvas')
