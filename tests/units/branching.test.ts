/**
 * @file branching.test.ts
 *
 * Run simulation with different PRNG seeds
 * injected halfway through.
 */

import { Simulation } from '../../src/simulation/simulation'
import { equal } from 'assert'
import { Lut } from '../../src/simulation/luts/lut'
import { LUT } from '../../src/imp-names'
import { SHAPE_NAMES } from '../../src/simulation/shapes'
import { STEPS_BEFORE_BRANCH } from '../../src/simulation/constants'

const halfStepCount = STEPS_BEFORE_BRANCH
let sim: Simulation

const COMMON_START_SEED = 123456
const BRANCH_SEEDS = [
  246810,
  481632,
] as const

describe('branching deterministic simulation', function () {
  // before(async function () {
  //   const blobPath = join(__dirname, '../../public/luts/disk-disk.bin')
  //   const blobData = new Int16Array(readFileSync(blobPath).buffer)
  //   Collisions.loadFromBlob(blobData)
  // })

  it(`has expected midstate and final state`, async function () {
    // init simulation
    for (const name of LUT.NAMES) {
      if (name === 'race-lut') continue
      if (name === 'obstacle-lut') {
        for (const shape of SHAPE_NAMES) {
          const lut = Lut.create(name, shape)
          lut.computeAll()
        }
      }
      else {
        Lut.create(name).computeAll()
      }
    }

    for (const [_branchIndex, branchSeed] of BRANCH_SEEDS.entries()) {
      // run common first half simulation
      sim = new Simulation(COMMON_START_SEED)
      sim.branchSeed = branchSeed

      for (let i = 0; i < halfStepCount; i++) sim.step()

      // check mid state of simulation
      const actualMidSnapshot = getSnapshot()
      equal(actualMidSnapshot, expectedMidSnapshot,
        'should have common midpoint snapshot just before branching',
      )

      // start distinct branch for second half of simulation
      // Perturbations.setSeed(branchSeed) // correct seed
      // Perturbations.setSeed(666) // wrong seed
      for (let i = 0; i < halfStepCount; i++) sim.step()

      // check final state of simulation
      const actualFinalSnapshot = getSnapshot()
      const expectedFinalSnapshot = expectedFinalSnapshots[branchSeed]
      equal(actualFinalSnapshot, expectedFinalSnapshot,
        `should have expected final snapshot unique to branch seed ${branchSeed}`,
      )
    }
  })
})

function getSnapshot(): string {
  return JSON.stringify(sim.disks.map((disk) => {
    const json = disk.toJson()
    for (const value of json) {
      if (Math.floor(value) !== value) {
        throw new Error(`position and velocity values should be integers: ${json}`)
      }
    }
    return json
  }))
}

// disks x,y,vx,vy
const expectedMidSnapshot = `


[[329953,228138,674,-210],[520363,363598,631,237],[612497,114520,-57,497],[458950,84615,-578,347]]


`.replace(/\s/g, '') // remove whitespace

const expectedFinalSnapshots: Record<(typeof BRANCH_SEEDS)[number], string> = {
  246810: `


[[363041,511411,-676,787],[406663,345964,627,-147],[499926,305886,-874,-410],[453387,625851,-343,1009]]


`.replace(/\s/g, ''),
  481632: `


  [[380777,504880,-678,756],[430221,682560,663,-901],[423158,443910,-1182,-5],[663428,484407,176,-632]]


`.replace(/\s/g, ''),
}
