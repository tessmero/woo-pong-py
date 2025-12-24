/**
 * @file test-util.ts
 *
 * Helpers for unit tests.
 */

import { createCanvas } from 'canvas'
import { dirname, join } from 'path'
import fs from 'fs'
import { Box as P2Box, Body, Shape } from 'p2-es'
import { execSync } from 'child_process'
import { Simulation } from '../src/simulation/simulation'
import { Level, LevelAttempt } from '../src/levels/level'
import { PinballWizardState } from '../src/pinball-wizard-state'
import { Direction } from '../src/directions'

export function prepareSim(
  sim: Simulation, state: PinballWizardState,
  level: Level, attempt: LevelAttempt,
) {
  const [dir, box, rect] = attempt.split('-')
  const boxIndex = Number(box)
  const rectIndex = Number(rect)

  state.startLevel()
  //   state.isFlat = true
  state.flatDirection = dir as Direction
  state.startActive(boxIndex)

  const { lockIndex } = level.sideViews[dir][boxIndex][rectIndex]
  sim.reset(level, state, lockIndex)

  const startBodies = sim.p2World.bodies.map(b => ({
    angle: b.angle,
    position: [...b.position],
    shapes: [
      {
        width: (b.shapes[0] as P2Box).width,
        height: (b.shapes[0] as P2Box).height,
      } as P2Box as Shape,
    ],
  } as Body))

  return startBodies
}

// where to output simulation start/end images
const outputPath = join(__dirname, 'sim-images')

try {
  execSync(`rm -r ${outputPath}/*.png`)
}
catch {
  //
}

export function renderSimulationSnapshotsAsPng(startBodies: Array<Body>, endBodies: Array<Body>, filename: string) {
  const filePath = join(outputPath, filename)
  const canvas = createCanvas(1600, 600) // Double the width for side-by-side rendering
  const ctx = canvas.getContext('2d')

  // Find bounding box of all bodies in both snapshots
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  const allBodies = [...startBodies, ...endBodies]
  for (const body of allBodies) {
    if (body.shapes.length === 1 && body.shapes[0] instanceof P2Box) {
      const shape = body.shapes[0] as P2Box
      const x = body.position[0]
      const y = body.position[1]
      const width = shape.width
      const height = shape.height
      if (width > 1000) continue // ignore wide floor shape

      minX = Math.min(minX, x - width / 2)
      minY = Math.min(minY, y - height / 2)
      maxX = Math.max(maxX, x + width / 2)
      maxY = Math.max(maxY, y + height / 2)
    }
  }

  const boundingWidth = maxX - minX
  const boundingHeight = maxY - minY
  const scale = Math.min(canvas.width / 2 / boundingWidth, canvas.height / boundingHeight)
  const offsetX = canvas.width / 4 - (minX + boundingWidth / 2) * scale
  const offsetY = canvas.height / 2 - (minY + boundingHeight / 2) * scale

  // Clear the canvas
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Helper function to render bodies
  const renderBodies = (bodies: Array<Body>, xOffset: number) => {
    for (const body of bodies) {
      if (body.shapes.length === 1) {
        const shape = body.shapes[0] as P2Box
        const x = body.position[0]
        const y = body.position[1]
        const width = shape.width
        const height = shape.height
        const angle = body.angle

        ctx.save()
        ctx.translate(xOffset + offsetX + x * scale, offsetY + y * scale)
        ctx.rotate(angle)
        ctx.fillStyle = 'gray'
        ctx.fillRect((-width / 2) * scale, (-height / 2) * scale, width * scale, height * scale)
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 1
        ctx.strokeRect((-width / 2) * scale, (-height / 2) * scale, width * scale, height * scale)
        ctx.restore()
      }
    }
  }

  // Render start bodies on the left
  renderBodies(startBodies, 0)

  // Render end bodies on the right
  renderBodies(endBodies, canvas.width / 2)

  // Ensure the directory exists
  const dir = dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Save the canvas as a PNG file
  try {
    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(filePath, buffer)

    // console.log(`Saved simulation snapshots to ${filePath}`)
  }
  catch (error: unknown) {
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to save PNG file: ${error.message}`)
    }
    else {
      // eslint-disable-next-line no-console
      console.error('An unknown error occurred while saving the PNG file')
    }
  }
}
