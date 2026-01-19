/**
 * @file scrollbar.ts
 *
 * Scrollbar with dedicated canvas similar to graphics.ts.
 */

import type { DiskPattern } from 'gfx/disk-gfx'
import { buildPattern, PATTERN_FILLERS } from 'gfx/disk-gfx'
import { Graphics, OBSTACLE_FILL } from 'gfx/graphics'
import type { PinballWizard } from 'pinball-wizard'
import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'
import type { Disk } from 'simulation/disk'
import { twopi, type Rectangle } from 'util/math-util'

const cvs = ((typeof document === 'undefined') ? null : document.getElementById('scrollbar-canvas')) as HTMLCanvasElement
const ctx = (cvs ? cvs.getContext('2d') : null) as CanvasRenderingContext2D
// const cvs = document.getElementById('scrollbar-canvas') as HTMLCanvasElement
// const ctx = cvs.getContext('2d') as CanvasRenderingContext2D

let lastWidth = -1
let lastHeight = -1

let didInitListeners = false
let isDragging = false

export class Scrollbar {
  static isRepaintQueued = false
  static cvs = cvs
  static ctx = ctx

  static get isDragging() { return isDragging }

  static initListeners(pw: PinballWizard) {
    if (didInitListeners) {
      throw new Error('Scrollbar.initListeners() called multiple times')
    }
    didInitListeners = true

    Scrollbar.cvs.addEventListener('pointerdown', (e) => {
      pw.camera.pos = -(e.clientY - Scrollbar._bounds[1]) * window.devicePixelRatio / Scrollbar._drawScale
      isDragging = true
    })
    document.addEventListener('pointermove', (e) => {
      if (isDragging) {
        pw.camera.pos = -(e.clientY - Scrollbar._bounds[1]) * window.devicePixelRatio / Scrollbar._drawScale
      }
    })
    document.addEventListener('pointerup', () => {
      isDragging = false
    })
    document.addEventListener('pointerleave', () => {
      isDragging = false
    })
  }

  // set bounds in px
  private static _bounds: Rectangle = [1, 1, 1, 1]
  static setBounds(bounds: Rectangle, pw: PinballWizard) {
    Scrollbar._bounds = bounds
    const [x, y, w, h] = bounds

    cvs.style.setProperty('position', 'absolute')
    cvs.style.setProperty('left', `${x}px`)
    cvs.style.setProperty('top', `${y}px`)

    if ((w !== lastWidth) || (h !== lastHeight)) {
      cvs.style.setProperty('width', `${w}px`)
      cvs.style.setProperty('height', `${h}px`)
      const dpr = window.devicePixelRatio
      cvs.width = w * dpr
      cvs.height = h * dpr
      Scrollbar.repaint(pw)
    }

    lastWidth = w
    lastHeight = h
  }

  private static _drawScale = 1
  static repaint(pw: PinballWizard) {
    const sim = pw.activeSim
    ctx.fillStyle = 'red'
    ctx.strokeStyle = 'blue'
    ctx.lineWidth = 2

    const w = cvs.width
    const h = cvs.height

    ctx.fillRect(0, 0, w, h)
    ctx.strokeRect(0, 0, w, h)

    const scale = cvs.width / 100 / VALUE_SCALE
    this._drawScale = scale

    ctx.clearRect(0, 0, cvs.width, cvs.height)
    ctx.save()
    ctx.scale(scale, scale)

    if (sim) {
      ctx.fillStyle = OBSTACLE_FILL
      for (const obstacle of sim.obstacles) {
        Graphics.traceObstacle(ctx, obstacle)
        ctx.fill()
      }

      // draw disks
      const selected = pw.selectedDiskIndex
      for (const [diskIndex, disk] of sim.disks.entries()) {
        const isSelected = (diskIndex === selected)
        Scrollbar.drawDisk(disk, isSelected)
      }
      if (selected !== -1) {
        const disk = sim.disks[selected]
        Scrollbar.drawDisk(disk, true)
      }

      Graphics.drawViewRect(ctx, pw.simViewRect)
    }

    ctx.restore()
  }

  // draw mini view of disk in scrollbar
  static drawDisk(disk: Disk, isSelected: boolean) {
    const [cx, cy] = disk.interpolatedPos

    const edgeRad = VALUE_SCALE * 2 * (isSelected ? 5 : 1)
    ctx.strokeStyle = isSelected ? 'green' : 'black'
    ctx.lineWidth = edgeRad
    ctx.fillStyle = getScaledPattern(disk.pattern)
    ctx.imageSmoothingEnabled = false

    ctx.beginPath()
    ctx.arc(cx, cy, DISK_RADIUS * 5, 0, twopi)
    ctx.fill()
    ctx.stroke()
  }
}

// scaled versions of disk-gfx patterns
const scaledFillers: Partial<Record<DiskPattern, CanvasPattern | string>> = {}
function getScaledPattern(pattern: DiskPattern): CanvasPattern | string {
  if (!Object.hasOwn(scaledFillers, pattern)) {
    scaledFillers[pattern] = _buildScaledPattern(pattern)
  }
  return scaledFillers[pattern] as CanvasPattern
}

function _buildScaledPattern(pattern: DiskPattern): CanvasPattern | string {
  const original = PATTERN_FILLERS[pattern]
  if (original instanceof CanvasPattern) {
    return buildPattern(pattern, 6) // scaled canvas pattern
  }
  return original // string
}
