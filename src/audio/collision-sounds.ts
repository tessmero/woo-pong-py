/**
 * @file collision-sounds.ts
 *
 * Plays sounds in reponse to impacts in simulation.
 */

import type { SoundAssetUrl } from './sound-asset-urls'
import { getSound } from './sound-asset-loader'

const limitPan = 0.5

const ballBallImpact: SoundAssetUrl = 'impactMetal_medium_002.ogg'
const ballObstacleImpact: SoundAssetUrl = 'impactMetal_medium_002.ogg'

export function playImpact(isBallBall: boolean) {

  console.log('play impact')

  const url = isBallBall ? ballBallImpact : ballObstacleImpact
  const sound: Howl = getSound(url)
  const vol = .1
  // const x = 0
  // const pan = Math.max(-limitPan, Math.min(limitPan, (x - 100) / 200))

  sound.volume(vol)
  const _id = sound.play()
  // sound.volume(vol, id)
  // sound.stereo(pan, id)
}
