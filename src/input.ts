/**
 * @file input.ts
 *
 * Input listeners.
 */

import { Graphics } from 'gfx/graphics'
import type { PinballWizard } from 'pinball-wizard'
import type { Vec2 } from 'util/math-util'

export let isTouchDevice = false

// called on startup
export function initListeners(pinballWizard: PinballWizard) {
  const activeTouches: Record<number, Vec2> = {}
  const mousePos: Vec2 = [0, 0]

  // Mouse events
  Graphics.cvs.addEventListener('mousedown', (e) => {
    mousePos[0] = e.clientX - Graphics.cssLeft
    mousePos[1] = e.clientY
    isTouchDevice = false
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
    isTouchDevice = true
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
