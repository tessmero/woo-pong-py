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
import { Perturbations } from '../../src/simulation/perturbations'

const halfStepCount = 1e1
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
      if (name === 'obstacle-lut') {
        for (const shape of SHAPE_NAMES) {
          Lut.create(name, shape).computeAll()
        }
      }
      else {
        Lut.create(name).computeAll()
      }
    }

    for (const [_branchIndex, branchSeed] of BRANCH_SEEDS.entries()) {
    // run common first half simulation
      Perturbations.setSeed(COMMON_START_SEED) // correct seed
      // Perturbations.setSeed(666) // wrong seed
      sim = new Simulation()
      for (let i = 0; i < halfStepCount; i++) sim.step()

      // check mid state of simulation
      const actualMidSnapshot = getSnapshot()
      equal(actualMidSnapshot, expectedMidSnapshot,
        'should have common midpoint snapshot just before branching',
      )

      // start distinct branch for second half of simulation
      Perturbations.setSeed(branchSeed) // correct seed
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
        throw new Error('position and velocity values should be integers')
      }
    }
    return json
  }))
}

/* eslint-disable max-len */

// disks x,y,vx,vy
const expectedMidSnapshot = `


[[205005,205035,499,508],[205009,285041,502,509],[205001,365069,501,514],[205003,445067,499,515],[204998,525050,497,510],[284908,205083,493,513],[284905,285090,492,515],[284895,365103,488,515],[284889,445104,489,518],[284901,525099,491,515],[364787,205134,477,518],[364810,285141,482,520],[364775,365155,478,522],[364811,445128,481,518],[364797,525143,480,520],[444699,205194,471,522],[444692,285202,468,525],[444685,365197,468,527],[444691,445184,471,523],[444703,525194,470,525],[524608,205237,460,529],[524600,285236,461,528],[524604,365245,460,530],[524599,445246,459,530],[524604,525245,462,530]]



`.replace(/\s/g, '') // remove whitespace

const expectedFinalSnapshots: Record<(typeof BRANCH_SEEDS)[number], string> = {
  246810: `

[[209982,210160,498,518],[210027,290185,502,520],[210000,370254,500,523],[209997,450278,500,527],[209976,530198,498,520],[289832,210248,492,522],[289799,290287,487,526],[289774,370304,488,526],[289765,450322,489,526],[289823,530296,494,525],[369558,210366,476,527],[369619,290392,480,530],[369562,370412,480,532],[369615,450339,480,526],[369590,530384,480,528],[449419,210456,473,532],[449377,290501,466,536],[449377,370513,469,539],[449413,450465,473,533],[449400,530512,470,538],[529207,210551,460,536],[529219,290557,462,536],[529215,370598,462,540],[529168,450587,456,540],[529228,530583,462,540]]



`.replace(/\s/g, ''),
  481632: `


[[210000,210162,500,518],[210025,290199,500,523],[210018,370262,501,525],[209996,450260,499,524],[209959,530183,495,520],[289833,210263,492,524],[289825,290278,492,524],[289786,370308,489,527],[289758,450322,486,527],[289814,530298,492,527],[369568,210349,479,526],[369632,290394,481,530],[369554,370415,477,534],[369610,450343,479,526],[369605,530378,481,529],[449409,210465,469,535],[449390,290503,471,536],[449368,370519,465,538],[449416,450455,475,532],[449415,530481,474,533],[529223,210572,462,540],[529211,290566,460,539],[529203,370607,461,543],[529189,450579,459,538],[529204,530603,459,541]]



`.replace(/\s/g, ''),
}
