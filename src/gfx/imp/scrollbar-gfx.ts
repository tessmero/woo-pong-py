/**
 * @file scrollbar-gfx.ts
 *
 * Graphics region for scrollbars.
 */

import { twopi, type Rectangle, type Vec2 } from 'util/math-util'
import { GfxRegion } from '../gfx-region'
import { traceObstacle } from 'gfx/obstacle-gfx-util'
import type { PinballWizard } from 'pinball-wizard'
import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'
import { Graphics, OBSTACLE_FILL } from 'gfx/graphics'
import { Scrollbar } from 'scrollbar'
import type { Disk } from 'simulation/disk'
import type { DiskPattern } from 'gfx/disk-gfx-util'
import { buildPattern, PATTERN_FILLERS } from 'gfx/disk-gfx-util'
import type { Obstacle } from 'simulation/obstacle'
import { fillFrameBetweenRectAndRounded, strokeInnerRoundedRect } from 'gfx/canvas-rounded-rect-util'

export class ScrollbarGfx extends GfxRegion {
  static {
    GfxRegion.register('scrollbar-gfx', () => new ScrollbarGfx())
  }

  // private isDragging = false
  private _drawRect: Rectangle = [1, 1, 1, 1]
  public isRepaintQueued = false

  down(_pw: PinballWizard, _mousePos: Vec2) {
    _pw.camera.pos = -(_mousePos[1] * window.devicePixelRatio - this._drawRect[1] / 2) / Scrollbar.drawScale
    Scrollbar.isDragging = true
  }

  move(_pw: PinballWizard, _mousePos: Vec2) {
    if (Scrollbar.isDragging) {
      _pw.camera.pos = -(_mousePos[1] * window.devicePixelRatio - this._drawRect[1] / 2) / Scrollbar.drawScale
    }
  }

  leave(_pw: PinballWizard, _mousePos: Vec2) {
    if (Scrollbar.isDragging) {
      // user started drag in scrollbar, now moving in another region while scrollbar is held
      _pw.camera.pos = -(_mousePos[1] * window.devicePixelRatio - this._drawRect[1]) / Scrollbar.drawScale
    }
  }

  up(_pw: PinballWizard, _mousePos: Vec2) {
    Scrollbar.isDragging = false
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
    if (sim && sim.obstacles.length > 0) {
      // Use a simple sim id (could be a hash, here just reference)
      const _simId = sim
      if (!this._obstacleBuffer || this.isObstacleRepaintQueued) {
        this.isObstacleRepaintQueued = false

        // Create buffer
        const buffer = document.createElement('canvas')
        buffer.width = w
        buffer.height = h
        const bctx = buffer.getContext('2d')!
        bctx.save()
        bctx.translate(0, 0)
        bctx.scale(scale, scale)
        bctx.lineWidth = 1 * window.devicePixelRatio / scale
        bctx.fillStyle = OBSTACLE_FILL
        bctx.strokeStyle = 'black'
        for (const obstacle of sim.obstacles) {
          traceObstacle(bctx, obstacle)
          bctx.fill()
          bctx.stroke()
        }
        // bctx.restore()
        this._obstacleBuffer = buffer
      }
      ctx.save()
      ctx.translate(x, y)
      ctx.drawImage(this._obstacleBuffer, 0, 0)
      ctx.restore()
    }
  }

  onResize(_rect: Rectangle): void {
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
      const selected = pw.selectedDiskIndex
      for (const [diskIndex, disk] of sim.disks.entries()) {
        const _isSelected = (diskIndex === selected)
        if (_isSelected) continue // selected disk will be drawn last
        this.drawDisk(ctx, disk, _isSelected)
      }

      // draw selected disk
      if (selected !== -1) {
        const disk = sim.disks[selected]
        this.drawDisk(ctx, disk, true)
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
    ctx.lineWidth = 1 * window.devicePixelRatio / scale

    Graphics.drawViewRect(ctx, pw.simViewRect)

    ctx.restore()
  }

  // draw mini view of disk in scrollbar
  drawDisk(ctx: CanvasRenderingContext2D, disk: Disk, isSelected: boolean) {
    const [cx, cy] = disk.interpolatedPos

    const edgeRad = VALUE_SCALE * 2 * (isSelected ? 5 : 1)
    ctx.strokeStyle = isSelected ? 'green' : 'black'
    ctx.lineWidth = edgeRad
    ctx.fillStyle = getScaledPattern(disk.pattern)

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
