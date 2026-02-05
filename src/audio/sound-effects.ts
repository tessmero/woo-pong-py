/**
 * @file sound-effects.ts
 *
 * List of sound assets.
 */

import { randChoice } from 'util/rng'
import { getSound } from './sound-asset-loader'
import { SoundAssetUrl } from './sound-asset-urls'


export type SoundEffect = {
  url: SoundAssetUrl | Array<SoundAssetUrl>
  volume: number
  skip?: number
}

export const SOUND_EFFECTS = {
  buttonClick: {
    url: 'click_002.ogg',
    volume: 0.1,
  },
  removeBlock: {
    url: 'drop_004.ogg',
    volume: 0.05,
  },
  rewind: {
    url: 'taperewind-93168.ogg',
    volume: 0.01,
  },
  passLevel: {
    url: 'confirmation_001.ogg',
    volume: 0.1,
  },
  // nextLevel: {
  //   url: 'maximize_007.ogg',
  //   volume: 0.05,
  // },
  scribble: {
    url: 'pencil-29272.ogg',
    volume: 0.05,
  },
  // swish: {
  //   url: 'movement-swipe-whoosh-3-186577.ogg',
  //   volume: 0.1,
  // },
  // swoosh: {
  //   url: ['select_003.ogg',  'select_004.ogg'],
  //   volume: 0.1,
  //   // skip: 0.2,
  // },
  // enlarge: {
  //   url: 'phaseJump1.ogg',
  //   volume: 0.1,
  // },
  // flatten: {
  //   url: 'rev_phaseJump1.ogg',
  //   volume: 0.1,
  // },
} as const satisfies Record<string, SoundEffect>
export type SoundEffectName = keyof typeof SOUND_EFFECTS

export function playSound(name: SoundEffectName) {
  const { url, volume, skip = 0 } = SOUND_EFFECTS[name] as SoundEffect

  const sound = getSound(Array.isArray(url) ? randChoice(url) : url)
  // if( sound.playing() ) return
  sound.volume(volume)
  sound.seek(skip)
  sound.play()
}

export function stopSound(name: keyof typeof SOUND_EFFECTS) {
  const { url } = SOUND_EFFECTS[name]
  if (Array.isArray(url)) throw new Error('cannot stop sound with multiple urls')
  const sound = getSound(url as SoundAssetUrl)
  sound.stop()
}
