/**
 * @file playing-gui.ts
 *
 * Placeholder used for games with no gui elements.
 */

import type { GuiElement } from 'guis/gui'
import { Gui } from 'guis/gui'
import { setElementLabel, toggleElement } from 'guis/gui-html-elements'
import type { PlayingLayoutKey } from 'guis/layouts/playing-layout'
import { PLAYING_LAYOUT } from 'guis/layouts/playing-layout'
import type { PinballWizard } from 'pinball-wizard'
import type { Vec2 } from 'util/math-util'

type PlayingElem = GuiElement<PlayingLayoutKey>

export const clock: PlayingElem = {
  layoutKey: 'clock',
  display: {
    type: 'panel',
    label: '00:00',
  },
}
export function updateClockLabel(steps: number) {
  setElementLabel(clock, formatTime(steps))
}
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)

  // Use padStart to ensure two digits for both minutes and seconds
  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')

  return `${formattedMinutes}:${formattedSeconds}`
}

export const playPauseBtn: PlayingElem = {
  layoutKey: 'playPauseBtn',
  display: {
    type: 'button',
    label: 'PAUSE',
  },
  click: ({ pinballWizard }) => {
    if (pinballWizard.speed === 'normal') {
      pinballWizard.speed = 'paused'
    }
    else {
      pinballWizard.speed = 'normal'
    }
  },
}

export const speedUpBtn: PlayingElem = {
  layoutKey: 'speedUpBtn',
  display: {
    type: 'button',
    label: 'speed up',
  },
  click: ({ pinballWizard }) => {
    pinballWizard.speed = 'fast'
  },
}

// export const diskBtns: Array<PlayingElem> = Array.from({ length: DISK_COUNT }, (_, i) => ({
//   layoutKey: `disk${i}` as PlayingLayoutKey,
//   display: {
//     type: 'button',
//     label: `${i}`,
//   },
//   click: ({ pinballWizard }) => {
//     pinballWizard.selectedDiskIndex = i
//     const raceSeeds = Lut.create('race-lut').tree[0]
//     pinballWizard.activeSim.branchSeed = raceSeeds[i + 1]
//   },
// }))

const elements: Array<PlayingElem> = [
  clock,
  playPauseBtn,
  speedUpBtn,
  // ...diskBtns,
]

export class PlayingGui extends Gui<PlayingLayoutKey> {
  static {
    Gui.register('playing-gui', {
      factory: () => new PlayingGui(),
      layoutFactory: () => PLAYING_LAYOUT,
      elements,
    })
  }

  update(_pinballWizard: PinballWizard, _dt: number) {

  }

  move(_pinballWizard: PinballWizard, _mousePos: Vec2) {

  }

  down(_pinballWizard: PinballWizard, _mousePos: Vec2) {
  }

  showHideElements(pinballWizard: PinballWizard) {
    for (const elem of elements) {
      toggleElement(elem, !pinballWizard.isTitleScreen)
    }
    const hasBranched = pinballWizard.hasBranched
    // for (const btn of diskBtns) {
    //   toggleElement(btn, !hasBranched)
    // }
  }
}
