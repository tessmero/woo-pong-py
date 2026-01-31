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



[[173654,1661701,-296,697],[766650,2730022,4,1509],[339582,1639070,-440,104],[401850,1628795,-205,547],[949770,1970524,-300,199],[918870,2432589,988,-574],[616385,2856614,-123,-467],[749271,1442527,-665,210],[87648,1696449,405,1092],[324285,1000264,660,-494]]



`.replace(/\s/g, '') // remove whitespace

const expectedFinalSnapshots: Record<(typeof BRANCH_SEEDS)[number], string> = {
  246810: `


  [[213553,4184999,1089,-1303],[943541,4588518,-1096,366],[734220,3215827,-126,-1050],[769594,4129922,786,776],[793286,3772909,201,1239],[685411,4162975,-1107,-366],[925869,3976804,-700,1032],[244881,3163516,1393,207],[804619,3178793,-738,-51],[315185,2112144,162,785]]



`.replace(/\s/g, ''),

  481632: `


[[462683,3906660,-520,72],[665561,4472103,-247,1747],[202542,2368975,-64,-970],[663402,2838392,488,-226],[592420,3191104,760,317],[271329,3629806,911,529],[621945,3083112,760,-316],[343007,3903123,-151,-1470],[90618,4208352,195,-179],[545098,2672946,122,1348]]



`.replace(/\s/g, ''),
}
