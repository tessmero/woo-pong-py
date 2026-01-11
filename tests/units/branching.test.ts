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

// disks x,y,vx,vy
const expectedMidSnapshot = `


[[250000,254950,500,600],[250000,354950,500,600],[349000,255450,490,605],[349000,355450,490,605],[448000,255950,480,610],[448000,355950,480,610],[547000,256450,470,615],[547000,356450,470,615],[646000,256950,460,620],[646000,356950,460,620]]



`.replace(/\s/g, '') // remove whitespace

const expectedFinalSnapshots: Record<(typeof BRANCH_SEEDS)[number], string> = {
  246810: `


[[300000,319900,500,700],[300000,419900,500,700],[398000,320900,490,705],[398000,420900,490,705],[496000,321900,480,710],[496000,421900,480,710],[594000,322900,470,715],[594000,422900,470,715],[692000,323900,460,720],[692000,423900,460,720]]



`.replace(/\s/g, ''),
  481632: `


  
[[300000,319900,500,700],[300000,419900,500,700],[398000,320900,490,705],[398000,420900,490,705],[496000,321900,480,710],[496000,421900,480,710],[594000,322900,470,715],[594000,422900,470,715],[692000,323900,460,720],[692000,423900,460,720]]



`.replace(/\s/g, ''),
}
