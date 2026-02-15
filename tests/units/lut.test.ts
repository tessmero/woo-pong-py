/**
 * @file lut.test.ts
 *
 * Test lookup table base class.
 */

import { equal } from 'assert'
import { allIndices, Lut, type RegisteredLut, i16 } from '../../src/simulation/luts/lut'

const schema = [i16('a'), i16('b'), i16('c'), i16('d')]
const reg: RegisteredLut = {
  depth: 4,
  schema,
  leafLength: 4,
  fieldInfo: { a: { encodedOffset: 0, type: 'i16' }, b: { encodedOffset: 1, type: 'i16' }, c: { encodedOffset: 2, type: 'i16' }, d: { encodedOffset: 3, type: 'i16' } },
  factory: () => ({}) as Lut,
}

const lut = {
  reg, detail: [10, 10, 10, 10],
} as Lut

describe(`Lut allIndices`, function () {
  it(`returns unique indices`, function () {
    const unique = new Set()
    for (const index of allIndices(lut)) {
      const json = JSON.stringify(index)
      unique.add(json)
    }
    equal(unique.size, 1e4, 'should have 1000 unique indices')
  })
})
