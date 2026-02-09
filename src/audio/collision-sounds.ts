/**
 * @file collision-sounds.ts
 *
 * Plays sounds in reponse to impacts in simulation.
 */

import type { SoundAssetUrl } from './sound-asset-urls'
import { getSound } from './sound-asset-loader'
import type { Rectangle, Vec2 } from 'util/math-util'
import { rectContainsPoint } from 'util/math-util'
import type { DiskState } from 'simulation/disk'

const limitPan = 0.5

const ballBallImpact: SoundAssetUrl = 'click_002.ogg'
const ballObstacleImpact: SoundAssetUrl = 'click_002.ogg'

// const ballBallImpact: SoundAssetUrl = 'impactGlass_light_000.ogg'
// const ballObstacleImpact: SoundAssetUrl = 'impactGlass_light_000.ogg'

// const ballObstacleImpact: SoundAssetUrl = 'impactWood_light_000.ogg'

export const simAudibleRect: Rectangle = [0, 0, 0, 0]
export function setSimAudibleRect(rect: Rectangle) {
  simAudibleRect[0] = rect[0]
  simAudibleRect[1] = rect[1]
  simAudibleRect[2] = rect[2]
  simAudibleRect[3] = rect[3]
}

export function playSound(url: SoundAssetUrl, volume = 0.1) {
  const sound: Howl = getSound(url)
  const vol = 0.1
  // const x = 0
  // const pan = Math.max(-limitPan, Math.min(limitPan, (x - 100) / 200))

  sound.volume(vol)
  const _id = sound.play()
  // sound.volume(vol, id)
  // sound.stereo(pan, id)
}

export type AudibleImpact = {
  t: number
  pos: Vec2
  magnitude: number
  volume: number
}
let recentImpacts: Array<AudibleImpact> = []

export function getRecentImpacts(): Array<AudibleImpact> {
  const lifespan = 1000
  const t = performance.now()
  recentImpacts = recentImpacts.filter((impact) => (t - impact.t) <= lifespan)
  return recentImpacts
}

export function playImpact(simPos: DiskState, isBallBall: boolean, magnitude: number) {
  // don't play any impacts

  if (magnitude < 1e3) {
    return
  }

  const { x, y } = simPos
  if (!rectContainsPoint(simAudibleRect, x, y)) {
    return // don't play sound, ball is outside of audible region
  }

  // console.log('play impact')

  const url = isBallBall ? ballBallImpact : ballObstacleImpact
  const volume = 1e-4 * magnitude

  if (recentImpacts.length < 1000) {
    recentImpacts.push({
      t: performance.now(),
      pos: [x, y],
      magnitude,
      volume,
    })
  }

  playSound(url, volume)
}
