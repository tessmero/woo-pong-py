/**
 * @file title-screen-layout.ts
 *
 * Title screen layout.
 */

import { layoutConfig } from 'configs/imp/layout-config'
import { btnHeight, btnWidth } from 'guis/layout-util'
import type { CssLayout } from 'util/layout-parser'

const om = () => layoutConfig.flatConfig.outerMargin
const im = () => layoutConfig.flatConfig.innerMargin
const bw = btnWidth
const bh = btnHeight

export const TITLE_SCREEN_LAYOUT = {

  screen: {},

  mainTitle: {
    width: 600,
    height: 600,
  },

  topTitle: {
    parent: 'mainTitle',
    height: 100,
    bottom: '100%',
  },

  bottomTitle: {
    parent: 'mainTitle',
    height: 100,
    bottom: '100%',
  },

} as const satisfies CssLayout

export type TitleScreenLayoutKey = keyof typeof TITLE_SCREEN_LAYOUT
