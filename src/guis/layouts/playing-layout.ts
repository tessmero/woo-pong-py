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
    height: () => bh(),
    // 'top@portrait': '-100%', // hidden
    // () => bh() + im(),
  },

  bottomBar: {
    parent: '_outerMargin',
    width: () => 6 * bh() + 4 * im(),
    height: () => bh(),
    left: 'auto',
    bottom: 0,
  },

  clock: {
    parent: 'bottomBar',
    width: () => 2 * bh(),
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

  rightBar: {
    parent: '_outerMargin',
    width: 100,
    height: 400,
    right: 0,
    top: 'auto',
  },

  _innerRightBar: {
    parent: 'rightBar',
    margin: () => im(),
  },
} as const satisfies CssLayout

export type PlayingLayoutKey = keyof typeof PLAYING_LAYOUT
