/**
 * @file test-support.ts
 *
 * Interface to support automated report ath appears on tessmero.github.io.
 */

import { type PinballWizard } from 'pinball-wizard'
import { topConfig } from 'configs/imp/top-config'
import { Gui } from 'guis/gui'
import { GfxRegion } from 'gfx/gfx-region'
import type { SimGfx } from 'gfx/imp/sim-gfx'
import type { BottomBarGfx } from 'gfx/imp/bottom-bar-gfx'
import { Graphics } from 'gfx/graphics'

export function getTestSupport(pinballWizard: PinballWizard) {
  return {

    locateElement: (id: string) => {
      if (pinballWizard.isTitleScreen) {
        // // lookup element in title screen html doc
        // const iframe = document.getElementById('title-iframe') as HTMLIFrameElement
        // const inner = iframe.contentDocument as Document
        // const elem = inner.getElementById(id)
        const elem = (window as any).startBtn // eslint-disable-line @typescript-eslint/no-explicit-any

        const domRect = elem?.getBoundingClientRect() as DOMRect
        if (!domRect || !Object.hasOwn(domRect, 'x')) {
          return [350, 450, 100, 50]
        }
        const { x, y, width, height } = domRect
        return [x, y, width, height]
      }
      else if (id.startsWith('ball-')) {
        // locate disk in simulation
        const diskIndex = Number(id.split('-')[1])
        return (GfxRegion.create('sim-gfx') as SimGfx).locateDiskOnScreen(pinballWizard, diskIndex)
      }
      else {
        // locate elemnt in bottom bar gfx
        const gfx = GfxRegion.create('bottom-bar-gfx') as BottomBarGfx
        const rect = gfx.tsLocateElement(id)
        if (rect) return rect

        // locate element in gui
        const guisToCheck = [Gui.create('playing-gui')]
        for (const gui of guisToCheck) {
          const rect = gui.layoutRectangles[id]
          if (!rect) continue
          const [x, y, w, h] = rect
          const ps = 1// seaBlock.config.flatConfig.pixelScale
          return [x * ps, y * ps, w * ps, h * ps]
        }
      }
      return null
    },

    getCameraPos: () => {
      return [0, 0]
    },

    getSetting: (key) => {
      return topConfig.flatConfig[key]
    },

    applySetting: (key, value) => {
      if (key in topConfig.tree.children) {
        // only works for items at top level
        const item = topConfig.tree.children[key]
        item.value = value
        item.onChange()
      }
    },

    getGameState: () => {
      if (pinballWizard.loadingState) {
        return pinballWizard.loadingState
      }
      if (pinballWizard.isTitleScreen) {
        return 'title-screen'
      }

      const winner = pinballWizard.activeSim.winningDiskIndex
      if (winner !== -1) {
        return `ball-${winner}-finished`
        // return `finished`
      }

      const base = pinballWizard.speed
      const ball = pinballWizard.selectedDiskIndex
      if (ball === -1) {
        return `${base}`
      }
      return `${base}-ball-${ball}`
    },

    getCursorState: () => {
      let style = (window as any).cursorForTestSupport // eslint-disable-line @typescript-eslint/no-explicit-any
      if (Graphics.cvs.style.cursor === 'pointer') {
        style = 'pointer'
      }
      return {
        x: (window as any).mouseXForTestSupport, // eslint-disable-line @typescript-eslint/no-explicit-any
        y: (window as any).mouseYForTestSupport, // eslint-disable-line @typescript-eslint/no-explicit-any
        style,
      }
    },
  }
}
