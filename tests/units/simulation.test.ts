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
import { SorterRoom } from '../../src/rooms/imp/sorter-room'

// excuse to import luts and have them registered
const _luts = [
  DiskDiskLut, ObstacleLut, DiskNormalLut, DiskFrictionLut, RaceLut,
]
const _rooms = [
  BasicRoom, PongRoom, BreakoutRoom, SorterRoom,
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



[[342940,3283317,180,-758],[960000,1047379,-810,121],[59800,1042708,360,614],[790470,781061,325,-123],[176987,677588,-310,677],[120820,1328400,180,720],[512217,457848,-107,82],[749130,455182,-90,37],[57100,2297829,450,-702],[258540,1615465,-180,685]]



`.replace(/\s/g, '') // remove whitespace
