/**
 * @file playing-layout.ts
 *
 * Main game gui with play area.
 */

import { layoutConfig } from 'configs/imp/layout-config'
import { btnHeight, btnWidth } from 'guis/layout-util'
import type { CssLayout } from 'util/layout-parser'

const om = () => layoutConfig.flatConfig.outerMargin
const im = () => layoutConfig.flatConfig.innerMargin
const bw = btnWidth
const bh = btnHeight

export const PLAYING_LAYOUT = {

  screen: {},

  _outerMargin: {
    margin: () => om(),
    width: -50,
    left: 'auto',
  },

  topBar: {
    parent: '_outerMargin',
    width: () => 6 * bh() + 4 * im(),
    height: () => bh(),
    left: 'auto',
    // 'top@portrait': '-100%', // hidden
    // () => bh() + im(),
  },

  bottomBar: {
    parent: '_outerMargin',
    width: () => 7 * bh() + 5 * im(),
    height: () => bh(),
    left: 'auto',
    bottom: 0,
  },

  ballsBtn: {
    parent: 'bottomBar',
    width: () => bh(),
  },

  clock: {
    parent: 'ballsBtn',
    width: () => 2 * bh(),
    left: () => bh() + im(),
  },
  pauseBtn: {
    parent: 'clock',
    width: () => bh(),
    left: () => 2 * bh() + im(),
  },
  playBtn: {
    parent: 'pauseBtn',
    width: () => bh(),
    left: () => bh() + im(),
  },
  fastBtn: {
    parent: 'playBtn',
    width: () => bh(),
    left: () => bh() + im(),
  },
  fasterBtn: {
    parent: 'fastBtn',
    width: () => bh(),
    left: () => bh() + im(),
  },


  resetBtn: {
    parent: 'screen',
    width: () => bw(),
    height: () => bh(),
    left: 'auto',
    top: 'auto',
  },


} as const satisfies CssLayout

export type PlayingLayoutKey = keyof typeof PLAYING_LAYOUT
