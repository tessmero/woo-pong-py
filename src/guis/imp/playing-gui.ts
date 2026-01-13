/**
 * @file playing-gui.ts
 *
 * Placeholder used for games with no gui elements.
 */

import type { GuiElement } from 'guis/gui'
import { Gui } from 'guis/gui'
import { toggleElement } from 'guis/gui-html-elements'
import type { PlayingLayoutKey } from 'guis/layouts/playing-layout'
import { PLAYING_LAYOUT } from 'guis/layouts/playing-layout'
import type { PinballWizard } from 'pinball-wizard'
import { DISK_COUNT } from 'simulation/constants'
import { Lut } from 'simulation/luts/lut'
import type { Vec2 } from 'util/math-util'

type PlayingElem = GuiElement<PlayingLayoutKey>


export const clock: PlayingElem = {
  layoutKey: 'clock',
  display: {
    type: 'panel',
    label: '00:00',
  },
}

export const playPauseBtn: PlayingElem = {
  layoutKey: 'playPauseBtn',
  display: {
    type: 'button',
    label: 'play/pause',
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

export class PlayingGui extends Gui<PlayingLayoutKey> {
  static {
    Gui.register('playing-gui', {
      factory: () => new PlayingGui(),
      layoutFactory: () => PLAYING_LAYOUT,
      elements: [
        // clock,
        // playPauseBtn,
        // speedUpBtn,
        // ...diskBtns,
      ],
    })
  }

  update(_pinballWizard: PinballWizard, _dt: number) {

  }

  move(_pinballWizard: PinballWizard, _mousePos: Vec2) {

  }

  down(_pinballWizard: PinballWizard, _mousePos: Vec2) {
  }

  showHideElements(pinballWizard: PinballWizard) {
    const hasBranched = pinballWizard.hasBranched
    // for (const btn of diskBtns) {
    //   toggleElement(btn, !hasBranched)
    // }
  }
}
