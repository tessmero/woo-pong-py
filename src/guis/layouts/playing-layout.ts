/**
 * @file playing-layout.ts
 *
 * Main game gui with play area.
 */

import type { CssLayout } from 'util/layout-parser'

// const om = () => layoutConfig.flatConfig.outerMargin
// const im = () => layoutConfig.flatConfig.innerMargin
// const _bw = btnWidth
// const bh = btnHeight

export const PLAYING_LAYOUT = {

  screen: {},

  resetBtn: {
    parent: 'screen',
    width: 200,
    height: 40,
    top: 5,
    right: 5,
    // 'width': '50%',
    // 'min-width': 200,
    // 'height': '10%',
    // 'min-height': 50,
    // 'left': 'auto',
    // 'top': 'auto',
  },

} as const satisfies CssLayout

export type PlayingLayoutKey = keyof typeof PLAYING_LAYOUT
