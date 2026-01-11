/**
 * @file fixtures.ts
 *
 * Global test setup required in .mocharc.json.
 */

import { JSDOM } from 'jsdom'
import { Image } from 'canvas'
import * as mocha from 'mocha'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { DiskDiskLut } from '../src/simulation/luts/imp/disk-disk-lut'
import { DiskFrictionLut } from '../src/simulation/luts/imp/disk-friction-lut'
import { ObstacleLut } from '../src/simulation/luts/imp/obstacle-lut'
import { DiskNormalLut } from '../src/simulation/luts/imp/disk-normal-lut'
import { RaceLut } from '../src/simulation/luts/imp/race-lut'

// excuse to import luts and have them registered
const _luts = [
  DiskDiskLut, ObstacleLut, DiskNormalLut, DiskFrictionLut, RaceLut,
]


RuleTester.afterAll = mocha.after

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  resources: 'usable',
})

// @ts-expect-error assign window
global.window = dom.window
global.document = dom.window.document

/* eslint-disable @typescript-eslint/no-explicit-any */
global.Image = Image as any

// const blobPath = join(__dirname, `../public/${DDCOLLISION_BLOB_URL}`);
// const blobData = new Int16Array(readFileSync(blobPath).buffer);
// DiskDiskCollisions.loadFromBlob(blobData);
