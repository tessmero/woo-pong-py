/**
 * @file gfx-config.ts
 *
 * Settings for graphics, performance, and styles.
 */

import { Configurable } from '../configurable'
import type { ConfigTree } from '../config-tree'
import type { PinballWizard } from 'pinball-wizard'

// called when sliders are dragged in dev mode
function onChange(pinballWizard: PinballWizard) {
  gfxConfig.refreshConfig()
  pinballWizard.onResize()
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

    emoteProbability: {
      tooltip: 'probability to change facial expression per ms',
      value: 1e-3,
      min: 0,
      max: 1e-2,
      onChange,
    },

    sceneryEntrance: {
      children: {
        seDamping: {
          value: 15,
          min: 0,
          max: 100,
          onChange,
        },
        seFreq: {
          value: 6,
          min: 1,
          max: 100,
          onChange,
        },
        seMaxTime: {
          value: 0.5,
          min: 0.1,
          max: 10,
          onChange,
        },
      },
    },
  },
} satisfies ConfigTree

// register Configurable
class GfxConfig extends Configurable<typeof gfxConfigTree> {
  static { Configurable.register('gfx-config', () => new GfxConfig()) }
  tree = gfxConfigTree
}
export const gfxConfig = Configurable.create('gfx-config') as GfxConfig
