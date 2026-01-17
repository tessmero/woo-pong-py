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
import { STEP_DURATION } from 'simulation/constants'
import type { Vec2 } from 'util/math-util'

type PlayingElem = GuiElement<PlayingLayoutKey>

export const topLabel: PlayingElem = {
  layoutKey: 'topBar',
  display: {
    type: 'panel',
    label: '',
  },
}

export const clock: PlayingElem = {
  layoutKey: 'clock',
  display: {
    type: 'panel',
    label: '00:00',
  },
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
  topLabel,
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

  update(pinballWizard: PinballWizard, _dt: number) {
    const steps = pinballWizard.activeSim.stepCount
    const label = formatTime(Math.floor(steps * STEP_DURATION / 1000))
    setElementLabel(clock, label)
  }

  move(_pinballWizard: PinballWizard, _mousePos: Vec2) {

  }

  down(_pinballWizard: PinballWizard, _mousePos: Vec2) {
  }

  showHideElements(pinballWizard: PinballWizard) {
    for (const elem of elements) {
      toggleElement(elem, !pinballWizard.isTitleScreen)
    }
    setElementLabel(topLabel, getStatusText(pinballWizard))
    // const hasBranched = pinballWizard.hasBranched
    // for (const btn of diskBtns) {
    //   toggleElement(btn, !hasBranched)
    // }
  }
}

function getStatusText(pinballWizard: PinballWizard) {
  if (pinballWizard.activeSim.winningDiskIndex !== -1) {
    return 'finished'
  }
  if (pinballWizard.isHalted) {
    return 'You must choose a ball'
  }
  const i = pinballWizard.selectedDiskIndex
  if (i === -1) {
    return 'Choose a ball'
  }
  if (pinballWizard.hasBranched) {
    return 'Wait to finish'
  }

  const pattern = pinballWizard.activeSim.disks[i].pattern
  return `selected ${pattern} disk`
}
