/**
 * @file camera.ts
 *
 * Sets vertical offset for graphics, draggable, has momentum,
 * snaps to current room when idle.
 */

import { topConfig } from 'configs/imp/top-config'
import { lerp } from 'util/math-util'

export class Camera {
  private pos = 0
  private vel = 0

  public get drawOffset(): number {
    return this.pos
  }

  private readonly _idleDelay = 1000 // ms
  private _idleCountdown = 0
  private _cameraFriction = 1e-3 // fraction of speed lost per ms

  update(dt: number) {
    if (this.isDragging) {
      // do nothing
    }
    else if (this._idleCountdown > 0) {
      this._idleCountdown -= dt
    }
    else {
      // camera is idle
      const targetPos = 100 * topConfig.flatConfig.roomIndex
      this.pos = lerp(this.pos, targetPos, 1e-3 * dt)
    }

    this.vel *= (1 - this._cameraFriction * dt)
    this.pos += this.vel
  }

  scroll(delta: number) {
    const { scrollSpeed } = topConfig.flatConfig
    this.pos += delta * scrollSpeed
    this._idleCountdown = this._idleDelay
  }

  private isDragging = false
  drag(start: number, end: number) {
    const delta = end - start
    this.pos += delta * window.devicePixelRatio
    this._idleCountdown = this._idleDelay
    this.isDragging = true
  }

  endDrag() {
    this._idleCountdown = this._idleDelay
    this.isDragging = false
  }
}
