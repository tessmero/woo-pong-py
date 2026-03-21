/**
 * @file main.ts
 *
 * Entry point and main loop.
 */

// @ts-expect-error make vite build include all sources
import.meta.glob('./**/*.ts', { eager: true })

import { gfxConfig } from './configs/imp/gfx-config'
import { PinballWizard } from './pinball-wizard'
import { getTestSupport, initCursorStyleDetector } from 'test-support'
import { applyDevMode, isDevMode } from 'configs/imp/top-config'
import { Lut } from 'simulation/luts/lut'
import { LUT } from 'imp-names'
import type { ShapeName } from 'simulation/shapes'
import { SHAPE_PATHS } from 'simulation/shapes'
import { Graphics } from 'gfx/graphics'
import {
  onTitleScreenResize,
  setTitleCoverBackground,
  setTitleCoverLetters,
  setTitleCoverForeground,
  setTitleScreenStartButton,
  TitleScreen,
  advanceTitlePage,
  setPageSourceDimensions,
  initTitleScreenFlipCanvas,
} from 'title-screen/title-screen'
import { BASE_FONT_SIZE } from 'gfx/canvas-text-util'
import { shortVibrate } from 'util/vibrate'
import { loadAllSounds } from 'audio/sound-asset-loader'
import { loadAllButtonImages } from 'gfx/icons-gfx-util'
import { initListeners } from 'input'

type CoverLetterManifestEntry = {
  index: number
  file: string
  x: number
  y: number
  width: number
  height: number
}

type CoverLetterManifest = {
  width: number
  height: number
  letters: Array<CoverLetterManifestEntry>
}

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

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

async function loadTitleCoverImages() {
  const response = await fetch('cover-images/cover-letters-manifest.json', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Failed to fetch cover letter manifest: ${response.status}`)
  }

  const manifest = await response.json() as CoverLetterManifest
  const sorted = [...manifest.letters].sort((a, b) => a.index - b.index)
  const letters = await Promise.all(sorted.map(async letter => ({
    img: await loadImage(`cover-images/${letter.file}`),
    x: letter.x,
    y: letter.y,
    width: letter.width,
    height: letter.height,
  })))

  setTitleCoverLetters(letters, manifest.width, manifest.height)
  setPageSourceDimensions(manifest.width, manifest.height)

  const [foreground, background] = await Promise.all([
    loadImage('cover-images/cover-sphere-part-a.png'),
    loadImage('cover-images/cover-background-combined.png'),
  ])

  setTitleCoverForeground({ img: foreground })
  setTitleCoverBackground(background)
}

let isTitleAnimPlaying = true
let lastTime = performance.now()
const STARTUP_FADE_MS = 350

function waitForNextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()))
}

async function waitForOpacityTransition(element: HTMLElement): Promise<void> {
  await new Promise<void>((resolve) => {
    let isDone = false

    const finish = () => {
      if (isDone) return
      isDone = true
      element.removeEventListener('transitionend', onTransitionEnd)
      window.clearTimeout(timeoutId)
      resolve()
    }

    const onTransitionEnd = (event: Event) => {
      if (!(event instanceof TransitionEvent)) return
      if (event.target !== element || event.propertyName !== 'opacity') return
      finish()
    }

    const timeoutId = window.setTimeout(finish, STARTUP_FADE_MS + 100)
    element.addEventListener('transitionend', onTransitionEnd)
  })
}

async function revealTitleScreen(loadingScreen: HTMLElement, titleScreenElem: HTMLElement) {
  titleScreenElem.classList.remove('startup-gone')
  await waitForNextFrame()

  loadingScreen.classList.add('startup-transparent')
  await waitForOpacityTransition(loadingScreen)
  loadingScreen.classList.add('hidden')

  titleScreenElem.classList.remove('startup-transparent')
  await waitForOpacityTransition(titleScreenElem)
}

function titleAnimLoop() {
  if (!isTitleAnimPlaying) return
  requestAnimationFrame(titleAnimLoop) // queue next loop

  // Calculate delta time since last loop
  const currentTime = performance.now()
  const dt = Math.min(50, currentTime - lastTime)
  lastTime = currentTime
  TitleScreen.update(dt) // update and repaint title screen background

  // // debug
  // const ctx = getTitleScreenCanvas().ctx
  // ctx.fillStyle = 'red'
  // ctx.fillRect(100, 100, 100, 100)
}

async function main() {
  await ensureRubikFontLoaded()

  Graphics.onResize()
  window.addEventListener('resize', onTitleScreenResize)

  const iframe = document.getElementById('title-iframe') as HTMLIFrameElement
  const loadingScreen = document.getElementById('startup-loading-screen') as HTMLElement
  const loadingLabel = document.getElementById('startup-loading-label') as HTMLElement
  const titleScreenElem = document.getElementById('title-screen') as HTMLElement

  // Wait for the title iframe to be loaded before continuing
  await new Promise<void>((resolve) => {
    iframe.addEventListener('load', () => resolve())
    iframe.src = 'title-screen.html'
  })

  // start background animation loop
  requestAnimationFrame(titleAnimLoop)

  // bind start button in title screen
  const inner = iframe.contentDocument as Document
  const startBtn = inner.getElementById('start-button') as HTMLElement

  setTitleScreenStartButton(startBtn)
  onTitleScreenResize()

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
  pinballWizard.loadingState = 'K'

  initTitleScreenFlipCanvas()
  initListeners(pinballWizard)
  pinballWizard.loadingState = 'D'
  pinballWizard.loadingState = 'E'
  await _initAssets(loadingLabel)
  // TitleScreen.startHilbert()

  TitleScreen.update(0)
  onTitleScreenResize()
  await waitForNextFrame()
  await waitForNextFrame()

  for (const elem of inner.getElementsByClassName('toHide')) {
    elem.setAttribute('style', 'opacity:0')
  }
  pinballWizard.loadingState = 'F'
  startBtn.innerHTML = 'START'
  await revealTitleScreen(loadingScreen, titleScreenElem)
  pinballWizard.gameState = 'title-screen'
  pinballWizard.loadingState = 'G'

  pinballWizard.loadingState = 'H'
  // pinballWizard.onResize()
  pinballWizard.loadingState = 'I'

  startBtn.onclick = async () => {
    startBtn.innerText = 'READY'
    pinballWizard.gameState = 'second-title-screen'
    shortVibrate(pinballWizard)

    // Check if we should advance to next page or start the game
    const shouldStartGame = advanceTitlePage()
    if (!shouldStartGame) {
      // Page advanced, wait for next click
      if (isDevMode) {
        setTimeout(async () => startBtn.click(), 100)
      }
      return
    }

    // document.documentElement.requestFullscreen()
    await pinballWizard.init()
    pinballWizard.gameState = 'playing'
    pinballWizard.onResize()
    titleScreenElem.classList.add('hidden')

    isTitleAnimPlaying = false // break title screen loop
    document.removeEventListener('resize', onTitleScreenResize)
    mainLoop() // start first loop
  }
  if (isDevMode) {
    setTimeout(async () => startBtn.click(), 100)
  }
  pinballWizard.loadingState = 'J'

  if (isDevMode) {
    await applyDevMode(pinballWizard) // apply overrides
  }
  pinballWizard.loadingState = 'L'

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // TestSupport // support automated report on tessmero.github.io
  initCursorStyleDetector()
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

  const totalTasks = 3 + Object.keys(SHAPE_PATHS).length + (LUT.NAMES.length - 1)
  let tasksFinished = 0

  function finishTask() {
    tasksFinished++
    const pctFinished = Math.floor(100 * tasksFinished / totalTasks)
    if (loadingLabel) loadingLabel.innerHTML = `LOADING (${pctFinished}%)`
  }

  await loadTitleCoverImages()
  finishTask()

  await loadAllButtonImages()
  finishTask()

  await loadAllSounds()
  finishTask()

  // Collect all LUT instances
  const luts: Array<Lut> = []
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
  console.log(`${tasksFinished} (expected ${totalTasks}) assets loaded in ${(performance.now() - t0).toFixed(0)}ms`)
}
