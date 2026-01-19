/**
 * @file main.ts
 *
 * Entry point and main loop.
 */

// @ts-expect-error make vite build include all sources
import.meta.glob('./**/*.ts', { eager: true })

import { gfxConfig } from './configs/imp/gfx-config'
import { PinballWizard } from './pinball-wizard'
import { getTestSupport } from 'test-support'
import { applyDevMode, isDevMode } from 'configs/imp/top-config'
import type { Vec2 } from 'util/math-util'
import { Lut } from 'simulation/luts/lut'
import { GUI, LUT } from 'imp-names'
import type { ShapeName } from 'simulation/shapes'
import { SHAPE_PATHS } from 'simulation/shapes'
import { Gui } from 'guis/gui'
import { Graphics } from 'gfx/graphics'
import { TitleScreen } from 'title-screen'
import { Scrollbar } from 'scrollbar'

async function main() {
  const iframe = document.getElementById('title-iframe') as HTMLIFrameElement

  // Wait for the title iframe to be loaded before continuing
  await new Promise<void>((resolve) => {
    iframe.addEventListener('load', () => resolve())
    iframe.src = 'title-screen.html'
  })

  // bind start button in title screen
  const inner = iframe.contentDocument as Document
  const startBtn = inner.getElementById('start-button') as HTMLElement

  // const layeredViewport = new LayeredViewport()
  gfxConfig.refreshConfig()

  const pinballWizard = new PinballWizard()
  pinballWizard.loadingState = 'B'

  // pinballWizard.config.refreshConfig()

  // TestSupport // support automated report on tessmero.github.io //
  ;(window as any).TestSupport = getTestSupport(pinballWizard) // eslint-disable-line @typescript-eslint/no-explicit-any

  pinballWizard.loadingState = 'C'
  // window.addEventListener('keydown', (event) => {
  //   pinballWizard.gui.keydown(pinballWizard, event.code)
  // })

  // show title screen
  const titleScreenElem = document.getElementById('title-screen') as HTMLElement
  titleScreenElem.classList.remove('hidden')
  pinballWizard.loadingState = 'K'

  _initListeners(pinballWizard)
  pinballWizard.loadingState = 'D'
  Scrollbar.initListeners(pinballWizard)
  pinballWizard.loadingState = 'E'
  await _initLuts(startBtn)
  pinballWizard.loadingState = 'F'
  startBtn.innerHTML = 'START'
  pinballWizard.loadingState = 'G'

  for (const guiName of GUI.NAMES) {
    Gui.preload(pinballWizard, guiName)
  }
  pinballWizard.loadingState = 'H'
  pinballWizard.onResize()
  pinballWizard.loadingState = 'I'

  startBtn.onclick = async () => {
    await pinballWizard.init()
    pinballWizard.gui = Gui.create('playing-gui')
    pinballWizard.isTitleScreen = false
    pinballWizard.onResize()
    titleScreenElem.classList.add('hidden')
    Scrollbar.cvs.style.setProperty('display', 'block')
  }
  pinballWizard.loadingState = 'J'

  if (isDevMode) {
    await applyDevMode(pinballWizard) // apply overrides
  }
  pinballWizard.loadingState = 'L'

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // TestSupport // support automated report on tessmero.github.io
  if (navigator.webdriver) { // if in puppeteer env
    document.querySelector('*')!.addEventListener('mousemove', (event) => {
      // @ts-expect-error TestSupport
      (window as any).mouseXForTestSupport = event.clientX; // eslint-disable-line @typescript-eslint/no-explicit-any
      // @ts-expect-error TestSupport
      (window as any).mouseYForTestSupport = event.clientY // eslint-disable-line @typescript-eslint/no-explicit-any
      // @ts-expect-error TestSupport
      const currentCursor = window.getComputedStyle(event.target).cursor
      if (currentCursor === 'auto') {
        (window as any).cursorForTestSupport = 'default'// eslint-disable-line @typescript-eslint/no-explicit-any
      }
      else {
        (window as any).cursorForTestSupport = currentCursor // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      event.stopPropagation() // prevent repeating for parent elements
    })
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  pinballWizard.loadingState = 'M'

  // main loop
  let lastTime = performance.now()
  function animate() {
    requestAnimationFrame(animate) // queue next loop

    // Calculate delta time since last loop
    const currentTime = performance.now()
    const dt = Math.min(50, currentTime - lastTime)
    lastTime = currentTime

    if (pinballWizard.isTitleScreen) {
      TitleScreen.update(dt)
    }
    else {
      pinballWizard.update(dt)
    }
  }

  pinballWizard.loadingState = null

  animate() // start first loop
}

main()

function _initListeners(pinballWizard: PinballWizard) {
  const rawMousePos: Vec2 = [0, 0]
  Graphics.cvs.addEventListener('pointermove', (e) => {
    rawMousePos[0] = e.offsetX
    rawMousePos[1] = e.offsetY
    pinballWizard.move(rawMousePos)
  })

  Graphics.cvs.addEventListener('pointerdown', (e) => {
    rawMousePos[0] = e.offsetX
    rawMousePos[1] = e.offsetY
    pinballWizard.down(rawMousePos)
  })

  Graphics.cvs.addEventListener('pointerup', (e) => {
    rawMousePos[0] = e.offsetX
    rawMousePos[1] = e.offsetY
    pinballWizard.up(rawMousePos)
  })

  Graphics.cvs.addEventListener('pointerleave', (e) => {
    rawMousePos[0] = e.offsetX
    rawMousePos[1] = e.offsetY
    pinballWizard.up(rawMousePos)
  })

  Graphics.cvs.addEventListener('wheel', (e) => {
    pinballWizard.camera.scroll(e.deltaY)
  })
}

async function _initLuts(loadingLabel: HTMLElement) {
  const isComputing = false

  const totalTasks = Object.keys(SHAPE_PATHS).length + (LUT.NAMES.length - 1)
  let tasksFinished = 0

  async function finishTask() {
    // // simulate lag
    // await new Promise(resolve => setTimeout(resolve, 100))

    tasksFinished++
    const pctFinished = Math.floor(100 * tasksFinished / totalTasks)
    if (loadingLabel) loadingLabel.innerHTML = `LOADING (${pctFinished}%)`
  }

  for (const lutName of LUT.NAMES) {
    if (lutName === 'obstacle-lut') {
      for (const shapeName of Object.keys(SHAPE_PATHS)) {
        const lut = Lut.create(lutName, shapeName as ShapeName)
        if (isComputing) {
          lut.computeAll()
        }
        else {
          await lut.loadAll()
        }

        // simulate lag
        // await new Promise(resolve => setTimeout(resolve, 100))
        await finishTask()
      }
    }
    else {
      // Lut.create(lutName).computeAll()
      const lut = Lut.create(lutName)
      if (isComputing) {
        lut.computeAll()
      }
      else {
        await lut.loadAll()
      }

      // simulate lag
      // await new Promise(resolve => setTimeout(resolve, 100))
      await finishTask()
    }
  }
}
