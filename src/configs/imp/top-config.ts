/**
 * @file top-config.ts
 *
 * Global configuration settings, included in pinballWizard-config.
 */

import { Configurable } from '../configurable'
import type { ConfigTree } from '../config-tree'
import type { PinballWizard } from 'pinball-wizard'
import { SPEEDS } from 'simulation/constants'

export const isDevMode = false
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
    scrollSpeed: {
      value: -2000,
      min: -10000,
      max: 10000,
      step: 1,
      onChange: () => topConfig.refreshConfig(),
    },

    rngSeed: {
      value: -1,
      min: -1,
      max: Number.MAX_SAFE_INTEGER,
      step: 1,
      onChange: () => topConfig.refreshConfig(),
    },

    topSpeed: {
      value: 30,
      min: 2,
      max: 1e6,
      onChange: () => {
        topConfig.refreshConfig()
        SPEEDS.faster = topConfig.flatConfig.topSpeed
      },
    },

    speedLerp: {
      value: 4e-3,
      min: 0,
      max: 1,
      onChange: () => topConfig.refreshConfig(),
    },

    roomIndex: {
      value: 0,
      min: -1,
      max: 10,
      step: 1,
      onChange: () => topConfig.refreshConfig(),
    },

    // stepCount:{
    //   action: (pinballWizard) => {
    //     const count = pinballWizard.activeSim.stepCount
    //     console.log(`steps: ${count} cache size: ${DiskDiskCollisions.cacheSize}`)
    //     // DiskDiskCollisions.downloadBlob()
    //   }
    // }

  },
} satisfies ConfigTree

class TopConfig extends Configurable<typeof topConfigTree> {
  static { Configurable.register('top-config', () => new TopConfig()) }
  tree = topConfigTree
}

export const topConfig = Configurable.create('top-config') as TopConfig
