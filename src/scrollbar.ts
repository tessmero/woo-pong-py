/**
 * @file scrollbar.ts
 *
 * Scrollbar with dedicated canvas similar to graphics.ts.
 */

import type { DiskPattern } from 'gfx/disk-gfx-util'
import { buildPattern, PATTERN_FILLERS } from 'gfx/disk-gfx-util'
import { Graphics, OBSTACLE_FILL } from 'gfx/graphics'
import { traceObstacle } from 'gfx/obstacle-gfx-util'
import type { PinballWizard } from 'pinball-wizard'
import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'
import type { Disk } from 'simulation/disk'
import { twopi, type Rectangle } from 'util/math-util'

// const cvs = ((typeof document === 'undefined')
//   ? null
//   : document.getElementById('scrollbar-canvas')) as HTMLCanvasElement
// const ctx = (cvs ? cvs.getContext('2d') : null) as CanvasRenderingContext2D
// const cvs = document.getElementById('scrollbar-canvas') as HTMLCanvasElement
// const ctx = cvs.getContext('2d') as CanvasRenderingContext2D

let lastWidth = -1
let lastHeight = -1

let didInitListeners = false
let isDragging = false

export class Scrollbar {
  static isRepaintQueued = false
  // static cvs = cvs
  // static ctx = ctx

  static get isDragging() { return isDragging }

  static show() {
    // cvs.style.setProperty('display', 'block')
  }

  static hide() {
    // cvs.style.setProperty('display', 'none')
  }

  static initListeners(pw: PinballWizard) {
    if (didInitListeners) {
      throw new Error('Scrollbar.initListeners() called multiple times')
    }
    didInitListeners = true

    Graphics.cvs.addEventListener('pointerdown', (e) => {
    })
    document.addEventListener('pointermove', (e) => {
    })
    document.addEventListener('pointerup', () => {
    })
    document.addEventListener('pointerleave', () => {
      isDragging = false
    })
  }

    public static drawScale = 1 // set in scrollbar-gfx.ts

}
