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
import { LUT } from 'imp-names'
import type { ShapeName } from 'simulation/shapes'
import { SHAPE_PATHS } from 'simulation/shapes'

async function main() {
  // const layeredViewport = new LayeredViewport()
  gfxConfig.refreshConfig()

  const pinballWizard = new PinballWizard();

  // pinballWizard.config.refreshConfig()

  // TestSupport // support automated report on tessmero.github.io //
  (window as any).TestSupport = getTestSupport(pinballWizard) // eslint-disable-line @typescript-eslint/no-explicit-any

  // window.addEventListener('keydown', (event) => {
  //   pinballWizard.gui.keydown(pinballWizard, event.code)
  // })

  const rawMousePos: Vec2 = [0, 0]
  window.addEventListener('pointermove', (e) => {
    rawMousePos[0] = e.clientX
    rawMousePos[1] = e.clientY
    pinballWizard.move(rawMousePos)
  })

  window.addEventListener('pointerdown', (e) => {
    rawMousePos[0] = e.clientX
    rawMousePos[1] = e.clientY
    pinballWizard.down(rawMousePos)
  })

  window.addEventListener('pointerup', (e) => {
    rawMousePos[0] = e.clientX
    rawMousePos[1] = e.clientY
    pinballWizard.up(rawMousePos)
  })

  // DiskDiskCollisions.computeAll()
  // await DiskDiskCollisions.loadAll()

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

  await pinballWizard.init()

  if (isDevMode) {
    await applyDevMode(pinballWizard) // apply overrides
  }

  // pinballWizard.onResize()

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

    pinballWizard.update(dt)
  }
  animate() // start first loop
}

main()
