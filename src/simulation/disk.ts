/**
 * @file disk.ts
 *
 * Sliding circle on airhockey table.
 */

import type { Barrier } from './barrier'

export type DiskState = [number, number, number, number] // x,y,dx,dy

export class Disk {
  readonly currentState: DiskState = [0, 0, 0, 0]
  readonly nextState: DiskState = [0, 0, 0, 0]

  static flushStates(disks: Array<Disk>) {
    for (const d of disks) {
      d.currentState[0] = d.nextState[0]
      d.currentState[1] = d.nextState[1]
      d.currentState[2] = d.nextState[2]
      d.currentState[3] = d.nextState[3]
    }
  }

  static fromJson(obj: object) {
    const [x, y, dx, dy] = obj as any
    const d = new Disk()
    d.currentState[0] = x
    d.currentState[1] = y
    d.currentState[2] = dx
    d.currentState[3] = dy
    d.nextState[0] = x
    d.nextState[1] = y
    d.nextState[2] = dx
    d.nextState[3] = dy
    return d
  }

  toJson() {
    return this.currentState
  }

  // move one tick
  advance(barriers: Array<Barrier>) {
    // if( gravityTick ){

    this.currentState[1] += 1 // gravity
    // friction
    // const tv = 10
    // if (Math.abs(this.dx) > tv) this.dx -= Math.sign(this.dx)
    // if (Math.abs(this.dy) > tv) this.dy -= Math.sign(this.dy)
    // }

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
      if (bar.isTouchingBallAtPos(nx, ny)) {
        // bounce off wall
        if (bar.isTouchingBallAtPos(x - dx, ny)) {
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
      if (barriers[bi].isTouchingBallAtPos(nx, ny)) {
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
