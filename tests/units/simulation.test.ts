/**
 * @file simulation.test.ts
 *
 * Assert that simulation is deterministic.
 */

import { Simulation } from '../../src/simulation/simulation'
import { equal } from 'assert'

const sim = new Simulation()
const stepCount = 1e7

describe('dterministic simulation', function () {
  it(`has expected state after ${stepCount.toExponential()} steps`, function () {
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

// disks x,y,vx,vy
const expectedSnapshot = `
[[460603,156379,-579,2892],[607504,868648,374,3268],
[547269,186337,-1718,-454],[183178,640974,-221,2056],
[398591,344287,-2288,686],[274086,164753,2291,2100],
[434560,560371,-3389,1138],[243400,250990,-4086,2096],
[581577,618261,5273,1402],[721587,414291,-583,813],
[752188,516319,5469,809],[721612,775285,5288,-2541],
[167759,448718,-265,1415],[522232,271075,-592,-2056],
[191820,133329,-2215,-3060],[236947,440480,-851,-1499],
[849725,189409,2952,2506],[807603,793197,-706,-571],
[592041,709670,-1945,44],[428448,274011,-967,98]]
`.replace(/\s/g, '') // remove whitespace
