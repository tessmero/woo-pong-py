/**
 * @file math-util.ts
 *
 * Math functions to use with custom Vec2 utilities.
 */

export type Rectangle = [number, number, number, number] // x, y,w ,h
export type Box = [number, number, number, number, number, number] // x,y,z,w,h,d

export type Vec2 = [number, number] // x,y

export const pi = Math.PI
export const twopi = 2 * pi
export const pio2 = pi / 2
export const pio4 = pi / 4

export function rectContainsPoint(rect: Rectangle, px: number, py: number) {
  const [x, y, w, h] = rect
  return (px >= x) && (px < (x + w)) && (py >= y) && (py < (y + h))
}

export function rectsOverlap(a: Rectangle, b: Rectangle) {
  const [ax, ay, aw, ah] = a
  const [bx, by, bw, bh] = b
  return ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah
}

export function lerp(a: number, b: number, t = 0.5): number {
  return a + (b - a) * t
}

export function lerp2(a: Vec2, b: Vec2, t = 0.5): Vec2 {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
  ]
}

export function sub2(a: Vec2, b: Vec2): Vec2 {
  return [a[0] - b[0], a[1] - b[1]]
}

export function add2(a: Vec2, b: Vec2): Vec2 {
  return [a[0] + b[0], a[1] + b[1]]
}

export function getAngle([x, y]: Vec2) {
  return Math.atan2(y, x)
}

export function getLength([x, y]: Vec2) {
  return Math.sqrt(x * x + y * y)
}

export function polar(angle: number, rad: number): Vec2 {
  return [rad * Math.cos(angle), rad * Math.sin(angle)]
}

export function gaussianRandom(mean = 0, stdev = 1) {
  let u = 0, v = 0
  // Ensure u and v are not 0 to avoid issues with Math.log
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()

  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)

  // Apply mean and standard deviation
  return z * stdev + mean
}

/** Always-positive modulo (JS % can return negative values). */
export function mod(a: number, m: number): number {
  return ((a % m) + m) % m
}

// https://stackoverflow.com/a/2450976
export function shuffle(array) {
  let currentIndex = array.length
  let randomIndex

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]]
  }

  return array
}
