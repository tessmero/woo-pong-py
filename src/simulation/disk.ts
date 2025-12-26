/**
 * @file disk.ts
 *
 * Sliding circle on airhockey table.
 */

import type { Vec2 } from 'util/math-util'
import type { Barrier } from './barrier'

export type DiskState = [number, number, number, number] // x,y,dx,dy

function copy(from: DiskState, to: DiskState) {
  to[0] = from[0]
  to[1] = from[1]
  to[2] = from[2]
  to[3] = from[3]
}

export const tailLength = 10 // number of past positions to remember

const dummy: Vec2 = [0, 0]

export class Disk {
  private readonly _history: Float32Array = new Float32Array(tailLength * 2) // positions along tail
  readonly currentState: DiskState = [0, 0, 0, 0]
  readonly nextState: DiskState = [0, 0, 0, 0]

  static flushStates(disks: Array<Disk>) {
    for (const d of disks) {
      copy(d.nextState, d.currentState)
    }
  }

  * history(): Generator<Vec2> {
    for (let i = 0; i < tailLength; i++) {
      const realIndex = 2 * ((Disk.historyIndex + tailLength - i) % tailLength)
      // yield [this._history[realIndex], this._history[realIndex+1]]
      dummy[0] = this._history[realIndex]
      dummy[1] = this._history[realIndex + 1]
      yield dummy
    }
  }

  static historyIndex = 0 // rolling index in history arrays
  static updateHistory(disks: Array<Disk>) {
    Disk.historyIndex = (Disk.historyIndex + 1) % tailLength
    const realIndex = Disk.historyIndex * 2
    for (const d of disks) {
      // push current position to history
      d._history[realIndex] = d.currentState[0]
      d._history[realIndex + 1] = d.currentState[1]
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
  advance(barriers: Array<Barrier>) {

    const [x, y, dx, dy] = this.currentState
    const nx = x + dx
    const ny = y + dy

    // check for collision
    let bi = 0
    let noHits = true
    let ndx = dx
    let ndy = dy
    for (; bi < barriers.length; bi++) {
      const bar = barriers[bi]
      if (bar.isTouchingDisk(nx, ny)) {
        // // check if hitting exposed corner
        // if( bar.isCornerTouchingDisk(nx,ny) ){

        // }

        // bounce off wall
        if (bar.isTouchingDisk(x - dx, ny)) {
          ndy *= -1
        }
        else {
          ndx *= -1
        }
        noHits = false
        break
      }
    }
    if (noHits) {
      // move forward without changing velocity
      this.nextState[0] = nx
      this.nextState[1] = ny
      return
    }

    // check for second collision (hit corner)
    bi++
    for (; bi < barriers.length; bi++) {
      if (barriers[bi].isTouchingDisk(nx, ny)) {
        // reverse direction
        ndx = -dx
        ndy = -dy
      }
    }

    // apply changed velocity
    this.nextState[0] += ndx
    this.nextState[1] += ndy

    // update velocity
    this.nextState[2] = ndx
    this.nextState[3] = ndy
  }
}
