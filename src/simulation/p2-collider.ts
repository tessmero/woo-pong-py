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

// export function resolveDisk(shape: ShapeName, pos: Vec2): Vec2 {
//   const world = getWorld(shape)
//   const diskBody = world.bodies[0]

//   // For each "query" where you have a candidate overlapping position:
//   diskBody.position[0] = pos[0] / VALUE_SCALE
//   diskBody.position[1] = pos[1] / VALUE_SCALE
//   diskBody.velocity[0] = 0
//   diskBody.velocity[1] = 0
//   diskBody.angularVelocity = 0

//   // Small step just to resolve contact constraints
//   world.step(1 / 60)

//   // Now diskBody.position is adjusted so the disk is just touching the polygon
//   const resolvedX = diskBody.position[0]
//   const resolvedY = diskBody.position[1]

//   return [
//     Math.round(resolvedX * VALUE_SCALE),
//     Math.round(resolvedY * VALUE_SCALE),
//   ]
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
//   diskBody.addShape(new Circle({ radius: DISK_RADIUS }))
//   world.addBody(diskBody)

//   const polyBody = new Body({
//     mass: 0, // static
//     position: [0, 0],
//     angle: 0,
//   })
//   const vertices = (getDetailedPoints(shape) as Array<Vec2>).map(v => [v[0] / VALUE_SCALE, v[1] / VALUE_SCALE])
//   vertices.reverse()
//   polyBody.addShape(new Convex({ vertices }))
//   world.addBody(polyBody)
//   return world
// }
