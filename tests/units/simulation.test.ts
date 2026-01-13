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
import { assertDisksInBounds } from '../test-util'

import { DiskDiskLut } from '../../src/simulation/luts/imp/disk-disk-lut'
import { ObstacleLut } from '../../src/simulation/luts/imp/obstacle-lut'
import { DiskNormalLut } from '../../src/simulation/luts/imp/disk-normal-lut'
import { DiskFrictionLut } from '../../src/simulation/luts/imp/disk-friction-lut'
import { RaceLut } from '../../src/simulation/luts/imp/race-lut'

import { BasicRoom } from '../../src/rooms/imp/basic-room'
import { PongRoom } from '../../src/rooms/imp/pong-room'
import { BreakoutRoom } from '../../src/rooms/imp/breakout-room'
import { StartRoom } from '../../src/rooms/imp/start-room'
import { FinishRoom } from '../../src/rooms/imp/finish-room'

// excuse to import luts and have them registered
const _luts = [
  DiskDiskLut, ObstacleLut, DiskNormalLut, DiskFrictionLut, RaceLut,
]
const _rooms = [
  BasicRoom, PongRoom, BreakoutRoom, StartRoom, FinishRoom,
]


const sim = new Simulation(0)
const stepCount = 5e3

describe('deterministic simulation', function () {
  // before(async function () {
  //   const blobPath = join(__dirname, '../../public/luts/disk-disk.bin')
  //   const blobData = new Int16Array(readFileSync(blobPath).buffer)
  //   Collisions.loadFromBlob(blobData)
  // })

  it(`has expected state after ${stepCount.toExponential()} steps`, async function () {
    // init simulation
    for (const name of LUT.NAMES) {
      if (name === 'race-lut') continue
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
    for (let i = 0; i < stepCount; i++) {
      sim.step()
      assertDisksInBounds(sim)
    }

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


[[283547,852381,-67,433],[238288,1728977,891,-818],[346109,975473,185,-112],[280002,976171,-651,-40],[284221,2803483,1095,1343],[507681,2329041,-1494,-226],[283226,507074,184,850],[115406,1482584,104,1241],[513142,2516855,179,1339],[260916,1502699,302,317]]


`.replace(/\s/g, '') // remove whitespace
