/**
 * @file rebuild-layouts.ts
 *
 * Rebuild layouts for obstacles in basic rooms.
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import { ROOM_LAYOUT } from '../src/imp-names'
import { RoomLayout } from '../src/rooms/room-layouts/room-layout'
import { ThreeByThree } from '../src/rooms/room-layouts/imp/three-by-three'
import { FourByFour } from '../src/rooms/room-layouts/imp/four-by-four'
import { Breakout } from '../src/rooms/room-layouts/imp/breakout'
import { Honeycomb } from '../src/rooms/room-layouts/imp/honeycomb'
import { TwoGears } from '../src/rooms/room-layouts/imp/two-gears'

// excuse to import layouts and have them registered
const _layouts = [
  FourByFour, Breakout, Honeycomb, ThreeByThree, TwoGears
]

const sourceFilePath = join(__dirname, '../src/rooms/room-layouts/set-by-build.ts')
const jsdocComment = `/**
 * @file set-by-build.ts
 *
 * This file gets modified by npm scripts in build folder.
 */`

const layouts: Record<string, Array<[number, [number, number]]>> = {}

// write singleton luts' blobs
for (const rlName of ROOM_LAYOUT.NAMES) {
  const positions = RoomLayout.create(rlName).computePositions()
  // Assert all [x, y] are integers
  for (const [group, [x, y]] of positions) {
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      throw new Error(`Non-integer position in layout '${rlName}': [${group}, [${x}, ${y}]]`)
    }
  }
  layouts[rlName] = positions
}

// Format the layouts object so that each [groupIndex, [x, y]] is on a single line
function formatLayouts(obj: Record<string, Array<[number, [number, number]]>>): string {
  const entries = Object.entries(obj).map(([key, arr]) => {
    const coords = arr.map(([group, [x, y]]) => `    [${group}, [${x}, ${y}]]`).join(',\n')
    return `  "${key}": [\n${coords}\n  ]`
  })
  return `export const ROOM_LAYOUT_POSITIONS = {\n${entries.join(',\n')}\n};`
}

const newSourceCode = `${jsdocComment}\n\n${formatLayouts(layouts)}`
writeFileSync(sourceFilePath, newSourceCode, 'utf-8')
console.log(`Updated constants in: ${sourceFilePath}`) // eslint-disable-line no-console
