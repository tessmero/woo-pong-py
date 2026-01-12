/**
 * @file camera.ts
 *
 * Sets vertical offset for graphics, draggable, has momentum,
 * snaps to current room when idle.
 */

import { topConfig } from 'configs/imp/top-config'
import { Graphics } from 'gfx/graphics'
import type { PinballWizard } from 'pinball-wizard'
import { ROOM_COUNT } from 'simulation/constants'
import { lerp } from 'util/math-util'

export class Camera {
  public pos = 0 // vertical offset in sim units
  private vel = 0 // sim units per ms

  private readonly _idleDelay = 1000 // ms
  private _idleCountdown = 0
  private _cameraFriction = 1e-3 // fraction of speed lost per ms
  private _snapSpeed = 7e-3 // fraction lerped per ms

  update(dt: number, pinballWizard: PinballWizard) {
    if (this.isDragging) {
      // do nothing
      return
    }
    if (this._idleCountdown > 0) {
      this._idleCountdown -= dt
      if (this._idleCountdown <= 0) {
        // just started idling

        // pick nearest room
        let lowestDist = Infinity
        let targetRoom = -1
        for (const [roomIndex, room] of pinballWizard.activeSim.level.rooms.entries()) {
          const roomCenter = -room.bounds[1] - room.bounds[3] / 2
          const dist = Math.abs(this.pos - roomCenter)
          if (dist < lowestDist) {
            lowestDist = dist
            targetRoom = roomIndex
          }
        }
        topConfig.tree.children.roomIndex.value = targetRoom
        topConfig.refreshConfig()
      }
    }
    if (this._idleCountdown <= 0) {
      // camera is idle
      const { rooms } = pinballWizard.activeSim.level
      let roomIndex = topConfig.flatConfig.roomIndex
      roomIndex = Math.max(0, Math.min(rooms.length - 1, roomIndex))
      const room = rooms[roomIndex]
      const targetPos = -room.bounds[1] - room.bounds[3] / 2

      this.pos = lerp(this.pos, targetPos, this._snapSpeed * dt)
    }

    this.vel *= (1 - this._cameraFriction * dt)
    this.pos += this.vel
  }

  scroll(delta: number) {
    const { roomIndex } = topConfig.flatConfig
    let newRoomIndex = roomIndex + Math.sign(delta)
    newRoomIndex = Math.max(0, Math.min(ROOM_COUNT-1, newRoomIndex))
    topConfig.tree.children.roomIndex.value = newRoomIndex
    topConfig.refreshConfig()

    // const { scrollSpeed } = topConfig.flatConfig
    // this.pos += delta * scrollSpeed
    // this._idleCountdown = this._idleDelay
  }

  private lastDragTime = performance.now()
  private isDragging = false
  drag(start: number, end: number) {
    const t = performance.now()
    const timeDelta = t - this.lastDragTime
    const mouseDelta = end - start
    const posDelta = mouseDelta / Graphics.drawSimScale * window.devicePixelRatio
    this.pos += posDelta
    this.vel = posDelta / timeDelta // set velocity in case mouse is released
    this._idleCountdown = this._idleDelay
    this.isDragging = true
    this.lastDragTime = t
  }

  endDrag() {
    this._idleCountdown = this._idleDelay
    this.isDragging = false
  }
}
