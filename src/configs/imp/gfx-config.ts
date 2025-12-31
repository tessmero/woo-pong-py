/**
 * @file gfx-config.ts
 *
 * Settings for graphics, performance, and styles.
 */

import { Configurable } from '../configurable'
import type { ConfigTree } from '../config-tree'
import type { PinballWizard } from 'pinball-wizard'

// called when sliders are dragged in dev mode
function onChange(_pinballWizard: PinballWizard) {
  gfxConfig.refreshConfig()
  // pinballWizard.onResize()
}

const gfxConfigTree = {
  label: 'Graphics',
  children: {

    pixelScale: {
      value: 1,
      min: 1,
      max: 10,
      step: 1,
      onChange,
    },

  },
} satisfies ConfigTree

// register Configurable
class GfxConfig extends Configurable<typeof gfxConfigTree> {
  static { Configurable.register('gfx-config', () => new GfxConfig()) }
  tree = gfxConfigTree
}
export const gfxConfig = Configurable.create('gfx-config') as GfxConfig
