/**
 * @file disk.ts
 *
 * Sliding circle on airhockey table.
 */

import type { Barrier } from './barrier'

export class Disk {
  static readonly radius = 10
  x = 51
  y = 50
  dx = 2
  dy = 1

  static fromJson(obj: object) {
    const [x, y, dx, dy] = obj as any
    const d = new Disk()
    d.x = x
    d.y = y
    d.dx = dx
    d.dy = dy
    return d
  }

  toJson() {
    return [
      this.x, this.y, this.dx, this.dy,
    ]
  }

  // move one tick
  advance(barriers: Array<Barrier>) {
    // if( gravityTick ){
    //     //gravity
    //     this.dy += 1
    //     //friction
    //     var tv = 10
    //     if(Math.abs(this.dx)>tv) this.dx -= Math.sign(this.dx)
    //     if(Math.abs(this.dy)>tv) this.dy -= Math.sign(this.dy)
    // }

    const nx = this.x + this.dx
    const ny = this.y + this.dy

    // check for collision
    let bi = 0
    let noHits = true
    let ndx = this.dx
    let ndy = this.dy
    for (; bi < barriers.length; bi++) {
      const bar = barriers[bi]
      if (bar.isTouchingBallAtPos(nx, ny)) {
        // bounce off wall
        if (bar.isTouchingBallAtPos(this.x - this.dx, ny)) {
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
      this.x = nx
      this.y = ny
      return
    }

    // check for second collision (hit corner)
    bi++
    for (; bi < barriers.length; bi++) {
      if (barriers[bi].isTouchingBallAtPos(nx, ny)) {
        // reverse direction
        ndx = -this.dx
        ndy = -this.dy
      }
    }

    // apply changed velocity
    this.dx = ndx
    this.dy = ndy
    this.x += ndx
    this.y += ndy
  }
}
