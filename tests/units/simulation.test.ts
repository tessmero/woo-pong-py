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

const sim = new Simulation()
const stepCount = 1e1

describe('deterministic simulation', function () {
  // before(async function () {
  //   const blobPath = join(__dirname, '../../public/luts/disk-disk.bin')
  //   const blobData = new Int16Array(readFileSync(blobPath).buffer)
  //   Collisions.loadFromBlob(blobData)
  // })

  it(`has expected state after ${stepCount.toExponential()} steps`, async function () {
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
    for (let i = 0; i < stepCount; i++) sim.step()
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


[[205000,205045,500,510],[205000,285045,500,510],[205000,365045,500,510],[205000,445045,500,510],[205000,525045,500,510],[284900,205095,490,515],[284900,285095,490,515],[284900,365095,490,515],[284900,445095,490,515],[284900,525095,490,515],[364800,205145,480,520],[364800,285145,480,520],[364800,365145,480,520],[364800,445145,480,520],[364800,525145,480,520],[444700,205195,470,525],[444700,285195,470,525],[444700,365195,470,525],[444700,445195,470,525],[444700,525195,470,525],[524600,205245,460,530],[524600,285245,460,530],[524600,365245,460,530],[524600,445245,460,530],[524600,525245,460,530]]



`.replace(/\s/g, '') // remove whitespace
