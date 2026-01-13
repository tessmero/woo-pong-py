/**
 * @file test-support.ts
 *
 * Interface to support automated report ath appears on tessmero.github.io.
 */

import { type PinballWizard } from 'pinball-wizard'
import { topConfig } from 'configs/imp/top-config'

export function getTestSupport(_pinballWizard: PinballWizard) {
  return {

    locateElement: (id: string) => {
      return [100, 100, 100, 100]
    },

    getCameraPos: () => {
      return [0,0]
    },

    getSetting: (key) => {
      return topConfig.flatConfig[key]
    },

    applySetting: (key, value) => {
      if (key in topConfig.tree.children) {
        topConfig.tree.children[key].value = value // only works for items at top level
      }
      topConfig.flatConfig[key] = value
    },

    getGameState: () => {
      return 'title-screen'
    },

    getCursorState: () => {
      return {
        x: (window as any).mouseXForTestSupport, // eslint-disable-line @typescript-eslint/no-explicit-any
        y: (window as any).mouseYForTestSupport, // eslint-disable-line @typescript-eslint/no-explicit-any
        style: (window as any).cursorForTestSupport, // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    },

    // getCameraPos: () => {
    //   const { x, y, z } = pinballWizard.graphics.camera.camera.position
    //   return [x, y, z]
    // },

    // locateElement(id: string) {
    //   const parts = id.split('-')
    //   if (parts.length === 3 && DIRECTIONS.includes(parts[0] as Direction)) {
    //     // id is side-box-rect e.g. 'S-1-1'
    //     const side = parts[0] as Direction
    //     const boxIndex = Number(parts[1])
    //     const rectIndex = Number(parts[2])
    //     if (pinballWizard.state.flatDirection !== side) {
    //       return // side is not visible
    //     }

    //     const sideView = pinballWizard.level.sideViews[side]
    //     const { worldRect } = sideView[boxIndex][rectIndex]
    //     const screenRect = pinballWizard.locateWorldRectOnScreen(worldRect)
    //     return screenRect
    //   }

    //   // id is layout key
    //   const guisToCheck = [Gui.create('playing-gui')]
    //   for (const gui of guisToCheck) {
    //     const rect = gui.layoutRectangles[id]
    //     if (!rect) continue
    //     const [x, y, w, h] = rect
    //     const ps = 1// seaBlock.config.flatConfig.pixelScale
    //     return [x * ps, y * ps, w * ps, h * ps]
    //   }
    // },
  }
}
