/**
 * @file local-storage.ts
 *
 * Local storage for resources collected, ball party, and obstacles placed in home simulation.
 */

import type { PatternName } from 'imp-names'
import type { ShapeName } from 'simulation/shapes'
import type { Vec2 } from 'util/math-util'
import { HomeLevel } from './home-level'
import { Obstacle } from 'simulation/obstacle'
import { Lut } from 'simulation/luts/lut'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'

type HomeState = {
  party: {
    members: Array<{
      pattern: PatternName
    }>
    selectedIndex: number
  }
  resources: {
    money: number
  }
  obstacles: Array<{
    shape: ShapeName
    pos: Vec2
  }>
}

const defaultState: HomeState = {
  party: [] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  resources: { money: 0 },
  obstacles: [],
}

const homeStateStorageKey = 'woo-pong-home-state'

export function saveHomeState(homeState: HomeState): void {
  localStorage.setItem(homeStateStorageKey, JSON.stringify(homeState))
}

export function loadHomeState(): HomeState {
  const savedValue = localStorage.getItem(homeStateStorageKey)

  let result
  if (savedValue === null) {
    result = defaultState
  }
  else {
    result = JSON.parse(savedValue) as HomeState
  }

  rebuildHomeObstacles(result)
  return result
}

export function rebuildHomeObstacles(homeState: HomeState) {
  const result: Array<Obstacle> = []

  for (const obs of homeState.obstacles) {
    const shapeLut = Lut.create('obstacle-lut', obs.shape) as ObstacleLut
    result.push(new Obstacle(obs.pos, obs.shape, shapeLut))
  }

  HomeLevel.homeObstacles = result
}
