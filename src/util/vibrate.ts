/**
 * @file vibrate.ts
 *
 * Short vibrate on mobile.
 */

import { playSound } from 'audio/collision-sounds'

export function shortVibrate() {
  navigator.vibrate(10)
  playSound('click_002.ogg')
}
