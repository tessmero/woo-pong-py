/**
 * @file physics-config.ts
 *
 * Settings for p2 physics simulation.
 */

import { Configurable } from '../configurable'
import type { ConfigTree } from '../config-tree'

// called when sliders are dragged in dev mode
function onChange() {
  physicsConfig.refreshConfig()
}

const physicsConfigTree = {
  label: 'Physics',
  children: {

    stepDelay: {
      value: 3,
      min: 3,
      max: 10000,
      step: 1,
      onChange,
    },

    spawnDelay: {
      value: 3,
      min: 3,
      max: 10000,
      step: 1,
      onChange,
    },

  },
} satisfies ConfigTree

// register Configurable
class PhysicsConfig extends Configurable<typeof physicsConfigTree> {
  static { Configurable.register('physics-config', () => new PhysicsConfig()) }
  tree = physicsConfigTree
}
export const physicsConfig = Configurable.create('physics-config') as PhysicsConfig
