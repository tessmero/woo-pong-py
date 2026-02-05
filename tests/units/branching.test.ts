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


[[557510,1058500,-10,316],[551017,1990899,444,978],[85413,1879824,-424,-832],[895221,2744290,850,882],[880137,2343633,-416,-312],[649163,2108346,-1001,472],[544806,2152073,337,383],[450035,2145808,244,1069],[412037,2723001,1381,602],[692282,2339946,336,160]]


`.replace(/\s/g, '') // remove whitespace

const expectedFinalSnapshots: Record<(typeof BRANCH_SEEDS)[number], string> = {
  246810: `


[[516617,1827264,386,-626],[946897,4011424,815,-460],[314439,2977499,894,304],[359275,3905285,-1058,374],[933020,3815307,-498,1205],[422507,4629221,-469,2253],[665956,4078831,-774,210],[508467,3769158,822,472],[264426,3163218,-841,441],[524189,3268659,658,76]]



`.replace(/\s/g, ''),

  481632: `


  [[306522,2376766,726,1303],[226993,4302710,104,57],[505914,4306298,394,273],[508769,4195828,-128,428],[108008,3024627,1004,-192],[750392,4236986,-3,-76],[627413,4107388,-488,-878],[921462,4880255,554,834],[895261,2376352,-591,603],[252284,4650685,1391,-139]]


`.replace(/\s/g, ''),
}
