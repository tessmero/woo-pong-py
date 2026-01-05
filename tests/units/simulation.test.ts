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

const sim = new Simulation(0)
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

[[355003,105027,500,507],[354997,145041,499,511],[394911,105092,493,514],[394902,145098,489,516]]


`.replace(/\s/g, '') // remove whitespace
