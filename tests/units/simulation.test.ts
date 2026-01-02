/**
 * @file simulation.test.ts
 *
 * Assert that simulation is deterministic.
 */

import { Simulation } from '../../src/simulation/simulation'
import { equal } from 'assert'
import { Lut } from '../../src/simulation/luts/lut'
import { LUT } from '../../src/imp-names'

const sim = new Simulation()
const stepCount = 1e1

describe('deterministic simulation', function () {
  // before(async function () {
  //   const blobPath = join(__dirname, '../../public/luts/disk-disk.bin')
  //   const blobData = new Int16Array(readFileSync(blobPath).buffer)
  //   Collisions.loadFromBlob(blobData)
  // })

  it(`has expected state after ${stepCount.toExponential()} steps`, async function () {
    for (const name of LUT.NAMES) Lut.create(name).computeAll()
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

[[374253,888327,-686,238],[181680,559830,580,-1110],[222652,780726,-148,-1026],[271170,593172,-154,-828],[304929,870862,-38,-128],[617740,252371,265,164],[628696,942240,269,422],[301622,731212,-331,-331],[348915,767110,33,-673],[695943,945016,52,1045],[610118,533275,169,594],[714956.5325889132,511888.06234380207,-716.2760325606096,-608.3907338750873],[379532.9774391,519660.3215222244,-129.49996501152833,414.0380903146516],[591425,666679,-312,-511],[766723,937078,-505,-934],[812132,372972,92,-408],[783815,678572,61,104],[689293,656002,-1323,-878],[716137.3340953079,833021.7701751736,-479.3244788730717,-280.6022602217572],[901045.1019957578,884601.1727620838,67.68610199578006,-224.3031560821812],[887538,650779,-679,430],[619152,735923,-952,-116],[876168,715639,-156,-839],[955188.8674961249,949559.099263353,-928.5005761037846,520.3943962704848],[779680.8749772322,839580.3911378785,-252.47637911010406,-268.0817247957584]]



`.replace(/\s/g, '') // remove whitespace
