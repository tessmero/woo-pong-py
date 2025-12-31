/**
 * @file simulation.test.ts
 *
 * Assert that simulation is deterministic.
 */

import { Simulation } from '../../src/simulation/simulation'
import { equal } from 'assert'
import { DiskDiskLut } from '../../src/simulation/luts/imp/disk-disk-lut'
import { Lut } from '../../src/simulation/luts/lut'

// excuse to import disk-disk-lut and have it registered
const _thing = DiskDiskLut

const sim = new Simulation()
const stepCount = 1e3

describe('deterministic simulation', function () {
  // before(async function () {
  //   const blobPath = join(__dirname, '../../public/collisions/disk-disk.bin')
  //   const blobData = new Int16Array(readFileSync(blobPath).buffer)
  //   Collisions.loadFromBlob(blobData)
  // })

  it(`has expected state after ${stepCount.toExponential()} steps`, async function () {
    const lut = Lut.create('disk-disk-lut')
    lut.computeAll()

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

[[700000,437500,500,-500],[700000,505500,500,-700],[700000,569300,500,-500],[700000,641300,500,-500],[700000,712662,500,-518],[770000,436500,490,-495],[770000,505500,490,-695],[770000,570300,490,-495],[770000,642300,490,-495],[770000,712432,490,-517],[834600,437500,-420,-490],[834600,503300,-420,-690],[834732,568712,-398,-588],[836000,641300,-320,-490],[834732,709224,-398,-616],[892900,436500,470,-485],[892900,503300,470,-685],[892768,570888,448,-387],[892050,637850,392,-583],[892768,710688,448,-417],[957620,435500,-440,-480],[957620,501300,-440,-680],[957620,569300,-440,-480],[958126,643750,-418,-382],[957620,707228,-440,-516]]

`.replace(/\s/g, '') // remove whitespace
