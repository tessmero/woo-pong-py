/**
 * @file top-config.ts
 *
 * Global configuration settings, included in pinballWizard-config.
 */

import { Configurable } from '../configurable'
import type { ConfigTree } from '../config-tree'
import type { PinballWizard } from 'pinball-wizard'
import { pinballWizardConfig } from './pinball-wizard-config'
import { Disk } from 'simulation/disk'
import { DiskDiskCollisions } from 'simulation/disk-disk-collisions'

export const isDevMode = true
export async function applyDevMode(pinballWizard: PinballWizard) {
  pinballWizard.rebuildControls() // show controls gui on startup

  // show controls gui on tilde key
  document.addEventListener('keydown', (event) => {
    if (event.key === '`') { // tilde key
      pinballWizard.rebuildControls()
    }
  })
}

// const DEBUG_MODES = ['none', 'basin-parents'] as const
// type DebugMode = (typeof DEBUG_MODES)[number]

const topConfigTree = {
  children: {

    // speed up sim for automated testing
    speedMultiplier: {
      value: 1,
      min: 1,
      max: 100,
      step: 1,
      onChange: () => topConfig.refreshConfig(),
    },

    stepCount:{
      action: (pinballWizard) => {
        const count = pinballWizard.activeSim.stepCount
        console.log(`steps: ${count} cache size: ${DiskDiskCollisions.cacheSize}`)
        // DiskDiskCollisions.downloadBlob()
      }
    }

  },
} satisfies ConfigTree

class TopConfig extends Configurable<typeof topConfigTree> {
  static { Configurable.register('top-config', () => new TopConfig()) }
  tree = topConfigTree
}

export const topConfig = Configurable.create('top-config') as TopConfig
