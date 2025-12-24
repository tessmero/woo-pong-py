/**
 * @file simulation.test.ts
 *
 * Assert that simulation is deterministic.
 */

import { Simulation } from '../../src/simulation/simulation'
import { equal } from 'assert'

const sim = new Simulation()
const stepCount = 10000

describe('dterministic simulation', function () {
  it(`has expected state after ${stepCount} steps`, function () {
    for (let i = 0; i < stepCount; i++) {
      sim.step()
    }
    const actualSnapshot = getSnapshot()
    equal(actualSnapshot, expectedSnapshot)
  })
})

function getSnapshot(): string {
  return JSON.stringify(sim.disks.map(disk => disk.toJson()))
}

const expectedSnapshot = `[[59,70,-2,-1]]` // disks x,y,vx,vy
