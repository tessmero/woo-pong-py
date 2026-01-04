/**
 * @file layout-util.ts
 *
 * Util functions for looking up standard layout shapes in functions in layouts.
 * These are used instead of '@portrait' suffixes in cases where numeric values are used for computations.
 * For example, computing the total width of a toolbar whose buttons may change shape depending on device.
 */

import { layoutConfig } from 'configs/imp/layout-config'
import { GuiLayoutParser } from 'util/layout-parser'

let _isLandscape = true
let _isPortrait = false
let isSmall = true

export function setLayoutUtilMode(glp: GuiLayoutParser<string>) {
  _isLandscape = glp.isLandscape
  _isPortrait = glp.isPortrait
  isSmall = GuiLayoutParser.isSmall
}

export function btnWidth() {
  const { buttonWidth, smButtonWidth } = layoutConfig.flatConfig
  return isSmall ? smButtonWidth : buttonWidth
}

export function btnHeight() {
  const { buttonHeight, smButtonHeight } = layoutConfig.flatConfig
  return isSmall ? smButtonHeight : buttonHeight
}
