/**
 * @file bsp-gfx.ts
 *
 * Graphics region for BSP (Binary Space Partitioning) visuals.
 */

import type { PinballWizard } from 'pinball-wizard'
import { GfxRegion } from '../gfx-region'
import { lerp2, twopi, type Rectangle, type Vec2 } from 'util/math-util'
import { BallSelectionPanel } from 'ball-selection-panel'
import { DISK_COUNT, VALUE_SCALE } from 'simulation/constants'
import type { DiskPattern } from 'gfx/disk-gfx-util'
import { buildPattern, PATTERN_FILLERS } from 'gfx/disk-gfx-util'
import { CROWN_FILL, Graphics } from 'gfx/graphics'
import type { Disk } from 'simulation/disk'

const _lastWidth = -1
const _lastHeight = -1

// const didInitListeners = false

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

// const widest = Math.max(...drawRows.map(({ count }) => count))
// const totalWidth = ((widest - 1) * dx) + 2 * (diskRadius + padding)
// const totalHeight = ((drawRows.length - 1) * dy) + 2 * (diskRadius + padding)

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
// Compute min/max x for disk positions
export const BSP_DISK_X_MIN = Math.min(...diskPositions.map(([x]) => x))
export const BSP_DISK_X_MAX = Math.max(...diskPositions.map(([x]) => x))
const centerDiskPos = lerp2(diskPositions[4], diskPositions[5])

const _drawOffset: Vec2 = [0, 0]
let _drawScale = 1

export class BspGfx extends GfxRegion {
  static {
    GfxRegion.register('bsp-gfx', () => new BspGfx())
  }

  down(pw: PinballWizard, mousePos: Vec2) {
    if (BallSelectionPanel.isShowing) {
      const clickedDisk = getBspHoveredDiskIndex(...mousePos)
      if (clickedDisk !== -1) {
        pw.trySelectDisk(clickedDisk)
        return
      }
    }
  }

  move(pw: PinballWizard, mousePos: Vec2) {
    if (BallSelectionPanel.isShowing) {
      const hoveredDisk = getBspHoveredDiskIndex(...mousePos)
      if (hoveredDisk !== -1) {
        pw.hoveredDiskIndex = hoveredDisk
        Graphics.cvs.style.setProperty('cursor', 'pointer')
      }
    }
  }

  leave(_pw: PinballWizard, _mousePos: Vec2) {
    // do nothing
  }

  up(_pw: PinballWizard, _mousePos: Vec2) {
    // do nothing
  }

  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    // if (cvs.style.display === 'none') {
    //   return // not visible
    // }

    ctx.imageSmoothingEnabled = false

    const [,, w, h] = rect

    const _dpr = window.devicePixelRatio
    // ctx.fillStyle = 'rgb(221,221,221)'
    ctx.clearRect(0, 0, w, h)

    // Compute scale so disks take up a fixed fraction of screen width
    const diskAreaWidth = BSP_DISK_X_MAX - BSP_DISK_X_MIN + 2 * diskRadius
    const targetFraction = 0.8 // disks take up 80% of screen width
    const scale = (w * targetFraction) / diskAreaWidth

    // Center after scaling
    const scaledCenter = centerDiskPos.map(v => v * scale)
    const x0 = w / 2 - scaledCenter[0]
    const y0 = h / 2 - centerDiskPos[1] * scale

    _drawScale = scale
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
        x0 + x * scale, y0 + y * scale,
        scale,
        i === pw.selectedDiskIndex,
        i === pw.hoveredDiskIndex,
        i === pw.followDiskIndex,
      )
    }

    // drawDisk(ctx, pw.activeSim.disks[0],
    //   x0 + _debugMousePos[0] * scale,
    //   y0 + _debugMousePos[1] * scale,
    //   scale)
  }
}

function drawDisk(
  ctx: CanvasRenderingContext2D, disk: Disk,
  cx: number, cy: number,
  scale: number,
  isSelected = false, isHovered = false, isFollowed = false,
) {
  const [x0, y0] = disk.interpolatedPos.map(v => -v / VALUE_SCALE)
  const scaledRadius = diskRadius * scale

  ctx.save()
  ctx.translate(x0 * scale, y0 * scale)
  ctx.beginPath()
  ctx.moveTo(cx - x0 * scale + scaledRadius, cy - y0 * scale)
  ctx.arc(cx - x0 * scale, cy - y0 * scale, scaledRadius, 0, twopi)
  ctx.lineWidth = (isSelected ? 20 : 5) * scale
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = 'black'
  ctx.stroke()
  ctx.fillStyle = getScaledPattern(disk.pattern)
  ctx.fill()

  if (isSelected) {
    ctx.lineWidth = 5 * scale
    ctx.beginPath()
    const crownRad = scaledRadius + 5 * scale
    ctx.moveTo(cx - x0 * scale + crownRad, cy - y0 * scale)
    ctx.arc(cx - x0 * scale, cy - y0 * scale, crownRad, 0, twopi)
    ctx.strokeStyle = CROWN_FILL
    ctx.stroke()
  }

  if (isHovered || isFollowed) {
    ctx.lineWidth = 5 * scale
    ctx.beginPath()
    const haloRad = scaledRadius + 10 * scale
    ctx.moveTo(cx - x0 * scale + haloRad, cy - y0 * scale)
    ctx.arc(cx - x0 * scale, cy - y0 * scale, haloRad, 0, twopi)
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

export function getBspHoveredDiskIndexPe(e: PointerEvent): number {
  return getBspHoveredDiskIndex(e.offsetX, e.offsetY)
}

const _debugMousePos: Vec2 = [0, 0]

export function getBspHoveredDiskIndex(offsetX: number, offsetY: number): number {
  const dpr = window.devicePixelRatio
  const mx = offsetX / _drawScale * dpr - _drawOffset[0] / _drawScale
  const my = offsetY / _drawScale * dpr - _drawOffset[1] / _drawScale

  _debugMousePos[0] = mx
  _debugMousePos[1] = my

  let nearestDiskIndex = -1
  let smallestD2 = diskRadiusSquared
  for (const [diskIndex, [x, y]] of diskPositions.entries()) {
    const dx = x - mx
    const dy = y - my
    const d2 = dx * dx + dy * dy
    if (d2 < smallestD2) {
      nearestDiskIndex = diskIndex
      smallestD2 = d2
    }
  }
  return nearestDiskIndex
}
