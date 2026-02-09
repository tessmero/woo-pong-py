/**
 * @file p2-collider.ts
 *
 * P2 collider.
 */

// import { Body, Circle, Convex, World } from 'p2'
// import type { ShapeName } from './shapes'
// import { DISK_RADIUS, VALUE_SCALE } from './constants'
// import { getDetailedPoints } from './luts/imp/obstacle-lut'
// import type { Vec2 } from 'util/math-util'

// import { createCanvas } from 'canvas'
// import * as fs from 'fs'

// export function resolveDisk(shape: ShapeName, pos: Vec2): Vec2 {
// //   console.log('resolve disk')

//   const world = getWorld(shape)
//   const diskBody = world.bodies[0]

//   // For each "query" where you have a candidate overlapping position:
//   diskBody.position[0] = pos[0] / VALUE_SCALE
//   diskBody.position[1] = pos[1] / VALUE_SCALE
//   diskBody.velocity[0] = 0
//   diskBody.velocity[1] = 0
//   diskBody.angularVelocity = 0

//   // Save world state before step
// //   saveWorldToPng(world, `debug-before-step.png`)

//   // step to resolve contact constraints
//   let didSolve = false
//   for (let i = 0; i < 10000; i++) {
//     const oldPos = [...diskBody.position]
//     world.step(1 / 60)
//     if (isSolved(world)) {
//     //   console.log(`p2 collision solved after ${i + 1} steps`)
//       didSolve = true
//       break
//     }
//     const newPos = diskBody.position
//     if( oldPos[0] === newPos[0] && oldPos[1] === newPos[1] ){
//         throw new Error('disk did not move')
//     }
//   }

//   // Save world state after step
//   if (!didSolve) {
//     saveWorldToPng(world, `unsolved.png`)
//     throw new Error('unsolved')
//   }

//   // Now diskBody.position is adjusted so the disk is just touching the polygon
//   const resolvedX = diskBody.position[0]
//   const resolvedY = diskBody.position[1]

//   return [
//     Math.round(resolvedX * VALUE_SCALE),
//     Math.round(resolvedY * VALUE_SCALE),
//   ]
// }

// function isSolved(world: World): boolean {
//   const epsilon = 1e-3
//   const eqs = world.narrowphase.contactEquations
//   if (eqs.length === 0) {
//     return true // no contacts
//   }
//   const [px, py] = eqs[0].penetrationVec

//   if (px < epsilon && py < epsilon) {
//     return true // just touching, not overlapping
//   }

//   return false // overlapping
// }

// const _cachedWorlds: Partial<Record<ShapeName, World>> = {}
// function getWorld(shape: ShapeName): World {
//   if (!Object.hasOwn(_cachedWorlds, shape)) {
//     _cachedWorlds[shape] = _buildWorld(shape)
//   }
//   return _cachedWorlds[shape] as World
// }

// function _buildWorld(shape: ShapeName): World {
//   const world = new World({ gravity: [0, 0] })

//   const diskBody = new Body({
//     mass: 1,
//     position: [0, 0],
//   })
//   diskBody.addShape(new Circle({ radius: DISK_RADIUS / VALUE_SCALE }))
//   world.addBody(diskBody)

//   const polyBody = new Body({
//     mass: 0, // static
//     position: [0, 0],
//     angle: 0,
//   })
//   const vertices = (getDetailedPoints(shape) as Array<Vec2>).map(v => [v[0] / VALUE_SCALE, v[1] / VALUE_SCALE])
//   vertices.reverse()
//   polyBody.fromPolygon(vertices as Array<Vec2>)
// //   polyBody.addShape(new Convex({ vertices }))
//   world.addBody(polyBody)
//   return world
// }

// /**
//  * Render the p2 world to a PNG file for debugging.
//  * @param world The p2 World instance
//  * @param filename Output PNG file path
//  */
// export function saveWorldToPng(world: World, filename: string) {
//   const width = 500, height = 500
//   const canvas = createCanvas(width, height)
//   const ctx = canvas.getContext('2d')

//   // Find bounds of all bodies
//   let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
//   for (const body of world.bodies) {
//     for (const shape of body.shapes) {
//       if (shape.type === 1) { // Circle
//         const r = (shape as Circle).radius
//         const x = body.position[0], y = body.position[1]
//         minX = Math.min(minX, x - r)
//         maxX = Math.max(maxX, x + r)
//         minY = Math.min(minY, y - r)
//         maxY = Math.max(maxY, y + r)
//       }
//       else { // Convex
//         const verts = (shape as Convex).vertices
//         for (const v of verts) {
//           // Transform vertex by body angle/position
//           const cos = Math.cos(body.angle), sin = Math.sin(body.angle)
//           const vx = v[0] * cos - v[1] * sin + body.position[0]
//           const vy = v[0] * sin + v[1] * cos + body.position[1]
//           minX = Math.min(minX, vx)
//           maxX = Math.max(maxX, vx)
//           minY = Math.min(minY, vy)
//           maxY = Math.max(maxY, vy)
//         }
//       }
//     }
//   }
//   // Add margin
//   const margin = 10
//   minX -= margin; minY -= margin; maxX += margin; maxY += margin
//   const scale = Math.min(width / (maxX - minX), height / (maxY - minY))

//   // Helper to transform world coords to canvas
//   function tx(x: number) { return (x - minX) * scale }
//   function ty(y: number) { return height - (y - minY) * scale }

//   ctx.clearRect(0, 0, width, height)
//   ctx.save()
//   ctx.lineWidth = 2

//   for (const body of world.bodies) {
//     for (const shape of body.shapes) {
//       ctx.save()
//       ctx.translate(tx(body.position[0]), ty(body.position[1]))
//       ctx.rotate(-body.angle)
//       if (shape.type === 1) { // Circle
//         ctx.beginPath()
//         ctx.arc(0, 0, (shape as Circle).radius * scale, 0, 2 * Math.PI)
//         ctx.strokeStyle = body.mass === 0 ? '#444' : '#09f'
//         ctx.stroke()
//       }
//       else { // Convex
//         const verts = (shape as Convex).vertices
//         ctx.beginPath()
//         verts.forEach(([x, y], i) => {
//           if (i === 0) ctx.moveTo(x * scale, -y * scale)
//           else ctx.lineTo(x * scale, -y * scale)
//         })
//         ctx.closePath()
//         ctx.strokeStyle = body.mass === 0 ? '#444' : '#f90'
//         ctx.stroke()
//       }
//       ctx.restore()
//     }
//   }
//   ctx.restore()

//   // Write PNG synchronously using toBuffer()
//   const buf = canvas.toBuffer('image/png')
//   fs.writeFileSync(filename, buf)
// }
