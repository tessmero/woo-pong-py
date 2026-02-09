/**
 * @file disk.ts
 *
 * Sliding circle on airhockey table.
 */

import type { Rectangle } from 'util/math-util'
import { rectContainsPoint, type Vec2 } from 'util/math-util'
import type { Obstacle } from './obstacle'
import type { ObstacleLut } from './luts/imp/obstacle-lut'
import { type ObstacleCollision } from './luts/imp/obstacle-lut'
import { Lut } from './luts/lut'
import { speedDetail, speedToIndex, type DiskNormalBounce } from './luts/imp/disk-normal-lut'
import { DISK_RADIUS, TAIL_STEPS } from './constants'
import { applyFrictionX } from './luts/imp/disk-friction-lut'
import { playImpact } from 'audio/collision-sounds'
import { SimHistory } from './sim-history'
import { PatternName } from 'imp-names'

// export const DISK_STYLES = ['red', 'green', 'blue', 'yellow'] as const
// export type DiskStyle = (typeof DISK_STYLES)[number]

export class DiskState {
  private _x!: number
  private _y!: number
  private _dx!: number
  private _dy!: number

  constructor(x: number, y: number, dx: number, dy: number) {
    this.x = x
    this.y = y
    this.dx = dx
    this.dy = dy
  }

  get x() { return this._x }
  set x(value: number) {
    if (!Number.isInteger(value)) throw new Error('x must be an integer')
    this._x = value
  }

  get y() { return this._y }
  set y(value: number) {
    if (!Number.isInteger(value)) throw new Error('y must be an integer')
    this._y = value
  }

  get dx() { return this._dx }
  set dx(value: number) {
    if (!Number.isInteger(value)) throw new Error('dx must be an integer')
    this._dx = value
  }

  get dy() { return this._dy }
  set dy(value: number) {
    if (!Number.isInteger(value)) throw new Error('dy must be an integer')
    this._dy = value
  }

  setAll(x: number, y: number, dx: number, dy: number) {
    this.x = x
    this.y = y
    this.dx = dx
    this.dy = dy
  }

  copy(other: DiskState) {
    this.setAll(other.x, other.y, other.dx, other.dy)
  }

  toArray(): [number, number, number, number] {
    return [this._x, this._y, this._dx, this._dy]
  }

  static fromArray(arr: [number, number, number, number]): DiskState {
    return new DiskState(arr[0], arr[1], arr[2], arr[3])
  }
}

export class Disk {
  pattern: PatternName = 'white'

  readonly currentState: DiskState = new DiskState(0, 0, 0, 0)
  readonly nextState: DiskState = new DiskState(0, 0, 0, 0)

  stepFrac = 0
  readonly displayPos: Vec2 = [0, 0]

  // called once at end of step
  static flushStates(disks: Array<Disk>) {
    for (const d of disks) {
      d.currentState.copy(d.nextState)
    }
  }


  static fromJson(obj: object) {
    const d = new Disk()
    const arr = obj as [number, number, number, number]
    d.currentState.setAll(arr[0], arr[1], arr[2], arr[3])
    d.nextState.setAll(arr[0], arr[1], arr[2], arr[3])
    return d
  }

  toJson() {
    return this.currentState.toArray()
  }

  // move one tick
  advance(obstacles: Array<Obstacle>, stepIndex: number) {
    const x = this.currentState.x
    const y = this.currentState.y
    const dx = this.currentState.dx
    const dy = this.currentState.dy
    const nx = x + dx
    const ny = y + dy
    let ndx = dx
    let ndy = dy
    let hasNoHits = true

    // check for collisions with obstacles
    let oi = 0
    for (; oi < obstacles.length; oi++) {
      const obs = obstacles[oi]
      if (obs.hideOnStep !== -1) continue // obstacle is hidden for purposes of simulation
      if (rectContainsPoint(obs.collisionRect, nx, ny)) {
        const xRad = (obs.lut as ObstacleLut).obsOffsetDetailX
        const yRad = (obs.lut as ObstacleLut).obsOffsetDetailY
        let xOff = nx - obs.pos[0]
        if (obs.isFlippedX) {
          xOff *= -1
        }
        let i0 = obs.lut.offsetToXIndex(xOff)
        let i1 = obs.lut.offsetToYIndex(ny - obs.pos[1])
        if (Math.abs(i0) > xRad) {
          i0 = xRad * Math.sign(i0)
        }
        if (Math.abs(i1) > yRad) {
          i1 = yRad * Math.sign(i1)
        }
        if (obs.lut.tree.length === 0) {
          throw new Error('obs.lut.tree has length 0')
        }
        const col = obs.lut.tree[i0 + xRad]![i1 + yRad] as null | ObstacleCollision
        if (col) {
          obs.room?.obstacleHit(obs, stepIndex)

          // collided with obstacle
          const [xAdj, yAdj, normIndex] = col

          let vxi = speedToIndex(ndx * (obs.isFlippedX ? -1 : 1))
          let vyi = speedToIndex(ndy)
          if (Math.abs(vxi) > speedDetail) {
            vxi = speedDetail * Math.sign(vxi)
          }
          if (Math.abs(vyi) > speedDetail) {
            vyi = speedDetail * Math.sign(vyi)
          }

          const dnl = Lut.create('disk-normal-lut')
          const bounce = dnl
            .tree[vxi + speedDetail][vyi + speedDetail][normIndex] as DiskNormalBounce
          const [vxAdj, vyAdj] = bounce
          ndx += vxAdj * (obs.isFlippedX ? -1 : 1)
          ndy += vyAdj

          this.nextState.x += xAdj * (obs.isFlippedX ? -1 : 1)
          this.nextState.y += yAdj
          this.nextState.dx = ndx
          this.nextState.dy = ndy

          hasNoHits = false

          // play sound
          playImpact(this.nextState, false)

          return // disk can't bounce more than once per step
        }
      }
    }

    if (hasNoHits) {
      // move forward without changing velocity
      this.nextState.x = nx
      this.nextState.y = ny
    }
    else {
      throw new Error('this should be unreachable')

      // apply changed velocity
      this.nextState.x += ndx
      this.nextState.y += ndy

      // update velocity
      this.nextState.dx = ndx
      this.nextState.dy = ndy
    }
  }

  pushInBounds(bounds: Rectangle) {
    if ((this.nextState.x - DISK_RADIUS) < bounds[0]) {
      this.nextState.x = bounds[0] + DISK_RADIUS
      if (this.nextState.dx < 0) {
        this.nextState.dx *= -1
        applyFrictionX(this.nextState)
      }
    }

    // // top
    // if ((this.nextState.y - DISK_RADIUS) < bounds[1]) {
    //   this.nextState.y = bounds[1] + DISK_RADIUS
    //   if (this.nextState.dy < 0) {
    //     this.nextState.dy *= -1
    //     applyFrictionY(this.nextState)
    //   }
    // }

    if ((this.nextState.x + DISK_RADIUS) > (bounds[0] + bounds[2])) {
      this.nextState.x = bounds[0] + bounds[2] - DISK_RADIUS
      if (this.nextState.dx > 0) {
        this.nextState.dx *= -1
        applyFrictionX(this.nextState)
      }
    }
    // // bottom
    // if ((this.nextState.y + DISK_RADIUS) > (bounds[1] + bounds[3])) {
    //   this.nextState.y = bounds[1] + bounds[3] - DISK_RADIUS
    //   if (this.nextState.dy > 0) {
    //     this.nextState.dy *= -1
    //     applyFrictionY(this.nextState)
    //   }
    // }
  }
}
