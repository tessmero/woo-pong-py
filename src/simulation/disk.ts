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
import type { DiskPattern } from 'gfx/disk-gfx'
import { DISK_RADIUS } from './constants'

// export const DISK_STYLES = ['red', 'green', 'blue', 'yellow'] as const
// export type DiskStyle = (typeof DISK_STYLES)[number]

export type DiskState = [number, number, number, number] // x,y,dx,dy

function copy(from: DiskState, to: DiskState) {
  to[0] = from[0]
  to[1] = from[1]
  to[2] = from[2]
  to[3] = from[3]
}

export const tailLength = 30 // number of past positions to remember

const dummy: [number, number, number] = [0, 0, 0]

export class Disk {
  pattern: DiskPattern = 'white'

  private readonly _history: Float32Array = new Float32Array(tailLength * 2) // positions along tail
  readonly currentState: DiskState = [0, 0, 0, 0]
  readonly nextState: DiskState = [0, 0, 0, 0]

  stepFrac = 0
  readonly lastStepPos: Vec2 = [0, 0]
  readonly interpolatedPos: Vec2 = [0, 0]

  // called once at end of step
  static flushStates(disks: Array<Disk>) {
    for (const d of disks) {
      d.lastStepPos[0] = d.currentState[0]
      d.lastStepPos[1] = d.currentState[1]

      for (let i = 0; i < 4; i++) {
        d.nextState[i] = Math.round(d.nextState[i])
      }

      copy(d.nextState, d.currentState)
    }
  }

  * history(): Generator<[number, number, number]> {
    let lastX = 0
    let lastY = 0
    let cumulativeDistance = 0
    for (let i = 0; i < tailLength; i += 3) {
      const realIndex = 2 * ((Disk.historyIndex + tailLength - i) % tailLength)
      // yield [this._history[realIndex], this._history[realIndex+1]]

      const x = this._history[realIndex]
      const y = this._history[realIndex + 1]

      if (i > 0) {
        cumulativeDistance += Math.hypot(x - lastX, y - lastY)
      }
      lastX = x
      lastY = y

      dummy[0] = x
      dummy[1] = y
      dummy[2] = cumulativeDistance

      yield dummy
    }
  }

  static historyIndex = 0 // rolling index in history arrays
  static updateHistory(disks: Array<Disk>) {
    Disk.historyIndex = (Disk.historyIndex + 1) % tailLength
    const realIndex = Disk.historyIndex * 2
    for (const d of disks) {
      // push current position to history
      d._history[realIndex] = d.interpolatedPos[0]
      d._history[realIndex + 1] = d.interpolatedPos[1]
    }
  }

  static fromJson(obj: object) {
    const d = new Disk()
    copy(obj as DiskState, d.currentState)
    copy(obj as DiskState, d.nextState)
    return d
  }

  toJson() {
    return this.currentState
  }

  // move one tick
  advance(obstacles: Array<Obstacle>) {
    const [x, y, dx, dy] = this.currentState
    const nx = x + dx
    const ny = y + dy
    let ndx = dx
    let ndy = dy
    let hasNoHits = true

    // check for collisions with obstacles
    let oi = 0
    for (; oi < obstacles.length; oi++) {
      const obs = obstacles[oi]
      if (obs.isHidden) continue
      if (rectContainsPoint(obs.collisionRect, nx, ny)) {
        let i0 = obs.lut.offsetToXIndex(nx - obs.pos[0])
        let i1 = obs.lut.offsetToYIndex(ny - obs.pos[1])
        const xRad = (obs.lut as ObstacleLut).obsOffsetDetailX
        const yRad = (obs.lut as ObstacleLut).obsOffsetDetailY
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
          // collided with obstacle
          const [xAdj, yAdj, normIndex] = col

          let vxi = speedToIndex(ndx)
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
          ndx += vxAdj
          ndy += vyAdj

          this.nextState[0] += xAdj
          this.nextState[1] += yAdj
          this.nextState[2] = ndx
          this.nextState[3] = ndy

          hasNoHits = false
          return
        }
      }
    }

    if (hasNoHits) {
      // move forward without changing velocity
      this.nextState[0] = nx
      this.nextState[1] = ny
    }
    else {
      // apply changed velocity
      this.nextState[0] += ndx
      this.nextState[1] += ndy

      // update velocity
      this.nextState[2] = ndx
      this.nextState[3] = ndy
    }
  }

  pushInBounds(bounds: Rectangle){
    
    if ((this.nextState[0] - DISK_RADIUS) < bounds[0]) {
      this.nextState[0] = bounds[0] + DISK_RADIUS
      if (this.nextState[2] < 0) {
        this.nextState[2] *= -1
      }
    }
    if ((this.nextState[1] - DISK_RADIUS) < bounds[1]) {
      this.nextState[1] = bounds[1] + DISK_RADIUS
      if (this.nextState[3] < 0) {
        this.nextState[3] *= -1
      }
    }

    if ((this.nextState[0] + DISK_RADIUS) > (bounds[0] + bounds[2])) {
      this.nextState[0] = bounds[0] + bounds[2] - DISK_RADIUS
      if (this.nextState[2] > 0) {
        this.nextState[2] *= -1
      }
    }
    if ((this.nextState[1] + DISK_RADIUS) > (bounds[1] + bounds[3])) {
      this.nextState[1] = bounds[1] + bounds[3] - DISK_RADIUS
      if (this.nextState[3] > 0) {
        this.nextState[3] *= -1
      }
    }
  }
}
