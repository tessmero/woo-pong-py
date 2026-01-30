/**
 * @file glass-gfx.ts
 *
 * Region in front of other regions.
 */

import type { PinballWizard } from 'pinball-wizard'
import { GfxRegion } from '../gfx-region'
import type { Rectangle, Vec2 } from 'util/math-util'
import { Graphics } from 'gfx/graphics'
import type { SimGfx } from './sim-gfx'
import { VALUE_SCALE } from 'simulation/constants'

export class GlassGfx extends GfxRegion {
  private _xOffset: number = 0
  // private _yOffset: number = 0
  private _yAnimOffset: number = 0
  private get _yOffset() {
    const simGfx = (GfxRegion.create('sim-gfx') as SimGfx)
    const simOffset = simGfx.drawOffset
    const val = this._yAnimOffset - simOffset[1] / Graphics.glassPixelScale
    const n = GlassGfx.GLASS_RES
    return ((val % n) + n) % n
  }

  private static readonly X_SCROLL_RATE = 1e-3 // pixels per ms
  private static readonly Y_SCROLL_RATE = 0 // pixels per ms
  static {
    GfxRegion.register('glass-gfx', () => new GlassGfx())
  }

  // Low-res glass simulation parameters
  private static readonly GLASS_RES = 50 // max number of pixels per axis (square)
  private static readonly SPRING_K = 1e-7 // spring constant
  private static readonly DAMPING = 0 // velocity damping
  private static readonly DIAG_SPRING_RATIO = 0.5 // diagonal spring is weaker
  private static readonly MASS = 1.0
  private static readonly BASE_OPACITY = 0.2
  private static readonly BASE_SPRING_K = 1e-7 // strength of base spring

  private _opacity: Float32Array | null = null
  private _velocity: Float32Array | null = null
  private _didInit = false

  private _initArrays() {
    if (this._didInit) return
    const N = GlassGfx.GLASS_RES * GlassGfx.GLASS_RES
    this._opacity = new Float32Array(N)
    this._velocity = new Float32Array(N)
    // Initialize opacities to a normal distribution around BASE_OPACITY
    const mean = GlassGfx.BASE_OPACITY
    const stddev = 0.05
    function randNorm() {
      // Box-Muller transform
      let u = 0, v = 0
      while (u === 0) u = Math.random()
      while (v === 0) v = Math.random()
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    }
    for (let i = 0; i < N; ++i) {
      this._opacity[i] = mean + stddev * randNorm()
      this._velocity[i] = 0
    }
    this._didInit = true
  }

  down(pw: PinballWizard, mousePos: Vec2) {
    // do nothing
  }

  move(pw: PinballWizard, mousePos: Vec2) {
    if (!this._opacity) return

    const mult = window.devicePixelRatio / Graphics.glassPixelScale
    const x = Math.floor(mousePos[0] * mult)
    const y = Math.floor(mousePos[1] * mult)

    const N = GlassGfx.GLASS_RES
    // Interpolate between left and right opacity values for smooth scroll
    const xL = (x + Math.floor(this._xOffset)) % N
    const iL = ((y + Math.floor(this._yOffset)) % N) * N + xL
    this._opacity[iL] = 1
  }

  leave(pw: PinballWizard, mousePos: Vec2) {
    // do nothing
  }

  up(pw: PinballWizard, mousePos: Vec2) {
    // do nothing
  }

  protected _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    this._initArrays()
    if (!this._opacity) return
    // Draw the low-res opacity field to the offscreen canvas using fillRect
    const N = GlassGfx.GLASS_RES
    const size = 1 // each pixel is 1x1 on the offscreen canvas
    ctx.clearRect(0, 0, N, N)
    ctx.fillStyle = 'black'
    ctx.globalCompositeOperation = 'source-over'
    const xOffsetInt = Math.floor(this._xOffset)
    const xOffsetFrac = this._xOffset - xOffsetInt
    const yOffsetInt = Math.floor(this._yOffset)
    const yOffsetFrac = this._yOffset - yOffsetInt
    for (let y = 0; y < N; ++y) {
      for (let x = 0; x < N; ++x) {
        // Bilinear interpolation between 4 neighbors
        const xL = (x + xOffsetInt) % N
        const xR = (xL + 1) % N
        const yT = (y + yOffsetInt) % N
        const yB = (yT + 1) % N
        const iLT = yT * N + xL
        const iRT = yT * N + xR
        const iLB = yB * N + xL
        const iRB = yB * N + xR
        const opLT = this._opacity[iLT]
        const opRT = this._opacity[iRT]
        const opLB = this._opacity[iLB]
        const opRB = this._opacity[iRB]
        // Interpolate horizontally
        const opT = opLT * (1 - xOffsetFrac) + opRT * xOffsetFrac
        const opB = opLB * (1 - xOffsetFrac) + opRB * xOffsetFrac
        // Interpolate vertically
        const interpOp = opT * (1 - yOffsetFrac) + opB * yOffsetFrac
        const alpha = Math.max(0, Math.min(1, interpOp * Graphics.pixelAnim))
        if (alpha > 0) {
          ctx.globalAlpha = alpha * 0.5
          ctx.fillRect(x - 0.5, y - 0.5, size, size)
        }
      }
    }
    ctx.globalAlpha = 1.0
  }

  /**
   * Update the glass simulation. Call this regularly with dt in seconds.
   */
  update(dt: number) {
    this._initArrays()
    // Advance the x and y offsets for scrolling
    this._xOffset = (this._xOffset + dt * GlassGfx.X_SCROLL_RATE) % GlassGfx.GLASS_RES
    this._yAnimOffset = (this._yAnimOffset + dt * GlassGfx.Y_SCROLL_RATE) % GlassGfx.GLASS_RES

    // update physics
    const op = this._opacity
    const vel = this._velocity
    if (!op || !vel) return
    const N = GlassGfx.GLASS_RES
    const K = GlassGfx.SPRING_K
    const D = GlassGfx.DAMPING
    const MASS = GlassGfx.MASS
    const DIAG = GlassGfx.DIAG_SPRING_RATIO
    const BASE = GlassGfx.BASE_OPACITY
    const BASE_K = GlassGfx.BASE_SPRING_K
    // For each pixel, sum spring forces from 8 neighbors and base value
    for (let y = 0; y < N; ++y) {
      for (let x = 0; x < N; ++x) {
        const i = y * N + x
        let force = 0
        // 4 direct neighbors
        if (x > 0) force += K * (op[i - 1] - op[i])
        if (x < N - 1) force += K * (op[i + 1] - op[i])
        if (y > 0) force += K * (op[i - N] - op[i])
        if (y < N - 1) force += K * (op[i + N] - op[i])
        // 4 diagonal neighbors (weaker)
        if (x > 0 && y > 0) force += DIAG * K * (op[i - N - 1] - op[i])
        if (x < N - 1 && y > 0) force += DIAG * K * (op[i - N + 1] - op[i])
        if (x > 0 && y < N - 1) force += DIAG * K * (op[i + N - 1] - op[i])
        if (x < N - 1 && y < N - 1) force += DIAG * K * (op[i + N + 1] - op[i])
        // Spring to base opacity
        force += BASE_K * (BASE - op[i])
        // Damping
        force -= D * vel[i]
        // Integrate velocity and position
        vel[i] += (force / MASS) * dt
      }
    }
    // Integrate position (opacity)
    for (let i = 0; i < N * N; ++i) {
      op[i] += vel[i] * dt
      // // Clamp for stability
      // if (op[i] < 0) { op[i] = 0; vel[i] = 0 }
      // if (op[i] > 1) { op[i] = 1; vel[i] = 0 }
    }
  }
}
