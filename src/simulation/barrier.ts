import { DISK_RADIUS } from "./constants"
import { Disk } from "./disk"


export class Barrier {
  xr: [number, number]
  yr: [number, number]
  xywh: [number, number, number, number]
  constructor(x, y, w, h) {
    x = Math.floor(x)// * global.minDist
    y = Math.floor(y)// * global.minDist
    w = Math.floor(w)// * global.minDist
    h = Math.floor(h)// * global.minDist
    this.xywh = [x, y, w, h]
    this.xr = [
      x - DISK_RADIUS,
      x + w + DISK_RADIUS,
    ]
    this.yr = [
      y - DISK_RADIUS,
      y + h + DISK_RADIUS,
    ]
  }

  advance() {
    // do nothing
  }

  isTouchingBallAtPos(x, y) {
    return (x > this.xr[0]) && (x < this.xr[1]) && (y > this.yr[0]) && (y < this.yr[1])
  }

  draw(g) {
    g.fillRect(...this.xywh)
  }
}
