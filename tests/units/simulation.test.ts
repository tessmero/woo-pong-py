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

// GFX_REGION imports and placeholder variable
import { SimGfx } from '../../src/gfx/imp/sim-gfx'
import { ScrollbarGfx } from '../../src/gfx/imp/scrollbar-gfx'
import { BottomBarGfx } from '../../src/gfx/imp/bottom-bar-gfx'
import { TopBarGfx } from '../../src/gfx/imp/top-bar-gfx'
import { GlassGfx } from '../../src/gfx/imp/glass-gfx'

const _gfxRegions = [
  SimGfx, ScrollbarGfx, BottomBarGfx, TopBarGfx, GlassGfx,
]

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

/* eslint-disable max-len */
// disks x,y,vx,vy
const expectedSnapshot = `


[[567189,925408,-447,-378],[431737,1348729,-244,235],[883874,980981,-591,-23],[767883,1187792,944,108],[597332,970549,-716,-633],[481272,1474620,-92,-1019],[373823,1168082,-634,-155],[364699,1381075,1004,-151],[322673,979911,524,552],[112552,1246835,115,86]]



`.replace(/\s/g, '') // remove whitespace
