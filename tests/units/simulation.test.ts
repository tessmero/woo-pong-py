/**
 * @file simulation.test.ts
 *
 * Assert that simulation is deterministic.
 */

import { Simulation } from '../../src/simulation/simulation'
import { equal } from 'assert'
import { Lut } from '../../src/simulation/luts/lut'
import { LUT } from '../../src/imp-names'
import { SHAPE_NAMES } from '../../src/simulation/shapes'
import { Perturbations } from '../../src/simulation/perturbations'

const sim = new Simulation()
const stepCount = 1e1

describe('deterministic simulation', function () {
  // before(async function () {
  //   const blobPath = join(__dirname, '../../public/luts/disk-disk.bin')
  //   const blobData = new Int16Array(readFileSync(blobPath).buffer)
  //   Collisions.loadFromBlob(blobData)
  // })

  it(`has expected state after ${stepCount.toExponential()} steps`, async function () {
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

    // run simulation
    Perturbations.setSeed(12345) // correct seed
    // Perturbations.setSeed(666) // wrong seed
    for (let i = 0; i < stepCount; i++) sim.step()

    // check final state of simulation
    const actualSnapshot = getSnapshot()
    equal(actualSnapshot, expectedSnapshot)
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

// disks x,y,vx,vy
const expectedSnapshot = `

[[205011,205042,501,509],[205006,285044,499,509],[205001,365061,500,511],[205011,445041,502,510],[205003,525047,499,510],[284912,205077,492,512],[284913,285106,491,516],[284885,365091,488,513],[284888,445080,488,511],[284890,525098,487,515],[364799,205138,481,518],[364801,285132,479,515],[364788,365142,479,518],[364802,445132,480,519],[364802,525131,481,518],[444691,205195,469,525],[444699,285200,471,526],[444706,365187,471,524],[444687,445193,468,525],[444716,525201,474,526],[524591,205231,457,528],[524597,285245,458,530],[524593,365260,457,532],[524591,445239,458,529],[524605,525256,463,532]]


`.replace(/\s/g, '') // remove whitespace
