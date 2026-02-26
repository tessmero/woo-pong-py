/**
 * @file disk.ts
 *
 * Sliding circle on airhockey table.
 */

import { rectContainsPoint, type Vec2 } from 'util/math-util'
import type { Obstacle } from './obstacle'
import type { ObstacleLut } from './luts/imp/obstacle-lut'
import { Lut } from './luts/lut'
import { speedDetail, speedToIndex } from './luts/imp/disk-normal-lut'
import { DISK_RADIUS } from './constants'
import { playImpact } from 'audio/collision-sounds'
import type { PatternName } from 'imp-names'
import type { Simulation } from './simulation'

let _dnlCache: Lut | null = null
function _getDnl() {
  return _dnlCache ??= Lut.create('disk-normal-lut')
}

// export const DISK_STYLES = ['red', 'green', 'blue', 'yellow'] as const
// export type DiskStyle = (typeof DISK_STYLES)[number]

export class DiskState {
  x: number
  y: number
  dx: number
  dy: number

  constructor(x: number, y: number, dx: number, dy: number) {
    this.x = x
    this.y = y
    this.dx = dx
    this.dy = dy
  }

  setAll(x: number, y: number, dx: number, dy: number) {
    this.x = x
    this.y = y
    this.dx = dx
    this.dy = dy
  }

  copy(other: DiskState) {
    this.x = other.x
    this.y = other.y
    this.dx = other.dx
    this.dy = other.dy
  }

  toArray(): [number, number, number, number] {
    return [this.x, this.y, this.dx, this.dy]
  }

  static fromArray(arr: [number, number, number, number]): DiskState {
    return new DiskState(arr[0], arr[1], arr[2], arr[3])
  }

  /** Debug-only validation. Call sparingly (e.g. once per step). */
  assertValid() {
    if (!Number.isInteger(this.x)) throw new Error(`x is non-integer: ${this.x}`)
    if (!Number.isInteger(this.y)) throw new Error(`y is non-integer: ${this.y}`)
    if (!Number.isInteger(this.dx)) throw new Error(`dx is non-integer: ${this.dx}`)
    if (!Number.isInteger(this.dy)) throw new Error(`dy is non-integer: ${this.dy}`)
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
      d.nextState.assertValid()
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
        if (obs.lut.data.length === 0) {
          throw new Error('obs.lut.data has length 0')
        }
        const obsCell = obs.lut.flatIndex(i0 + xRad, i1 + yRad)
        if (obs.lut.hasLeafAt(obsCell)) {
          obs.room?.obstacleHit(obs, stepIndex)

          // collided with obstacle
          const xAdj = obs.lut.get(obsCell, 'xAdj')
          const yAdj = obs.lut.get(obsCell, 'yAdj')
          const normIndex = obs.lut.get(obsCell, 'normIndex')

          let vxi = speedToIndex(ndx * (obs.isFlippedX ? -1 : 1))
          let vyi = speedToIndex(ndy)
          if (Math.abs(vxi) > speedDetail) {
            vxi = speedDetail * Math.sign(vxi)
          }
          if (Math.abs(vyi) > speedDetail) {
            vyi = speedDetail * Math.sign(vyi)
          }

          const dnl = _getDnl()
          const dnlCell = dnl.flatIndex(vxi + speedDetail, vyi + speedDetail, normIndex)
          const vxAdj = dnl.get(dnlCell, 'dvx')
          const vyAdj = dnl.get(dnlCell, 'dvy')
          ndx += vxAdj * (obs.isFlippedX ? -1 : 1)
          ndy += vyAdj

          this.nextState.x += xAdj * (obs.isFlippedX ? -1 : 1)
          this.nextState.y += yAdj
          this.nextState.dx = ndx
          this.nextState.dy = ndy

          hasNoHits = false

          // play sound
          playImpact(this.nextState, false, Math.hypot(vxAdj, vyAdj))

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

  pushInBounds(sim: Simulation) {
    const bounds = sim.level.bounds

    // if (sim.isSimple) {
    //   // top wall
    //   if ((this.nextState.y - DISK_RADIUS) < bounds[1]) {
    //     this.nextState.y = bounds[1] + DISK_RADIUS
    //     if (this.nextState.dy < 0) {
    //       vBounce(this.nextState)
    //     }
    //   }
    //   // bottom wall
    //   if ((this.nextState.y + DISK_RADIUS) > (bounds[1] + bounds[3])) {
    //     this.nextState.y = bounds[1] + bounds[3] - DISK_RADIUS
    //     if (this.nextState.dy > 0) {
    //       vBounce(this.nextState)
    //     }
    //   }
    // }

    // left wall
    if ((this.nextState.x - DISK_RADIUS) < bounds[0]) {
      this.nextState.x = bounds[0] + DISK_RADIUS
      if (this.nextState.dx < 0) {
        hBounce(this.nextState)
      }
    }

    // right wall
    if ((this.nextState.x + DISK_RADIUS) > (bounds[0] + bounds[2])) {
      this.nextState.x = bounds[0] + bounds[2] - DISK_RADIUS
      if (this.nextState.dx > 0) {
        hBounce(this.nextState)
      }
    }
  }
}

function hBounce(state: DiskState) {
  state.dx *= -1
  playImpact(state, false, 2 * Math.abs(state.dx))
  // applyFrictionX(state)
}

function vBounce(state: DiskState) {
  state.dy *= -1
  playImpact(state, false, 2 * Math.abs(state.dy))
  // applyFrictionX(state)
}
