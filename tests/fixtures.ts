/**
 * @file fixtures.ts
 *
 * Global test setup required in .mocharc.json.
 */

import { JSDOM } from 'jsdom'
import { Image } from 'canvas'
import * as mocha from 'mocha'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { Collisions } from '../src/simulation/collisions'
import { readFileSync } from 'fs';
import { join } from 'path';


RuleTester.afterAll = mocha.after

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  resources: 'usable',
})

// @ts-expect-error assign window
global.window = dom.window
global.document = dom.window.document

/* eslint-disable @typescript-eslint/no-explicit-any */
global.Image = Image as any

const blobPath = join(__dirname, '../public/collisions/collision-cache.bin');
const blobData = new Int16Array(readFileSync(blobPath).buffer);
Collisions.loadFromBlob(blobData);
