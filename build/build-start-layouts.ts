/**
 * @file build-start-layouts.ts
 *
 * Rebuild layouts for obstacles in basic rooms.
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import { START_LAYOUT } from '../src/imp-names'
import { StartLayout } from '../src/rooms/start-layouts/start-layout'
import { requireImps } from './require-imps'
import { DISK_COUNT } from '../src/simulation/constants'

requireImps(START_LAYOUT)

const sourceFilePath = join(__dirname, '../src/rooms/start-layouts/set-by-build.ts')
const jsdocComment = `/**
 * @file set-by-build.ts
 *
 * This file gets modified by npm scripts in build folder.
 */`

type Vec2 = [number, number]
const layouts: Record<string, Array<[Vec2,Vec2]>> = {}

// write singleton luts' blobs
for (const rlName of START_LAYOUT.NAMES) {
  const positions = StartLayout.create(rlName).computePosVels()

  if( positions.length !== DISK_COUNT ){
      throw new Error(`wrong number of disks in start layout '${rlName}': 
        had ${positions.length}, expected ${DISK_COUNT}
      `)
  }

  // Assert all integers
  for (const [[x, y], [vx, vy]] of positions) {
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      throw new Error(`Non-integer position in start layout '${rlName}': [${x}, ${y}]`)
    }
    if (!Number.isInteger(vx) || !Number.isInteger(vy)) {
      throw new Error(`Non-integer velocity in start layout '${rlName}': [${vx}, ${vy}]`)
    }
  }
  layouts[rlName] = positions
}


// Format the layouts object so that each [[xy], [vx, vy]] is on a single line
function formatLayouts(obj: Record<string, Array<[Vec2, Vec2]>>): string {
  const entries = Object.entries(obj).map(([key, arr]) => {
    const coords = arr.map(([[x, y], [vx, vy]]) => `    [[${x}, ${y}], [${vx}, ${vy}]]`).join(',\n')
    return `  "${key}": [\n${coords}\n  ]`
  })
  return `export const START_LAYOUT_POSVELS = {\n${entries.join(',\n')}\n};`
}

const newSourceCode = `${jsdocComment}\n\n${formatLayouts(layouts)}`
writeFileSync(sourceFilePath, newSourceCode, 'utf-8')
console.log(`Updated constants in: ${sourceFilePath}`) // eslint-disable-line no-console
