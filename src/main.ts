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
import { setElementLabel } from 'guis/gui-html-elements'

async function main() {
  // Wait for the title iframe to be loaded before continuing
  await new Promise<void>((resolve) => {
    const iframe = document.getElementById('title-iframe') as HTMLIFrameElement
    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      resolve()
    }
    else {
      iframe.addEventListener('load', () => resolve(), { once: true })
    }
  })


  const iframe = document.getElementById('title-iframe') as HTMLIFrameElement
  const inner = iframe.contentDocument as Document
  const startBtn = inner.getElementById('start-button') as HTMLElement

  // const layeredViewport = new LayeredViewport()
  gfxConfig.refreshConfig()

  const pinballWizard = new PinballWizard()

  // pinballWizard.config.refreshConfig()

  // TestSupport // support automated report on tessmero.github.io //
  ;(window as any).TestSupport = getTestSupport(pinballWizard) // eslint-disable-line @typescript-eslint/no-explicit-any

  // window.addEventListener('keydown', (event) => {
  //   pinballWizard.gui.keydown(pinballWizard, event.code)
  // })

  _initListeners(pinballWizard)
  Scrollbar.initListeners(pinballWizard)
  await _initLuts()
  startBtn.innerHTML = 'START'

  for (const guiName of GUI.NAMES) {
    Gui.preload(pinballWizard, guiName)
  }
  pinballWizard.onResize()

  // bind start button in title screen
  startBtn.onclick = async () => {
    await pinballWizard.init()
    pinballWizard.gui = Gui.create('playing-gui')
    pinballWizard.isTitleScreen = false
    pinballWizard.onResize()
    titleScreenElem.classList.add('hidden')
    Scrollbar.cvs.style.setProperty('display', 'block')
  }

  // show title screen
  const titleScreenElem = document.getElementById('title-screen') as HTMLElement
  titleScreenElem.classList.remove('hidden')

  if (isDevMode) {
    await applyDevMode(pinballWizard) // apply overrides
  }

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

async function _initLuts() {
  const isComputing = false
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
    }
  }
}
