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

  topLabel: {
    parent: '_outerMargin',
    height: () => bh(),
    // 'top@portrait': '-100%', // hidden
    // () => bh() + im(),
  },

  bottomLabel: {
    parent: '_outerMargin',
    height: () => bh(),
    left: 0,
    bottom: 0,
  },

  nextLevelBtn: {
    parent: '_outerMargin',
    width: () => bw(),
    height: () => bh(),
    right: 0,
    bottom: 0,
  },

  campaignBtn: {
    parent: '_outerMargin',
    width: () => bw(),
    height: () => bh(),
  },

  musicBtn: {
    parent: 'campaignBtn',
    width: () => bh(),
    left: () => bw() + im(),
  },

  resetBtn: {
    parent: '_outerMargin',
    width: () => bw(),
    height: () => bh(),
    right: 0,
    top: 0,
  },

  bottomBar: {
    parent: '_outerMargin',
    width: () => bw(),
    height: () => bh(),
    left: 'auto',
    bottom: 0,
  },

  rotateLeft: {
    parent: 'bottomBar',
    width: '50%',
  },

  rotateRight: {
    parent: 'bottomBar',
    width: '50%',
    right: 0,
  },

  editBtn: {
    parent: 'resetBtn',
  },

  winPanel: {
    'width': 600,
    'height': 600,
    'max-width': '90%',
    'max-height': '90%',
    'left': 'auto',
    'top': 'auto',
  },

  _innerWinPanel: {
    parent: 'winPanel',
    margin: () => layoutConfig.flatConfig.innerMargin,
  },

  winTitle: {
    parent: '_innerWinPanel',
    height: 50,
    width: -50,
  },

  winCloseBtn: {
    parent: '_innerWinPanel',
    height: 50,
    right: 0,
  },

  winDiagram: {
    parent: '_innerWinPanel',
    width: 300,
    height: 200,
    left: 'auto',
    top: 'auto',
  },

  winNextLevelBtn: {
    parent: '_innerWinPanel',
    width: 200,
    height: 50,
    left: 'auto',
    bottom: 0,
  },

} as const satisfies CssLayout

export type PlayingLayoutKey = keyof typeof PLAYING_LAYOUT
