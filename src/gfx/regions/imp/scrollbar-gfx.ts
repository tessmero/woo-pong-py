/**
 * @file scrollbar-gfx.ts
 *
 * Graphics region for scrollbars.
 */

import { twopi, type Rectangle, type Vec2 } from 'util/math-util'
import { traceObstacle } from 'gfx/obstacle-gfx-util'
import type { InputId, PinballWizard } from 'pinball-wizard'
import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'
import { CROWN_FILL, OBSTACLE_FILL } from 'gfx/graphics'
import { Scrollbar } from 'scrollbar'
import type { Disk } from 'simulation/disk'
import type { Obstacle } from 'simulation/obstacle'
import { fillFrameBetweenRectAndRounded, strokeInnerRoundedRect } from 'gfx/canvas-rounded-rect-util'
import type { Barrier } from 'simulation/barrier'
import { ballSelectionPanel } from 'overlay-panels/ball-selection-panel'
import type { PatternName } from 'imp-names'
import { buildFillStyle } from 'gfx/patterns/pattern-util'
import { GfxRegion } from '../gfx-region'
import { Pattern } from 'gfx/patterns/pattern'

const buffer = (typeof document === 'undefined')
  ? null
  : document.createElement('canvas') as HTMLCanvasElement

const _dash = [1, 1] // dummy used for setLineDash

export class ScrollbarGfx extends GfxRegion {
  static {
    GfxRegion.register('scrollbar-gfx', () => new ScrollbarGfx())
  }

  // private isDragging = false
  private _drawRect: Rectangle = [1, 1, 1, 1]
  public isRepaintQueued = false

  private _computeCamPos(pw: PinballWizard, mousePos: Vec2): number {
    return -(mousePos[1] * window.devicePixelRatio - this._drawRect[1]) / Scrollbar.drawScale
  }

  down(pw: PinballWizard, mousePos: Vec2, inputId: InputId) {
    pw.camera.pos = this._computeCamPos(pw, mousePos)
    if (Scrollbar.draggingId === null) {
      Scrollbar.draggingId = inputId
      // Scrollbar.isLocked = !Scrollbar.isLocked
    }
    return false
  }

  move(pw: PinballWizard, mousePos: Vec2, inputId: InputId) {
    if (ballSelectionPanel.isShowing) {
      Scrollbar.draggingId = null
      return
    }

    if (Scrollbar.draggingId === inputId) {
      pw.camera.pos = this._computeCamPos(pw, mousePos)
    }
  }

  leave(pw: PinballWizard, mousePos: Vec2, inputId: InputId) {
    if (ballSelectionPanel.isShowing) {
      Scrollbar.draggingId = null
      return
    }

    if (Scrollbar.draggingId === inputId) {
      // user started drag in scrollbar, now moving in another region while scrollbar is held
      pw.camera.pos = this._computeCamPos(pw, mousePos)
    }
  }

  up(_pw: PinballWizard, _mousePos: Vec2, inputId: InputId) {
    if (inputId === Scrollbar.draggingId) {
      Scrollbar.draggingId = null
    }
  }

  // clear rectangle in graphics buffer
  hideObstacle(obstacle: Obstacle) {
    if (!this._obstacleBuffer) return
    const bctx = this._obstacleBuffer.getContext('2d')
    if (!bctx) return
    const [x, y, w, h] = obstacle.boundingRect
    const shrink = 0.5 * DISK_RADIUS
    bctx.clearRect(x + shrink, y + shrink, w - 2 * shrink, h - 2 * shrink)
  }

  // Buffer for obstacles rendering
  private _obstacleBuffer: HTMLCanvasElement | null = null
  public isObstacleRepaintQueued = true

  public fillRoundedMarginCorners(ctx: CanvasRenderingContext2D, _pw: PinballWizard) {
    fillFrameBetweenRectAndRounded(ctx, this._drawRect)
  }

  protected _draw(
    ctx: CanvasRenderingContext2D,
    pw: PinballWizard,
    rect: Rectangle,
  ): void {
    this._drawRect = rect
    const sim = pw.activeSim
    const [x, y, w, h] = rect
    const scale = w / 100 / VALUE_SCALE
    Scrollbar.drawScale = scale

    ctx.clearRect(x, y, w, h)

    // ctx.strokeStyle = 'black'
    // ctx.lineWidth = 3 * window.devicePixelRatio
    // ctx.strokeRect(x, y, w, h)
    strokeInnerRoundedRect(ctx, rect, 'black')

    // Draw obstacles from buffer
    if (buffer && sim && sim.obstacles.length > 0) {
      // Use a simple sim id (could be a hash, here just reference)
      const _simId = sim
      if (!this._obstacleBuffer || this.isObstacleRepaintQueued) {
        this.isObstacleRepaintQueued = false

        // Create buffer
        buffer.width = w
        buffer.height = h
        const bctx = buffer.getContext('2d')!
        bctx.save()
        bctx.translate(0, 0)
        bctx.scale(scale, scale)
        bctx.lineWidth = 1 * window.devicePixelRatio / scale
        for (const room of sim.level.rooms) {
          room.drawDecorationsBelow(bctx, pw, 'scrollbar-gfx')
        }
        bctx.fillStyle = OBSTACLE_FILL
        bctx.strokeStyle = 'black'
        for (const obstacle of sim.obstacles) {
          const {
            isVisible, pos, points,
            // boundingRect, collisionRect
          } = obstacle

          if (obstacle.isDestroyed(sim.stepCount) || !isVisible) continue
          traceObstacle(bctx, pos, points)
          bctx.fill()
          bctx.stroke()
        }
        for (const room of sim.level.rooms) {
          room.drawDecorations(bctx, pw, 'scrollbar-gfx')
        }

        drawFinish(bctx, sim.finish)

        // bctx.restore()
        this._obstacleBuffer = buffer
      }
      ctx.save()
      ctx.translate(x, y)
      ctx.drawImage(this._obstacleBuffer, 0, 0)
      ctx.restore()
    }
  }

  override onResize(_rect: Rectangle): void {
    this.isObstacleRepaintQueued = true
  }

  drawDisks(
    ctx: CanvasRenderingContext2D,
    pw: PinballWizard,
    rect: Rectangle,
  ) {
    this._drawRect = rect
    const sim = pw.activeSim

    const [x, y, w, _h] = rect

    const scale = w / 100 / VALUE_SCALE
    Scrollbar.drawScale = scale

    // ctx.clearRect(x, y, w, h)

    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.lineWidth = 1 * window.devicePixelRatio / scale

    if (sim) {
      // draw disks
      const { selectedDiskIndex, followDiskIndex } = pw
      for (const [diskIndex, disk] of sim.disks.entries()) {
        const isSelected = diskIndex === selectedDiskIndex
        const isFollowed = diskIndex === followDiskIndex
        if (isSelected) continue // followed disk will be drawn last
        if (isFollowed) continue // followed disk will be drawn last
        this.drawDisk(ctx, disk)
      }

      // draw selected disk with gold ring
      if (selectedDiskIndex !== -1) {
        const disk = sim.disks[selectedDiskIndex]
        this.drawDisk(ctx, disk, CROWN_FILL)
      }
      // draw followed disk with red ring
      if (followDiskIndex !== -1 && followDiskIndex !== selectedDiskIndex) {
        const disk = sim.disks[followDiskIndex]
        this.drawDisk(ctx, disk, 'red')
      }

      // Graphics.drawViewRect(ctx, pw.simViewRect)
    }

    ctx.restore()
  }

  drawViewRect(
    ctx: CanvasRenderingContext2D,
    pw: PinballWizard,
    rect: Rectangle,
  ) {
    const [x, y, w, _h] = rect

    const scale = w / 100 / VALUE_SCALE
    Scrollbar.drawScale = scale

    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    // ctx.lineWidth = 1 * window.devicePixelRatio / scale

    // compute dash that lines up with one circum
    const dashCycles = 2
    const dashShrink = 0.2
    const circumference = 2 * pw.simViewRect[2] + 2 * pw.simViewRect[3]
    const baseLength = circumference / dashCycles
    const dashLength = baseLength * dashShrink
    const gapLength = baseLength * (1 - dashShrink)
    _dash[0] = dashLength
    _dash[1] = gapLength

    ctx.lineCap = 'round'

    // if (!Scrollbar.isLocked)
    ctx.setLineDash(_dash)
    ctx.lineDashOffset = dashLength / 2

    ctx.strokeStyle = 'black'
    ctx.lineWidth = DISK_RADIUS * 3
    ctx.strokeRect(...pw.simViewRect)
    ctx.strokeStyle = 'red'
    ctx.lineWidth = DISK_RADIUS * 2
    ctx.strokeRect(...pw.simViewRect)

    ctx.lineDashOffset = pw.simViewRect[3] + dashLength / 2

    ctx.strokeStyle = 'black'
    ctx.lineWidth = DISK_RADIUS * 3
    ctx.strokeRect(...pw.simViewRect)
    ctx.strokeStyle = 'red'
    ctx.lineWidth = DISK_RADIUS * 2
    ctx.strokeRect(...pw.simViewRect)
    ctx.restore()
  }

  // draw mini view of disk in scrollbar
  drawDisk(ctx: CanvasRenderingContext2D, disk: Disk, ringFill?: string) {
    const [cx, cy] = disk.displayPos

    ctx.imageSmoothingEnabled = false
    const edgeRad = VALUE_SCALE * 2 * (ringFill ? 5 : 1.5)
    ctx.strokeStyle = ringFill ?? 'black'
    ctx.lineWidth = edgeRad
    ctx.fillStyle = getScaledPattern(disk.pattern)

    let baseRad = DISK_RADIUS * 5
    if (ringFill) {
      baseRad += edgeRad / 2
    }
    ctx.beginPath()
    ctx.arc(cx, cy, baseRad, 0, twopi)
    ctx.fill()
    ctx.stroke()

    if (ringFill) {
      // draw two thin black edges
      ctx.lineWidth = 3 * VALUE_SCALE
      ctx.strokeStyle = 'black'
      ctx.beginPath()
      ctx.arc(cx, cy, baseRad - edgeRad / 2, 0, twopi)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, baseRad + edgeRad / 2, 0, twopi)
      ctx.stroke()
    }
  }
}

function drawFinish(ctx: CanvasRenderingContext2D, finish: Barrier) {
  // Checker size is 1/10 the width, height is 4 squares
  let x = finish.xywh[0]
  const y = finish.xywh[1]
  let w = finish.xywh[2]
  const pad = w / 10
  x += pad
  w -= 2 * pad
  const squareSize = w / 10
  const nCols = 10
  const nRows = 4
  // const h = nRows * squareSize
  for (let row = 0; row < nRows; row++) {
    for (let col = 0; col < nCols; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? 'white' : 'black'
      ctx.fillRect(x + col * squareSize, y + row * squareSize, squareSize, squareSize)
    }
  }
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
  return buildFillStyle(pattern, Pattern.getCanvas(pattern), 6)
}
