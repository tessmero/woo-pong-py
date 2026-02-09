/**
 * @file sound-asset-urls.ts
 * 
 * List of ogg assets.
 */

// find public/sounds -type f | sed 's|^public/sounds/||;s|$|\",|;s|^|\"|'
export const SOUND_ASSET_URLS = [
  'impactMetal_medium_002.ogg',
  'click_002.ogg',
  'drop_004.ogg',
  'confirmation_001.ogg',
  'maximize_007.ogg',
  'impactGlass_light_000.ogg',
  'impactWood_light_000.ogg',
] as const
export type SoundAssetUrl = (typeof SOUND_ASSET_URLS)[number]