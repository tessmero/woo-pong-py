/**
 * @file playing-gui.ts
 *
 * Placeholder used for games with no gui elements.
 */

import type { GuiElement } from 'guis/gui'
import { Gui } from 'guis/gui'
import type { PlayingLayoutKey } from 'guis/layouts/playing-layout'
import { PLAYING_LAYOUT } from 'guis/layouts/playing-layout'
import type { PinballWizard } from 'pinball-wizard'
import type { Vec2 } from 'util/math-util'

type PlayingElem = GuiElement<PlayingLayoutKey>

// export const playArea: ZeroElem = {
//   layoutKey: 'screen',
//   display: {
//     type: 'diagram',
//   },
//   down: ({ pinballWizard, pointerEvent }) => {
//     const { clientX, clientY } = pointerEvent
//     const dpr = window.devicePixelRatio
//     const pos: Vec2 = [clientX * dpr, clientY * dpr]
//     // console.log(`down play area at ${pos}`)
//     pinballWizard.down(pos)
//   },
//   up: ({ pinballWizard, pointerEvent }) => {
//     const { clientX, clientY } = pointerEvent
//     const dpr = window.devicePixelRatio
//     const pos: Vec2 = [clientX * dpr, clientY * dpr]
//     // console.log(`up play area at ${pos}`)
//     pinballWizard.up(pos)
//   },
//   move: ({ pinballWizard, pointerEvent }) => {
//     const { clientX, clientY } = pointerEvent
//     const dpr = window.devicePixelRatio
//     const pos: Vec2 = [clientX * dpr, clientY * dpr]
//     // console.log(`move play area at ${pos}`)
//     pinballWizard.move(pos)
//   },
// }

export const topLabel: PlayingElem = {
  layoutKey: 'topLabel',
  display: {
    type: 'panel',
    label: 'Remove one block',
    textAlign: 'left',
    styles: { border: 'none' },
  },
}

export const playPauseBtn: PlayingElem = {
  layoutKey: 'bottomLabel',
  display: {
    type: 'button',
    label: 'play/pause',
  },
  click: ({pinballWizard}) => {
    pinballWizard.isPaused = !pinballWizard.isPaused
  }
}

export class PlayingGui extends Gui<PlayingLayoutKey> {
  static {
    Gui.register('playing-gui', {
      factory: () => new PlayingGui(),
      layoutFactory: () => PLAYING_LAYOUT,
      elements: [
        topLabel,
        playPauseBtn,
      ],
    })
  }

  update(_pinballWizard: PinballWizard, _dt: number) {

  }

  move(_pinballWizard: PinballWizard, _mousePos: Vec2) {

  }

  down(_pinballWizard: PinballWizard, _mousePos: Vec2) {
  }

  showHideElements(_pinballWizard: PinballWizard) {
    //
  }
}
