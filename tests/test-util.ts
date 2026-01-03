/**
 * @file test-util.ts
 *
 * Test util.
 */

import { LutName } from '../src/imp-names'
import { LUT_BLOBS } from '../src/set-by-build'
import { offsetDetail, speedDetail } from '../src/simulation/luts/imp/disk-disk-lut'
import { Tree } from '../src/simulation/luts/lut'
import { ShapeName } from '../src/simulation/shapes'

const obsOffsetDetail = 100 // half size of cache along dx and dy

// generate random lookup key in disk-disk coliision data
const nOffsets = 2 * offsetDetail + 1
const nSpeeds = 2 * speedDetail + 1
function randomDiskDiskIndex() {
  return [
    Math.floor(nOffsets * Math.random()),
    Math.floor(nOffsets * Math.random()),
    Math.floor(nSpeeds * Math.random()),
    Math.floor(nSpeeds * Math.random()),
  ]
}

const nObsOffsets = 2 * obsOffsetDetail + 1
function randomObstacleOffsetIndex() {
  return [
    Math.floor(nObsOffsets * Math.random()),
    Math.floor(nObsOffsets * Math.random()),
  ]
}

type LutSpec = {
  lutName: LutName
  shapeName?: ShapeName
  blobUrl: string
  indexer: () => Array<number>
}

export const lutSpecs: Array<LutSpec> = [
  {
    lutName: 'disk-disk-lut',
    blobUrl: LUT_BLOBS.DISK_DISK_LUT.url,
    indexer: randomDiskDiskIndex,
  },
  {
    lutName: 'obstacle-lut',
    shapeName: 'circle',
    blobUrl: LUT_BLOBS.CIRCLE.url,
    indexer: randomObstacleOffsetIndex,
  },
]

export function lookupIndex(tree: Tree<any>, index: Array<number>): Array<number> {
  if (index.length === 1) {
    return tree[index[0]]
  }
  return lookupIndex(tree[index[0]], index.slice(1))
}
