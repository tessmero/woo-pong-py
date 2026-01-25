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


[[907552,2037406,219,92],[73820,3091343,-357,566],[114857,1822748,198,1088],[214043,2404178,-1685,1540],[405947,3387639,1548,1250],[377051,3129401,290,1276],[302488,2940958,1421,-1028],[201998,3125907,290,-378],[707600,3076473,317,-1091],[131760,932992,192,145]]

`.replace(/\s/g, '') // remove whitespace

const expectedFinalSnapshots: Record<(typeof BRANCH_SEEDS)[number], string> = {
  246810: `

[[918298,2023349,203,93],[213787,4534197,-541,-6],[519609,3958346,-948,-614],[441102,4716060,-988,-137],[153990,3718800,-67,-1508],[822230,4311893,647,331],[863476,2974753,-298,-11],[603766,4279104,-912,573],[935351,4234779,-211,-44],[319893,3089872,-801,49]]


`.replace(/\s/g, ''),

  481632: `

[[834252,4583181,-1194,-620],[127267,4214628,93,1578],[478463,2159856,-497,55],[808705,2853997,-388,530],[115036,4685226,-282,1242],[501128,4707091,-1104,315],[134459,5096346,-1245,112],[122764,4561324,-190,318],[477443,2550621,-448,-59],[365838,2893734,-824,372]]

`.replace(/\s/g, ''),
}
