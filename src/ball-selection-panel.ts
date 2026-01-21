/**
 * @file ball-selection-panel.ts
 *
 * Ball selection panel.
 */

import type { DiskPattern } from 'gfx/disk-gfx'
import { buildPattern, PATTERN_FILLERS } from 'gfx/disk-gfx'
import type { PinballWizard } from 'pinball-wizard'
import { DISK_COUNT, VALUE_SCALE } from 'simulation/constants'
import type { Disk } from 'simulation/disk'
import type { Vec2 } from 'util/math-util'
import { twopi, type Rectangle } from 'util/math-util'

const cvs = ((typeof document === 'undefined')
  ? null
  : document.getElementById('ball-selection-panel-canvas')) as HTMLCanvasElement
const ctx = (cvs ? cvs.getContext('2d') : null) as CanvasRenderingContext2D
// const cvs = document.getElementById('scrollbar-canvas') as HTMLCanvasElement
// const ctx = cvs.getContext('2d') as CanvasRenderingContext2D

let lastWidth = -1
let lastHeight = -1

let didInitListeners = false

// arrangement of 10 balls on 3 rows
const drawRows = [
  {
    count: 3,
    offset: 0.5,
  },
  {
    count: 4,
    offset: 0,
  },
  {
    count: 3,
    offset: 0.5,
  },
]

const dx = 90
const dy = 80
const diskRadius = 40
const diskRadiusSquared = Math.pow(diskRadius, 2)
const padding = 15

const widest = Math.max(...drawRows.map(({ count }) => count))
const totalWidth = ((widest - 1) * dx) + 2 * (diskRadius + padding)
const totalHeight = ((drawRows.length - 1) * dy) + 2 * (diskRadius + padding)

// compute disk positions on canvas
const diskPositions: Array<Vec2> = []
let diskIndex = 0
let rowIndex = 0
for (const row of drawRows) {
  for (let i = 0; i < row.count; i++) {
    if (diskIndex >= DISK_COUNT) continue
    diskPositions.push([
      padding + diskRadius + (row.offset + i) * dx,
      padding + diskRadius + rowIndex * dy,
    ])
    diskIndex++
  }
  rowIndex++
}

export class BallSelectionPanel {
  static isRepaintQueued = false
  static cvs = cvs
  static ctx = ctx

  private static _drawScale = 1
  private static _bounds: Rectangle = [1, 1, 1, 1]

  static show() {
    cvs.style.setProperty('display', 'block')
  }

  static hide() {
    cvs.style.setProperty('display', 'none')
  }

  static initListeners(pw: PinballWizard) {
    if (didInitListeners) {
      throw new Error('BallSelectionPanel.initListeners() called multiple times')
    }
    didInitListeners = true
    cvs.addEventListener('pointerdown', (e) => {
      const mx = e.offsetX * window.devicePixelRatio
      const my = e.offsetY * window.devicePixelRatio
      for (const [diskIndex, [x, y]] of diskPositions.entries()) {
        const dx = x - mx
        const dy = y - my
        const d2 = dx * dx + dy * dy
        if (d2 < diskRadiusSquared) {
          pw.selectedDiskIndex = diskIndex
          break
        }
      }
      BallSelectionPanel.isRepaintQueued = true
    })
  }

  static repaint(pw: PinballWizard) {
    console.log('repaint bsp')
    const w = cvs.width
    const h = cvs.height

    ctx.fillStyle = 'red'
    ctx.strokeStyle = 'blue'
    ctx.lineWidth = 5
    ctx.fillRect(0, 0, w, h)
    ctx.strokeRect(0, 0, w, h)

    if (!pw.activeSim) return

    // draw balls
    for (let i = 0; i < DISK_COUNT; i++) {
      const disk = pw.activeSim.disks[i]
      if (!disk) continue
      const isSelected = (i === pw.selectedDiskIndex)

      drawDisk(ctx, disk, isSelected, false,
        ...diskPositions[i],
      )
    }
  }

  static setBounds(bounds: Rectangle, pw: PinballWizard) {
    BallSelectionPanel._bounds = bounds
    let [x, y, w, h] = bounds

    const shrinkW = w - (totalWidth / window.devicePixelRatio)
    const shrinkH = h - (totalHeight / window.devicePixelRatio)

    x += shrinkW / 2
    w -= shrinkW
    y += shrinkH / 2
    h -= shrinkH

    cvs.style.setProperty('position', 'absolute')
    cvs.style.setProperty('left', `${x}px`)
    cvs.style.setProperty('top', `${y}px`)

    if ((w !== lastWidth) || (h !== lastHeight)) {
      cvs.style.setProperty('width', `${w}px`)
      cvs.style.setProperty('height', `${h}px`)
      const dpr = window.devicePixelRatio
      cvs.width = w * dpr
      cvs.height = h * dpr
      BallSelectionPanel.repaint(pw)
    }

    lastWidth = w
    lastHeight = h
  }
}

function drawDisk(
  ctx: CanvasRenderingContext2D, disk: Disk,
  isSelected = false, _isWinner = false,
  cx: number, cy: number,
) {
  const edgeRad = (isSelected ? 5 : 1)

  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, diskRadius, 0, twopi)
  ctx.lineWidth = edgeRad
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = isSelected ? 'green' : 'black'
  ctx.stroke()
  ctx.fillStyle = getScaledPattern(disk.pattern)
  ctx.imageSmoothingEnabled = false
  ctx.fill()
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
    return buildPattern(pattern, 10 / VALUE_SCALE) // scaled canvas pattern
  }
  return original // string
}
