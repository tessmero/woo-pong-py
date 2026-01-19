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
import { assertDisksInBounds } from '../test-util'

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

      for (let i = 0; i < halfStepCount; i++) {
        sim.step()
        assertDisksInBounds(sim)
      }

      // check mid state of simulation
      const actualMidSnapshot = getSnapshot()
      equal(actualMidSnapshot, expectedMidSnapshot,
        'should have common midpoint snapshot just before branching',
      )

      // start distinct branch for second half of simulation
      // Perturbations.setSeed(branchSeed) // correct seed
      // Perturbations.setSeed(666) // wrong seed
      for (let i = 0; i < halfStepCount; i++) {
        sim.step()
        assertDisksInBounds(sim)
      }

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

/* eslint-disable max-len */
// disks x,y,vx,vy
const expectedMidSnapshot = `


[[670751,2528066,-29,-258],[496404,1369005,-824,-131],[812432,2537243,679,-557],[229066,3570861,159,-1830],[522173,1216813,-411,233],[696909,2584923,380,-16],[722300,1847341,120,525],[929938,2363320,-999,-81],[723751,1467765,-572,-278],[516576,3089742,1941,-1060]]


`.replace(/\s/g, '') // remove whitespace

const expectedFinalSnapshots: Record<(typeof BRANCH_SEEDS)[number], string> = {
  246810: `


[[431609,3640330,-30,407],[52223,3641965,97,-341],[484147,3113801,179,-97],[888040,3183348,604,379],[336933,2075934,-245,-966],[330773,4020142,-747,-82],[771303,3772430,112,-885],[906898,3095539,346,-519],[109832,2089929,-1007,-475],[320654,4258809,118,-1116]]



`.replace(/\s/g, ''),

  481632: `


[[313427,2947377,-268,-34],[290385,3225541,416,-1],[588963,3656537,225,198],[92588,4014541,129,-529],[418637,3854233,-809,2078],[73642,3608472,403,-499],[519584,3063646,272,-337],[885109,4819909,1199,-32],[913795,1677494,1063,722],[748747,3844633,-378,399]]


`.replace(/\s/g, ''),
}
