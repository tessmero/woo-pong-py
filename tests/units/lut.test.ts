/**
 * @file lut.test.ts
 *
 * Test lookup table base class.
 */

import { equal } from 'assert'
import { allIndices, Lut, RegisteredLut } from '../../src/simulation/luts/lut'

const reg: RegisteredLut<any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  depth: 4,
  detail: [10, 10, 10, 10],
  factory: () => ({}) as Lut<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  blobUrl: '',
  blobHash: '',
}

describe(`Lut allIndices`, function () {
  it(`returns unique indices`, function () {
    const unique = new Set()
    for (const index of allIndices(reg)) {
      const json = JSON.stringify(index)
      unique.add(json)
    }
    equal(unique.size, 1e4, 'should have 1000 unique indices')
  })
})
