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
import { Lut } from 'simulation/luts/lut'
import { GUI, LUT } from 'imp-names'
import type { ShapeName } from 'simulation/shapes'
import { SHAPE_PATHS } from 'simulation/shapes'
import { Gui } from 'guis/gui'
import { Graphics } from 'gfx/graphics'
import { TitleScreen } from 'title-screen'
import { BASE_FONT_SIZE } from 'gfx/canvas-text-util'
import { shortVibrate } from 'util/vibrate'
import { loadAllSounds } from 'audio/sound-asset-loader'
import { loadAllButtonImages } from 'gfx/btn-gfx-util'
import { initListeners } from 'input'

// Utility to ensure Rubik font is loaded before drawing
async function ensureRubikFontLoaded() {
  const fontStr = `bold ${BASE_FONT_SIZE}px Rubik`
  if (document && document.fonts) {
    try {
      await document.fonts.load(fontStr)
      await document.fonts.ready
      // Optionally log success
      // console.log('[RubikFont] loaded', fontStr);
    }
    catch (e) {
      // eslint-disable-next-line no-console
      console.error('[RubikFont] Error loading font:', e)
    }
  }
}

let isTitleAnimPlaying = true
let lastTime = performance.now()

function titleAnimLoop() {
  if (!isTitleAnimPlaying) return
  requestAnimationFrame(titleAnimLoop) // queue next loop

  // Calculate delta time since last loop
  const currentTime = performance.now()
  const dt = Math.min(50, currentTime - lastTime)
  lastTime = currentTime
  TitleScreen.update(dt) // update and repaint title screen background
}

function titleAnimResize() {
  Graphics.onResize()
}

async function main() {
  await ensureRubikFontLoaded()

  titleAnimResize()
  window.addEventListener('resize', titleAnimResize)
  requestAnimationFrame(titleAnimLoop) // start background animation loop

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

  await loadAllButtonImages()

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

  initListeners(pinballWizard)
  pinballWizard.loadingState = 'D'
  // Scrollbar.initListeners(pinballWizard)
  // ballSelectionPanel.initListeners(pinballWizard)
  pinballWizard.loadingState = 'E'
  await _initAssets(startBtn)
  pinballWizard.loadingState = 'F'
  startBtn.innerHTML = 'START'
  pinballWizard.loadingState = 'G'

  for (const guiName of GUI.NAMES) {
    Gui.preload(pinballWizard, guiName)
  }
  pinballWizard.loadingState = 'H'
  // pinballWizard.onResize()
  pinballWizard.loadingState = 'I'

  startBtn.onclick = async () => {
    shortVibrate()

    // document.documentElement.requestFullscreen()
    await pinballWizard.init()
    pinballWizard.gui = Gui.create('playing-gui')
    pinballWizard.isTitleScreen = false
    // Graphics.isTitleScreen = false
    pinballWizard.onResize()
    titleScreenElem.classList.add('hidden')
    // Scrollbar.show()
    // ballSelectionPanel.show()

    isTitleAnimPlaying = false // break title screen loop
    document.removeEventListener('resize', titleAnimResize)
    mainLoop() // start first loop
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
  function mainLoop() {
    requestAnimationFrame(mainLoop) // queue next loop

    // Calculate delta time since last loop
    const currentTime = performance.now()
    const dt = Math.min(50, currentTime - lastTime)
    lastTime = currentTime

    pinballWizard.update(dt)
  }

  pinballWizard.loadingState = null
}

main()

async function _initAssets(loadingLabel: HTMLElement) {
  const isComputing = false
  const t0 = performance.now()

  const totalTasks = Object.keys(SHAPE_PATHS).length + (LUT.NAMES.length - 1)
  let tasksFinished = 0

  function finishTask() {
    tasksFinished++
    const pctFinished = Math.floor(100 * tasksFinished / totalTasks)
    if (loadingLabel) loadingLabel.innerHTML = `LOADING (${pctFinished}%)`
  }

  await loadAllSounds()
  finishTask()

  // Collect all LUT instances
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const luts: Array<Lut<any>> = []
  for (const lutName of LUT.NAMES) {
    if (lutName === 'obstacle-lut') {
      for (const shapeName of Object.keys(SHAPE_PATHS)) {
        luts.push(Lut.create(lutName, shapeName as ShapeName))
      }
    }
    else {
      luts.push(Lut.create(lutName))
    }
  }

  if (isComputing) {
    for (const lut of luts) {
      lut.computeAll()
      finishTask()
    }
  }
  else {
    // Fetch all blobs in parallel; decode happens as each resolves
    await Promise.all(luts.map(lut =>
      lut.loadAll().then(() => finishTask()),
    ))
  }

  // eslint-disable-next-line no-console
  console.log(`assets loaded in ${(performance.now() - t0).toFixed(0)}ms`)
}
