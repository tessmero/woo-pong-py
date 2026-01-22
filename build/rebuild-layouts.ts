/**
 * @file rebuild-layouts.ts
 *
 * Rebuild layouts for obstacles in basic rooms.
 */

import { readdirSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { LutEncoder } from '../src/simulation/lut-encoder'
import { createHash } from 'crypto'
import { Lut } from '../src/simulation/luts/lut'
import { SHAPE_NAMES } from '../src/simulation/shapes'
import { ROOM_LAYOUT } from '../src/imp-names'
import { RoomLayout } from '../src/rooms/room-layouts/room-layout'


const sourceFilePath = join(__dirname, '../src/rooms/room-layouts/set-by-build.ts')
const jsdocComment = `/**
 * @file set-by-build.ts
 *
 * This file gets modified by npm scripts in build folder.
 */`

const layouts: Record<string, Array<[number,number]>> = {}

// write singleton luts' blobs
for (const rlName of ROOM_LAYOUT.NAMES) {
  layouts[rlName] = RoomLayout.create('rlName').computePositions()
}

// Write the updated source code back to the file
const newSourceCode = `${jsdocComment}\n\nexport const LUT_BLOBS = ${JSON.stringify(lutBlobs, null, 2)};`
writeFileSync(sourceFilePath, newSourceCode, 'utf-8')
console.log(`Updated constants in: ${sourceFilePath}`) // eslint-disable-line no-console
