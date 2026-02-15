/**
 * @file camera.ts
 *
 * Sets vertical offset for graphics, draggable, has momentum,
 * snaps to current room when idle.
 */

import { topConfig } from 'configs/imp/top-config'
import { GfxRegion } from 'gfx/regions/gfx-region'
import { SimGfx } from 'gfx/regions/imp/sim-gfx'
import type { PinballWizard } from 'pinball-wizard'
import { Scrollbar } from 'scrollbar'
import { VALUE_SCALE } from 'simulation/constants'
import { lerp } from 'util/math-util'

export class Camera {
  public pos = -100 * VALUE_SCALE // vertical offset in sim units
  private vel = 0 // sim units per ms

  private readonly _idleDelay = 1000 // ms
  private _idleCountdown = 0
  private _cameraFriction = 1e-3 // fraction of speed lost per ms
  private _snapSpeed = 2e-3 // fraction lerped per ms

  public get isIdle() { return this._idleCountdown <= 0 }

  jumpToRoom(pinballWizard: PinballWizard, roomIndex: number) {
    this.targetRoom = roomIndex

    // const room = pinballWizard.activeSim.level.rooms[roomIndex]
    // const roomCenter = -room.bounds[1] - room.bounds[3] / 2
    // this.pos = roomCenter
    // this.vel = 0
  }

  targetRoom = 0

  update(dt: number, pinballWizard: PinballWizard) {
    if (Scrollbar.isDragging || this.isDragging) {
      this._idleCountdown = this._idleDelay
    }
    if (this.isDragging || Scrollbar.isDragging
      || Scrollbar.isLocked || pinballWizard.isHalted
      || pinballWizard.speed === 'paused') {
      // do nothing
      return
    }
    if (this._idleCountdown > 0) {
      this._idleCountdown -= dt
      if (this._idleCountdown <= 0) {
        // just started idling

        // // pick nearest room
        // let lowestDist = Infinity
        // let targetRoom = -1
        // for (const [roomIndex, room] of pinballWizard.activeSim.level.rooms.entries()) {
        //   const roomCenter = -room.bounds[1] - room.bounds[3] / 2
        //   const dist = Math.abs(this.pos - roomCenter)
        //   if (dist < lowestDist) {
        //     lowestDist = dist
        //     targetRoom = roomIndex
        //   }
        // }
        const targetRoom = this.targetRoom

        topConfig.tree.children.roomIndex.value = targetRoom
        topConfig.refreshConfig()
      }
    }
    if (this._idleCountdown <= 0) {
      // camera is idle
      const { rooms } = pinballWizard.activeSim.level
      let roomIndex = this.targetRoom// topConfig.flatConfig.roomIndex
      roomIndex = Math.max(0, Math.min(rooms.length - 1, roomIndex))
      const room = rooms[roomIndex]

      // top of room in center of view
      // const targetPos = -room.bounds[1]

      // // bottom of room (flippers) in center of view
      // const targetPos = -room.bounds[1] - room.bounds[3]

      // bottom of room (flippers) at bottom of view
      const viewHeight = pinballWizard.simViewRect[3] // view height in units of room bounds
      const targetPos = -room.bounds[1] - room.bounds[3] + viewHeight / 2

      SimGfx.debugTargetPos = targetPos
      this.pos = lerp(this.pos, targetPos, this._snapSpeed * dt)
    }

    this.vel *= (1 - this._cameraFriction * dt)
    this.pos += this.vel
  }

  scroll(delta: number) {
    // const { roomIndex } = topConfig.flatConfig
    // let newRoomIndex = roomIndex + Math.sign(delta)
    // newRoomIndex = Math.max(0, Math.min(ROOM_COUNT - 1, newRoomIndex))
    // topConfig.tree.children.roomIndex.value = newRoomIndex
    // topConfig.refreshConfig()

    const { scrollSpeed } = topConfig.flatConfig
    this.pos += delta * scrollSpeed

    // console.log('camera not idle (scroll)')
    this._idleCountdown = this._idleDelay
  }

  private lastDragTime = performance.now()
  private isDragging = false
  drag(start: number, end: number) {
    const t = performance.now()
    // const timeDelta = t - this.lastDragTime
    const mouseDelta = end - start
    const posDelta = mouseDelta / (GfxRegion.create('sim-gfx') as SimGfx).drawSimScale * window.devicePixelRatio
    this.pos += posDelta
    // this.vel = posDelta / timeDelta // set velocity in case mouse is released

    // console.log('camera not idle (drag)')
    this._idleCountdown = this._idleDelay
    this.isDragging = true
    this.lastDragTime = t
  }

  endDrag() {
    if (!this.isDragging) return
    // console.log('camera not idle (end drag)')
    this._idleCountdown = this._idleDelay
    this.isDragging = false
  }
}
