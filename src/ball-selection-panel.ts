/**
 * @file ball-selection-panel.ts
 *
 * Ball selection panel.
 */

import type { DiskPattern } from 'gfx/disk-gfx-util'
import { buildPattern, PATTERN_FILLERS } from 'gfx/disk-gfx-util'
import { CROWN_FILL, Graphics } from 'gfx/graphics'
import { ballsBtn } from 'guis/imp/playing-gui'
import type { PinballWizard } from 'pinball-wizard'
import { DISK_COUNT, VALUE_SCALE } from 'simulation/constants'
import type { Disk } from 'simulation/disk'
import type { Vec2 } from 'util/math-util'
import { lerp2, twopi, type Rectangle } from 'util/math-util'

const cvs = ((typeof document === 'undefined')
  ? null
  : document.getElementById('ball-selection-panel-canvas')) as HTMLCanvasElement

if (cvs) {
  cvs.style.setProperty('border-radius', '5px')
  cvs.style.setProperty('border', '1px solid black')
}

const ctx = (cvs ? cvs.getContext('2d') : null) as CanvasRenderingContext2D
// const cvs = document.getElementById('scrollbar-canvas') as HTMLCanvasElement
// const ctx = cvs.getContext('2d') as CanvasRenderingContext2D

const _lastWidth = -1
const _lastHeight = -1

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
const centerDiskPos = lerp2(diskPositions[4], diskPositions[5])

const _drawOffset: Vec2 = [0, 0]

export class BallSelectionPanel {
  static isRepaintQueued = false
  static cvs = cvs
  static ctx = ctx
  static totalWidth = totalWidth
  static totalHeight = totalHeight
  static diskRadius = diskRadius
  static diskPositions = diskPositions

  private static _drawScale = 1
  private static _bounds: Rectangle = [1, 1, 1, 1]

  public static get isShowing() {
    return cvs.style.display !== 'none'
  }

  static show(pw: PinballWizard) {
    cvs.style.setProperty('display', 'block')
    ballsBtn.htmlElem?.classList.add('active')
    Graphics.targetPixelAnim = 1
    pw.onResize()
  }

  static hide(pw: PinballWizard, skipResize = false) {
    cvs.style.setProperty('display', 'none')
    ballsBtn.htmlElem?.classList.remove('active')
    Graphics.targetPixelAnim = 0
    if (!skipResize) {
      pw.onResize()
    }
  }

  static toggle(pw: PinballWizard) {
    if (cvs.style.display === 'none') {
      BallSelectionPanel.show(pw)
    }
    else {
      BallSelectionPanel.hide(pw)
    }
  }

  static initListeners(pw: PinballWizard) {
    if (didInitListeners) {
      throw new Error('BallSelectionPanel.initListeners() called multiple times')
    }
    didInitListeners = true
    cvs.addEventListener('pointerdown', (e) => {
      const i = getBspHoveredDiskIndexPe(e)
      pw.trySelectDisk(i)
      cvs.style.setProperty('cursor', 'default')
    })

    cvs.addEventListener('pointermove', (e) => {
      const i = getBspHoveredDiskIndexPe(e)
      if (i === -1 || pw.hasBranched || i === pw.selectedDiskIndex) {
        cvs.style.setProperty('cursor', 'default')
      }
      else {
        cvs.style.setProperty('cursor', 'pointer')
      }
    })
  }

  static draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    // if (cvs.style.display === 'none') {
    //   return // not visible
    // }

    const [_x, _y, w, h] = rect

    const _dpr = window.devicePixelRatio
    // ctx.fillStyle = 'rgb(221,221,221)'
    ctx.clearRect(0, 0, w, h)

    const x0 = w / 2 - centerDiskPos[0]
    const y0 = h / 2 - centerDiskPos[1]

    _drawOffset[0] = x0
    _drawOffset[1] = y0

    // // debug
    // ctx.strokeStyle = 'red'
    // ctx.lineWidth = 4
    // ctx.strokeRect(0, 0, w, h)

    if (!pw.activeSim) return

    // draw balls
    for (let i = 0; i < DISK_COUNT; i++) {
      const disk = pw.activeSim.disks[i]
      if (!disk) continue

      const [x, y] = diskPositions[i]
      drawDisk(ctx, disk,
        x0 + x, y0 + y,
        i === pw.selectedDiskIndex,
        i === pw.hoveredDiskIndex,
      )
    }
  }
}

export function getBspHoveredDiskIndexPe(e: PointerEvent): number {
  return getBspHoveredDiskIndex(e.offsetX, e.offsetY)
}

export function getBspHoveredDiskIndex(offsetX: number, offsetY: number): number {
  const mx = -_drawOffset[0] + offsetX * window.devicePixelRatio
  const my = -_drawOffset[1] + offsetY * window.devicePixelRatio
  for (const [diskIndex, [x, y]] of diskPositions.entries()) {
    const dx = x - mx
    const dy = y - my
    const d2 = dx * dx + dy * dy
    if (d2 < diskRadiusSquared) {
      return diskIndex
      break
    }
  }
  return -1
}

function drawDisk(
  ctx: CanvasRenderingContext2D, disk: Disk,
  cx: number, cy: number,
  isSelected = false, isHovered = false,
) {
  const [x0, y0] = disk.interpolatedPos.map(v => -v / VALUE_SCALE)

  ctx.save()
  ctx.translate(x0, y0)
  ctx.beginPath()
  ctx.moveTo(cx - x0, cy - y0)
  ctx.arc(cx - x0, cy - y0, diskRadius, 0, twopi)
  ctx.lineWidth = isSelected ? 20 : 5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = 'black'
  ctx.stroke()
  ctx.fillStyle = getScaledPattern(disk.pattern)
  ctx.fill()

  if (isSelected) {
    ctx.lineWidth = 5
    ctx.beginPath()
    const crownRad = diskRadius + 5
    ctx.moveTo(cx - x0 + crownRad, cy - y0)
    ctx.arc(cx - x0, cy - y0, crownRad, 0, twopi)
    ctx.strokeStyle = CROWN_FILL
    ctx.stroke()
  }

  if (isHovered) {
    ctx.lineWidth = 5
    ctx.beginPath()
    const haloRad = diskRadius + 10
    ctx.moveTo(cx - x0 + haloRad, cy - y0)
    ctx.arc(cx - x0, cy - y0, haloRad, 0, twopi)
    ctx.strokeStyle = 'black'
    ctx.stroke()
  }

  ctx.restore()
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
    return buildPattern(pattern, 20 / VALUE_SCALE) // scaled canvas pattern
  }
  return original // string
}
