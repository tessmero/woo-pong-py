/**
 * @file pinball-wizard-config.ts
 *
 * Combined config tree displayed as debugging user interface.
 */
import { Configurable } from '../configurable'
import type { ConfigTree } from '../config-tree'
// import { topConfig } from './top-config'
import { gfxConfig } from './gfx-config'
import { topConfig } from './top-config'

const pinballWizardConfigTree = {

  children: {
    ...topConfig.tree.children, // unpack children at top level
    ...gfxConfig.tree.children,
  },
} satisfies ConfigTree

class PinballWizardConfig extends Configurable<typeof pinballWizardConfigTree> {
  static { Configurable.register('pinball-wizard-config', () => new PinballWizardConfig()) }
  tree = pinballWizardConfigTree
}

export const pinballWizardConfig = Configurable.create('pinball-wizard-config') as PinballWizardConfig
