/**
 * @file scrollbar.ts
 *
 * Scrollbar with dedicated canvas similar to graphics.ts.
 */

import type { DiskPattern } from 'gfx/disk-gfx'
import { buildPattern, PATTERN_FILLERS } from 'gfx/disk-gfx'
import { Graphics } from 'gfx/graphics'
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

export class Scrollbar {
  static isRepaintQueued = false
  static cvs = cvs
  static ctx = ctx

  // set bounds in px
  static setBounds(bounds: Rectangle, pw: PinballWizard) {
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

    ctx.clearRect(0, 0, cvs.width, cvs.height)
    ctx.save()
    ctx.scale(scale, scale)

    if (sim) {
      for (const obstacle of sim.obstacles) {
        Graphics.drawObstacle(ctx, obstacle)
      }
      for (const disk of sim.disks) {
        Scrollbar.drawDisk(disk)
      }
    }

    ctx.restore()
  }

  // draw mini view of disk in scrollbar
  static drawDisk(disk: Disk) {
    const [cx, cy] = disk.interpolatedPos

    const isSelected = false

    const edgeRad = VALUE_SCALE * 0.5 * (isSelected ? 5 : 1)
    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, DISK_RADIUS * 2, 0, twopi)
    ctx.lineWidth = edgeRad
    ctx.stroke()
    ctx.fillStyle = getScaledPattern(disk.pattern)
    ctx.imageSmoothingEnabled = false
    ctx.fill()
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
  if( original instanceof CanvasPattern ){
    return buildPattern(pattern, 3) // scaled canvas pattern
  }
  return original // string
}
