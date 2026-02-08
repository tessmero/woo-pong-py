/**
 * @file settings-panel.ts
 *
 * Settings panel singleton.
 */

import { GfxRegion } from 'gfx/gfx-region'
import { Graphics } from 'gfx/graphics'
import type { BspGfx } from 'gfx/imp/bsp-gfx'
import type { PinballWizard } from 'pinball-wizard'
import { Panel } from './panel'
import { SettingsGfx } from 'gfx/imp/settings-gfx'

class SettingsPanel extends Panel {
  protected _show(pw: PinballWizard) {
    // ballsBtn.htmlElem?.classList.add('active')
    ;(GfxRegion.create('settings-gfx') as SettingsGfx).startEntrance()
  }

  protected _hide(pw: PinballWizard) {
    // ballsBtn.htmlElem?.classList.remove('active')
    ;(GfxRegion.create('settings-gfx') as SettingsGfx).startExit()
  }
}

export const settingsPanel = new SettingsPanel('settings-canvas')
