/**
 * @file simulation.test.ts
 *
 * Assert that levels pass/fail as expected, based on a
 * flat view direction and clicked box.
 */

import { ALL_LEVELS_JSON } from '../../src/levels/levels-list'
import { Simulation } from '../../src/simulation/simulation'
import { PinballWizardState } from '../../src/pinball-wizard-state'
import { loadLevel } from '../../src/levels/level-util/level-util'
import { Level, LevelAttempt } from '../../src/levels/level'
import { DIRECTIONS } from '../../src/directions'
import { ok } from 'assert'
import { prepareSim, renderSimulationSnapshotsAsPng } from '../test-util'
import { json } from 'stream/consumers'
import { setTestAudioMode } from '../../src/audio/collision-sounds'

const sim = new Simulation()
let state = new PinballWizardState()
const timeLimit = 10000
const dt = 50

describe('level simulations', function () {
  for (let i = 0; i < ALL_LEVELS_JSON.length; i++) {
    const level = loadLevel(ALL_LEVELS_JSON[i])
    const { tags, passes, fails } = level.json

    if (tags.includes('stable')) {
      assertStable(level) // level has exact solutions listed
    }
    else {
      if (passes) {
        assertPasses(level) // level has solutions listed
      }
      if (fails) {
        assertFails(level) // level has non-solutions listed
      }
    }
  }
})

function assertStable(level: Level) {
  const { name, passes, fails } = level.json
  describe(`level withs 'stable' tag: ${name}`, function () {
    it('has valid stable level json', function () {
      ok(passes && passes.length > 0, `should have some 'passes' solutions in json`)
      ok(!fails, `should have no 'fails' property in json`)
    })

    it('passes only with listed solution(s)', function () {
      const allSolutions = passes!.flatMap(spec => parseAttempts(level, spec))
      const allAttempts = DIRECTIONS.flatMap(dir => parseAttempts(level, `${dir}-`))
      for (const attempt of allAttempts) {
        const isSolution = allSolutions.includes(attempt)
        if (isSolution) {
          ok(simPasses(level, attempt), `should pass with ${attempt}`)
        }
        else {
          ok(!simPasses(level, attempt), `should fail with ${attempt}`)
        }
      }
    })
  })
}

function assertFails(level: Level) {
  // level has non-solutions listed in json
  describe(`level withs 'fails' property: ${level.json.name}`, function () {
    for (const attempt of level.json.fails!.flatMap(spec => parseAttempts(level, spec))) {
      it(`${level.json.name} fails with ${attempt}`, function () {
        ok(!simPasses(level, attempt))
      })
    }
  })
}

function assertPasses(level: Level) {
  // level has solutions listed in json
  describe(`level withs 'passes' property: ${level.json.name}`, function () {
    for (const attempt of level.json.passes!.flatMap(spec => parseAttempts(level, spec))) {
      it(`${level.json.name} passes with ${attempt}`, function () {
        ok(simPasses(level, attempt))
      })
    }
  })
}

function parseAttempts(level: Level, spec: string): Array<LevelAttempt> {
  const [dir, box, _rect] = spec.split('-')
  if (!box) {
    // attempt represents all attempts for side
    const subAttempts: Array<LevelAttempt> = []
    // console.log(spec, dir, JSON.stringify(level.sideViews[dir]))
    for (const [boxIndex, svb] of level.sideViews[dir].entries()) {
      if (!svb) continue
      if (boxIndex === level.json.targetBoxIndex) continue
      for (const [rectIndex, _svr] of svb.entries()) {
        subAttempts.push(`${dir}-${boxIndex}-${rectIndex}` as LevelAttempt)
      }
    }
    // console.log(`split ${spec} into ${JSON.stringify(subAttempts)}`)
    return subAttempts
  }
  return [spec as LevelAttempt]
}

function simPasses(level: Level, attempt: LevelAttempt) {
  setTestAudioMode('skip') // prevent impact sounds from playing or being logged

  state = new PinballWizardState()
  const startBodies = prepareSim(sim, state, level, attempt)

  for (let t = 0; t < timeLimit; t += dt) {
    // console.log(t)
    const endState = sim.update(dt, state)
    if (endState === 'passed') {
      renderSimulationSnapshotsAsPng(
        startBodies, sim.p2World.bodies,
        `${json.name}-passed-${attempt}.png`)
      return true
    }
    else if (endState === 'failed') {
      renderSimulationSnapshotsAsPng(
        startBodies, sim.p2World.bodies,
        `${json.name}-failed-${attempt}.png`)
      return false
    }
  }
  renderSimulationSnapshotsAsPng(
    startBodies, sim.p2World.bodies,
    `${json.name}-stalled-${attempt}.png`)
  throw new Error(`level simulation did not pass or fail after ${timeLimit} ms`)
}
