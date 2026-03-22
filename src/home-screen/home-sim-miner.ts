/**
 * @file home-sim-miner.ts
 *
 * Continuously runs home screen simulations in background and builds a list of
 * seeds where the selected ball wins.
 */

import { Simulation } from 'simulation/simulation'
import { homeSimStep } from './home-sim-step'

const maxStepsPerUpdate = 100 // max sim steps per live draw
const maxTimeInvestment = 3 // max ms spent mining per live draw
const maxSeeds = 1000 // maximum number of good seeds to find

let sim: Simulation | null = null

export class HomeSimMiner {
  static testSeed = 1234
  public static readonly goodSeeds: Array<number> = []

  public static update(targetWinningDiskIndex: number) {
    if (this.goodSeeds.length > maxSeeds) {
      return
    }

    if (!sim) {
      sim = new Simulation(HomeSimMiner.testSeed, true)
    }

    const startTime = performance.now()

    let steps = 0
    while (true) {
      homeSimStep(sim)
      steps++

      if (sim.winningDiskIndex !== -1) {
        console.log('home sim has winning disk')
        // one ball finished
        if (sim.winningDiskIndex === targetWinningDiskIndex) {
          // found good seed
          console.log('found good seed', HomeSimMiner.testSeed, sim.perturbations.getSeed(), sim.seedUponWinning)
          HomeSimMiner.goodSeeds.push(HomeSimMiner.testSeed)
        }
        else {
          // found bad seed
          console.log('found bad seed', HomeSimMiner.testSeed)
        }

        // advance to next seed
        HomeSimMiner.testSeed++
        sim = new Simulation(HomeSimMiner.testSeed, true)
      }

      if (steps > maxStepsPerUpdate) {
        // console.log('finished home sim miner update early', sim.disks[0].currentState.y)
        break
      }

      const elapsed = performance.now() - startTime
      if (elapsed > maxTimeInvestment) {
        break
      }
    }
  }
}
