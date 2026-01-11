/**
 * @file camera.ts
 *
 * Sets vertical offset for graphics, draggable, has momentum,
 * snaps to current room when idle.
 */

import { topConfig } from 'configs/imp/top-config'
import { Graphics } from 'gfx/graphics'
import { PinballWizard } from 'pinball-wizard'
import { VALUE_SCALE } from 'simulation/constants'
import { lerp } from 'util/math-util'

export class Camera {
  public pos = 0
  private vel = 0

  public get drawOffset(): number {
    return this.pos
  }

  private readonly _idleDelay = 1000 // ms
  private _idleCountdown = 0
  private _cameraFriction = 1e-3 // fraction of speed lost per ms

  update(dt: number, pinballWizard: PinballWizard) {
    if (this.isDragging) {
      // do nothing
    }
    else if (this._idleCountdown > 0) {
      this._idleCountdown -= dt
    }
    else {
      // camera is idle
      const room = pinballWizard.activeSim.level.rooms[topConfig.flatConfig.roomIndex]
      const targetPos = -room.bounds[1] / VALUE_SCALE
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
