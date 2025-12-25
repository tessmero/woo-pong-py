/**
 * @file simulation.test.ts
 *
 * Assert that simulation is deterministic.
 */

import { Collisions } from '../../src/simulation/collisions'
import { Simulation } from '../../src/simulation/simulation'
import { equal } from 'assert'

const sim = new Simulation()
const stepCount = 1e7

describe('deterministic simulation', function () {
  it(`has expected state after ${stepCount.toExponential()} steps`, function () {
    for (let i = 0; i < stepCount; i++) sim.step()
    const actualSnapshot = getSnapshot()
    equal(actualSnapshot, expectedSnapshot)
  })
})

function getSnapshot(): string {
  return JSON.stringify(sim.disks.map(disk => disk.toJson()))
}

// disks x,y,vx,vy
const expectedSnapshot = `

[[2834543324,39201612821857,320,8854559],[9310339431,49145726121824,939,9914204],[-1926152958,49282071474513,-194,9927947],[-3667035506,24866258613921,-520,7052128],[1645860536,30676773942328,210,7832850],[-6224692261,49916100797633,-623,9991606],[740793,821563,-328,-2283],[3692742026,37722451829544,425,8685902],[6198290639,26576793174766,850,7290650],[6370112134,13928370365701,1207,5277948]]

`.replace(/\s/g, '') // remove whitespace
