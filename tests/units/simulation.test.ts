/**
 * @file simulation.test.ts
 *
 * Assert that simulation is deterministic.
 */

import { DiskDiskCollisions } from '../../src/simulation/disk-disk-collisions'
import { Simulation } from '../../src/simulation/simulation'
import { equal } from 'assert'
import { readFileSync } from 'fs'
import { join } from 'path'

const sim = new Simulation()
const stepCount = 1e7

describe('deterministic simulation', function () {
  // before(async function () {
  //   const blobPath = join(__dirname, '../../public/collisions/disk-disk.bin')
  //   const blobData = new Int16Array(readFileSync(blobPath).buffer)
  //   Collisions.loadFromBlob(blobData)
  // })

  it(`has expected state after ${stepCount.toExponential()} steps`, async function () {
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

[[-687355686,307686002,-175,77],[480436,450395,-269,127],[779629,14642,297,248],[270945468,-1100292215,96,-392],[2597667115,-1151145276,440,-196],[1345917237,-5946436523,157,-695],[628692,545634,-458,-21],[513920,680480,-374,688],[289064,806839,-517,336],[68470,979547,-117,369],[1466818088,-5061278225,188,-650],[-1235667311,928083166,-272,203],[211780,69202,116,542],[660257,285866,-402,292],[1105006391,-1061193305,152,-147],[-1681766592,540243845,-209,66],[-8248977447,3104755354,-909,341],[-394115600,-490215042,-265,-330],[555811,931060,272,221],[592880,302538,-340,555],[1959433763,3482250377,256,454],[857835,985601,-441,226],[208050,486479,152,71],[-251790219,-1346190606,-77,-412],[704549,550530,-200,341]]

`.replace(/\s/g, '') // remove whitespace
