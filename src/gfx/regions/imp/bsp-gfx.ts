/**
 * @file bsp-gfx.ts
 *
 * Graphics region for BSP (Binary Space Partitioning) visuals.
 */

import type { InputId, PinballWizard } from 'pinball-wizard'
import { lerp2, shuffle, twopi, type Rectangle, type Vec2 } from 'util/math-util'
import { ballSelectionPanel } from 'overlay-panels/ball-selection-panel'
import { DISK_COUNT, VALUE_SCALE } from 'simulation/constants'
import type { CanvasName } from 'gfx/graphics'
import { CROWN_FILL, Graphics } from 'gfx/graphics'
import type { Disk } from 'simulation/disk'
import { GfxRegion } from '../gfx-region'
import type { PatternName } from 'imp-names'
import { Pattern } from 'gfx/patterns/pattern'
import { buildFillStyle } from 'gfx/patterns/pattern-util'

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

const diskStaggerOrder = Array.from({ length: DISK_COUNT }, (_, i) => i)
shuffle(diskStaggerOrder)

// Animation properties for disks (similar to animated letters)
type AnimatedDisk = {
  phase: number
  freq: number
  scaleAmp: number
  driftPx: number
}
const diskAnimations: Array<AnimatedDisk> = []
for (let i = 0; i < DISK_COUNT; i++) {
  const seed = i + 1
  diskAnimations.push({
    phase: seed * 1.618,
    freq: 0.7 + (seed % 7) * 0.08,
    scaleAmp: 0.015 + (seed % 5) * 0.003,
    driftPx: 0.4 + (seed % 6) * 0.2,
  })
}

const _drawOffset: Vec2 = [0, 0]
let _drawScale = 1

export class BspGfx extends GfxRegion {
  static {
    GfxRegion.register('bsp-gfx', () => new BspGfx())
  }

  override targetCanvas: CanvasName = 'bsp'
  override shouldDraw() {
    return ballSelectionPanel.isShowing
  }

  _entranceStartTime = 0
  startEntrance() {
    this._entranceStartTime = performance.now()
  }

  _exitStartTime = 0
  startExit() {
    this._exitStartTime = performance.now()
  }

  down(pw: PinballWizard, mousePos: Vec2) {
    if (pw.hasFinished) return false
    if (ballSelectionPanel.isShowing) {
      const clickedDisk = getBspHoveredDiskIndex(...mousePos)
      if (clickedDisk !== -1) {
        pw.trySelectDisk(clickedDisk)
        return true
      }
    }
    return false
  }

  move(pw: PinballWizard, mousePos: Vec2, inputId: InputId) {
    if (pw.hasFinished) return
    if (ballSelectionPanel.isShowing) {
      const hoveredDisk = inputId === 'mouse' ? getBspHoveredDiskIndex(...mousePos) : -1

      pw.hoveredDiskIndex = hoveredDisk
      if (hoveredDisk !== -1) {
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
    ctx.imageSmoothingEnabled = false

    const [,, w, h] = rect

    const _dpr = window.devicePixelRatio
    // ctx.fillStyle = 'rgb(221,221,221)'
    ctx.clearRect(0, 0, w, h)

    if (pw.hasFinished) return

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

    const t = performance.now() * 1e-3

    // draw balls
    for (let i = 0; i < DISK_COUNT; i++) {
      const disk = pw.activeSim.disks[i]
      if (!disk) continue

      const [x, y] = diskPositions[i]

      const diskStagger = diskStaggerOrder[i] / DISK_COUNT

      let diskAnim = Graphics.bspAnim * 2 + diskStagger - 0.5
      if (diskAnim <= 0) {
        continue
      }
      if (diskAnim > 1) {
        diskAnim = 1
      }

      const anim = diskAnimations[i]
      const wobble = t * anim.freq + anim.phase
      const driftX = 1 * Math.sin(wobble) * anim.driftPx
      const driftY = 1 * Math.cos(wobble * 1.13) * anim.driftPx * 0.8
      const scaleAdjust = 1 + 1 * Math.sin(wobble * 1.21) * anim.scaleAmp

      drawDisk(ctx, disk,
        x0 + (x + driftX) * scale, y0 + (y + driftY) * scale,
        scale * diskAnim * scaleAdjust,
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
  const [x0, y0] = disk.displayPos.map(v => -v / VALUE_SCALE)
  const scaledRadius = diskRadius * scale

  ctx.imageSmoothingEnabled = true

  ctx.save()
  ctx.translate(x0 * scale, y0 * scale)
  ctx.beginPath()
  ctx.moveTo(cx - x0 * scale + scaledRadius, cy - y0 * scale)
  ctx.arc(cx - x0 * scale, cy - y0 * scale, scaledRadius, 0, twopi)
  // ctx.lineWidth = (isSelected ? 20 : 5) * scale
  ctx.lineWidth = 5 * scale
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = 'black'
  if (isSelected) {
    ctx.strokeStyle = CROWN_FILL
  }
  else if (isFollowed) {
    ctx.strokeStyle = 'red'
  }
  ctx.stroke()
  ctx.fillStyle = getScaledPattern(disk.pattern)
  ctx.fill()

  // if (isSelected) {
  //   ctx.lineWidth = 5 * scale
  //   ctx.beginPath()
  //   const crownRad = scaledRadius + 5 * scale
  //   ctx.moveTo(cx - x0 * scale + crownRad, cy - y0 * scale)
  //   ctx.arc(cx - x0 * scale, cy - y0 * scale, crownRad, 0, twopi)
  //   ctx.strokeStyle = CROWN_FILL
  //   ctx.stroke()
  // }

  //  else if (isFollowed) {
  //   ctx.lineWidth = 5 * scale
  //   ctx.beginPath()
  //   const crownRad = scaledRadius + 5 * scale
  //   ctx.moveTo(cx - x0 * scale + crownRad, cy - y0 * scale)
  //   ctx.arc(cx - x0 * scale, cy - y0 * scale, crownRad, 0, twopi)
  //   ctx.strokeStyle = 'red'
  //   ctx.stroke()
  // }

  if (isHovered) {
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
const scaledFillers: Partial<Record<PatternName, CanvasPattern | string>> = {}
function getScaledPattern(pattern: PatternName): CanvasPattern | string {
  if (!Object.hasOwn(scaledFillers, pattern)) {
    scaledFillers[pattern] = _buildScaledPattern(pattern)
  }
  return scaledFillers[pattern] as CanvasPattern
}

function _buildScaledPattern(pattern: PatternName): CanvasPattern | string {
  const original = Pattern.getFillStyle(pattern)
  if (original instanceof CanvasPattern) {
    return buildFillStyle(pattern, Pattern.getCanvas(pattern), 20 / VALUE_SCALE) // scaled canvas pattern
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
