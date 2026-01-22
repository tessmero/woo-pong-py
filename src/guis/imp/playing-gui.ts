/**
 * @file playing-gui.ts
 *
 * Placeholder used for games with no gui elements.
 */

import { BallSelectionPanel } from 'ball-selection-panel'
import type { GuiElement } from 'guis/gui'
import { Gui } from 'guis/gui'
import { setElementLabel, toggleElement } from 'guis/gui-html-elements'
import type { PlayingLayoutKey } from 'guis/layouts/playing-layout'
import { PLAYING_LAYOUT } from 'guis/layouts/playing-layout'
import { PinballWizard } from 'pinball-wizard'
import type { Speed } from 'simulation/constants'
import { SECONDS_BEFORE_BRANCH, stepsToSeconds } from 'simulation/constants'
import type { Vec2 } from 'util/math-util'

type PlayingElem = GuiElement<PlayingLayoutKey>

export const topLabel: PlayingElem = {
  layoutKey: 'topBar',
  display: {
    type: 'panel',
    label: '',
  },
}

export const ballsBtn: PlayingElem = {
  layoutKey: 'ballsBtn',
  display: {
    type: 'button',
    label: 'BALLS',
  },
  click: ({ pinballWizard }) => {
    BallSelectionPanel.toggle()
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

const pauseBtn: PlayingElem = {
  layoutKey: 'pauseBtn',
  display: {
    type: 'button',
    icon: 'pause',
  },
  click: ({ pinballWizard }) => {
    pinballWizard.speed = 'paused'
  },
}
const playBtn: PlayingElem = {
  layoutKey: 'playBtn',
  display: {
    type: 'button',
    icon: 'play',
  },
  click: ({ pinballWizard }) => {
    pinballWizard.speed = 'normal'
  },
}

const fastBtn: PlayingElem = {
  layoutKey: 'fastBtn',
  display: {
    type: 'button',
    icon: 'fast',
  },
  click: ({ pinballWizard }) => {
    pinballWizard.speed = 'fast'
  },
}

const fasterBtn: PlayingElem = {
  layoutKey: 'fasterBtn',
  display: {
    type: 'button',
    icon: 'faster',
  },
  click: ({ pinballWizard }) => {
    pinballWizard.speed = 'faster'
  },
}

const speedBtns: Record<Speed, PlayingElem> = {
  paused: pauseBtn,
  normal: playBtn,
  fast: fastBtn,
  faster: fasterBtn,
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

const resetBtn: PlayingElem = {
  layoutKey: 'resetBtn',
  display: {
    type: 'button',
    label: 'Play Again',
  },
  click: ({ pinballWizard }) => {
    pinballWizard.reset()
  },
}

const elements: Array<PlayingElem> = [
  topLabel,
  ballsBtn,
  clock,
  ...Object.values(speedBtns),
  resetBtn,
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

  // private lastSpeed: Speed | null = null
  // private lastStatus: string | null = null
  update(pinballWizard: PinballWizard, _dt: number) {
    // update clock display
    const steps = pinballWizard.activeSim.stepCount
    const seconds = stepsToSeconds(steps)
    const label = formatTime(seconds)
    setElementLabel(clock, label)

    // update active speed button
    // if (pinballWizard.speed !== this.lastSpeed) {
    for (const [speed, btn] of Object.entries(speedBtns)) {
      const isActive = (speed === pinballWizard.speed)
      btn.htmlElem!.classList.toggle('active', isActive)
    }
    // }
    // this.lastSpeed = pinballWizard.speed

    // update status text
    const status = getStatusText(pinballWizard, seconds)
    setElementLabel(topLabel, status)
    // this.lastStatus = status
  }

  move(_pinballWizard: PinballWizard, _mousePos: Vec2) {

  }

  down(_pinballWizard: PinballWizard, _mousePos: Vec2) {
  }

  showHideElements(pinballWizard: PinballWizard) {
    for (const elem of elements) {
      toggleElement(elem, !pinballWizard.isTitleScreen)
    }

    toggleElement(resetBtn, pinballWizard.activeSim.winningDiskIndex !== -1)
    // const hasBranched = pinballWizard.hasBranched
    // for (const btn of diskBtns) {
    //   toggleElement(btn, !hasBranched)
    // }
  }
}

function getStatusText(
  pinballWizard: PinballWizard,
  secondsElapsed: number,
) {
  const remainingSeconds = SECONDS_BEFORE_BRANCH - secondsElapsed

  if (pinballWizard.activeSim.winningDiskIndex !== -1) {
    return 'finished'
  }
  if (pinballWizard.isHalted) {
    return `you must choose a ball`
  }
  const i = pinballWizard.selectedDiskIndex
  if (i === -1) {
    return `${remainingSeconds} sec choose a ball`
  }
  if (pinballWizard.hasBranched) {
    return `Choice locked. Wait to finish.`
  }

  // const patternName = pinballWizard.activeSim.disks[i].pattern
  return `${remainingSeconds} sec to reconsider`
}
