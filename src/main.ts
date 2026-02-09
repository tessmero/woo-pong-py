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
import { BASE_FONT_SIZE } from 'gfx/canvas-text-util'
import { shortVibrate } from 'util/vibrate'
import { loadAllSounds } from 'audio/sound-asset-loader'
import { loadAllButtonImages } from 'gfx/btn-gfx-util'

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

  _initListeners(pinballWizard)
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

function _initListeners(pinballWizard: PinballWizard) {
  const activeTouches: Record<number, Vec2> = {}
  const mousePos: Vec2 = [0, 0]

  // Mouse events
  Graphics.cvs.addEventListener('mousedown', (e) => {
    mousePos[0] = e.clientX - Graphics.cssLeft
    mousePos[1] = e.clientY
    pinballWizard.down(mousePos, 'mouse')
  })
  document.addEventListener('mousemove', (e) => {
    mousePos[0] = e.clientX - Graphics.cssLeft
    mousePos[1] = e.clientY
    Graphics.cvs.style.setProperty('cursor', 'default')
    pinballWizard.move(mousePos, 'mouse')
  })
  document.addEventListener('mouseup', (e) => {
    mousePos[0] = e.clientX - Graphics.cssLeft
    mousePos[1] = e.clientY
    pinballWizard.up(mousePos, 'mouse')
  })
  document.addEventListener('mouseleave', (_e) => {
    pinballWizard.up(mousePos, 'mouse')
  })

  // Touch events
  Graphics.cvs.addEventListener('touchstart', (e) => {
    for (const touch of Array.from(e.changedTouches)) {
      const pos: Vec2 = [touch.clientX - Graphics.cssLeft, touch.clientY]
      activeTouches[touch.identifier] = pos
      pinballWizard.down(pos, touch.identifier)
    }
    e.preventDefault()
  }, { passive: false })

  Graphics.cvs.addEventListener('touchmove', (e) => {
    for (const touch of Array.from(e.changedTouches)) {
      const pos: Vec2 = [touch.clientX - Graphics.cssLeft, touch.clientY]
      activeTouches[touch.identifier] = pos
      pinballWizard.move(pos, touch.identifier)
    }
    e.preventDefault()
  }, { passive: false })

  Graphics.cvs.addEventListener('touchend', (e) => {
    for (const touch of Array.from(e.changedTouches)) {
      const pos = activeTouches[touch.identifier] || [0, 0]
      pinballWizard.up(pos, touch.identifier)
      delete activeTouches[touch.identifier]
    }
    e.preventDefault()
  }, { passive: false })

  Graphics.cvs.addEventListener('touchcancel', (e) => {
    for (const touch of Array.from(e.changedTouches)) {
      const pos = activeTouches[touch.identifier] || [0, 0]
      pinballWizard.up(pos, touch.identifier)
      delete activeTouches[touch.identifier]
    }
    e.preventDefault()
  }, { passive: false })

  Graphics.cvs.addEventListener('wheel', (e) => {
    pinballWizard.camera.scroll(e.deltaY)
  })
}

async function _initAssets(loadingLabel: HTMLElement) {
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

  await loadAllSounds()
  await finishTask()

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
