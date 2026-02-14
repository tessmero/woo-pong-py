/**
 * @file vibrate.ts
 *
 * Short vibrate on mobile.
 */

import { playSound } from 'audio/collision-sounds'
import type { PinballWizard } from 'pinball-wizard'

export function shortVibrate(pw: PinballWizard) {
  if (pw.speed === 'faster') return
  navigator.vibrate(10)
  playSound('click_002.ogg')
}
