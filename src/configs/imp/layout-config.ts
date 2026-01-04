/**
 * @file layout-config.ts
 *
 * Used to adjust layouts at runtime.
 */

import { Configurable } from '../configurable'
import type { ConfigItem, ConfigTree } from '../config-tree'

const layoutConfigTree = {
  children: {

    outerMargin: {
      tooltip: 'margin at viewport bounds',
      value: 10,
      min: 0,
      max: 100,
      step: 1,
    },

    innerMargin: {
      tooltip: 'margin at dialog panel bounds',
      value: 10,
      min: 0,
      max: 100,
      step: 1,

    },

    smButtonWidth: {
      tooltip: 'width for small square-ish buttons on small screens',
      value: 80,
      min: 10,
      max: 100,
      step: 1,
    },

    buttonWidth: {
      tooltip: 'width for small square-ish buttons on desktop',
      value: 150,
      min: 10,
      max: 100,
      step: 1,
    },

    smButtonHeight: {
      tooltip: 'standard button thickness on small screens',
      value: 35,
      min: 10,
      max: 100,
      step: 1,
    },

    buttonHeight: {
      tooltip: 'standard button thickness on desktop',
      value: 50,
      min: 10,
      max: 100,
      step: 1,
    },

  },
} satisfies ConfigTree

for (const item of Object.values(layoutConfigTree.children)) {
  (item as ConfigItem).onChange = (pinballWizard) => {
    layoutConfig.refreshConfig()
    pinballWizard.onResize()
  }
}

class LayoutConfig extends Configurable<typeof layoutConfigTree> {
  static { Configurable.register('layout-config', () => new LayoutConfig()) }
  tree = layoutConfigTree
}

export const layoutConfig = Configurable.create('layout-config') as LayoutConfig
