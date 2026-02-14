/**
 * @file gas-box.ts
 *
 * A miniature simulation of non-colliding particles inside a bounding
 * rectangle. Holds one or two GasBoxSim instances and manages a gradual
 * visual transition between them.
 */

import { VALUE_SCALE } from './constants'
import { GAS_BOX_HEIGHT, GAS_BOX_SOLVE_STEPS, GAS_BOX_WIDTH, N_GAS_BOX_PARTICLES } from './gas-box-constants'
import { GasBoxSim } from './gas-box-sim'
import type { Rectangle, Vec2 } from 'util/math-util'


export class GasBox {
  /** Bounding rectangle in sim-units [x, y, w, h]. */
  readonly boundingRect: Rectangle

  /** The first (and initially only) particle simulation. */
  readonly initialSim: GasBoxSim

  /** The second simulation, set later via setFinalSimulation(). */
  private _finalSim: GasBoxSim | null = null
  get finalSim(): GasBoxSim | null { return this._finalSim }

  /**
   * Per-particle flag for the initial sim.
   * `true` means the particle has been retired (hidden) during transition.
   */
  readonly initialRetired: Array<boolean>

  /**
   * Per-particle flag for the final sim.
   * `true` means the particle has been activated (visible) during transition.
   */
  finalActive: Array<boolean> = []

  private _transitionStep = 0
  get isTransitioning(): boolean { return this._finalSim !== null }

  isVisible = true

  constructor(
    public readonly pos: Vec2,
  ) {
    this.boundingRect = [
      pos[0] - GAS_BOX_WIDTH/2,
      pos[1] - GAS_BOX_HEIGHT/2,
      GAS_BOX_WIDTH, GAS_BOX_HEIGHT,
    ]
    this.initialSim = new GasBoxSim()
    this.initialRetired = new Array(N_GAS_BOX_PARTICLES).fill(false)

    // // test final sim
    // this.setFinalSimulation(new GasBoxSim())
  }

  /**
   * Begin a gradual transition to a second simulation. Over
   * TRANSITION_STEPS steps, initial-sim particles that wrap at an edge
   * are retired and final-sim particles that wrap are activated, so the
   * swap is hard to notice.
   */
  setFinalSimulation(finalSim: GasBoxSim) {
    if( this._finalSim ) return

    this._finalSim = finalSim
    this._transitionStep = 0
    this.finalActive = new Array(finalSim.count).fill(false)
  }

  /** Advance all active simulations by one step. */
  step() {

    // always step the initial sim
    this.initialSim.step()

    if (this._finalSim) {
      this._finalSim.step(true)
    }

    // during the transition, swap eligible particles at edges
    if (this._finalSim) {
      this._transitionStep++

      // the eligible index threshold ramps from 0 to particleCount over
      // TRANSITION_STEPS, so more particles become swap-eligible over time.
      const initCount = this.initialSim.count
      const finalCount = this._finalSim.count
      const progress = Math.min(this._transitionStep / GAS_BOX_SOLVE_STEPS, 1)

      

      const eligibleInitial = Math.floor(progress * initCount)
      const eligibleFinal = Math.floor(progress * finalCount)

      // if( eligibleFinal % 100 === 0 ){
      //   console.log('gas box eligible final', eligibleFinal)
      // }
      
      
      // retire initial particles that just wrapped and are eligible
      for (let i = 0; i < eligibleInitial; i++) {
        if (this.initialSim.wrapped[i] && !this.initialRetired[i]) {
          this.initialRetired[i] = true
        }
      }

      // activate final particles that just wrapped and are eligible
      for (let i = 0; i < eligibleFinal; i++) {
        if (this._finalSim.wrapped[i] && !this.finalActive[i]) {
          this.finalActive[i] = true
        }
      }
    }
  }
}
