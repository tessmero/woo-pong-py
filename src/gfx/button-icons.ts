/**
 * @file button-icons.ts
 *
 * Button icons.
 */

/* eslint-disable max-len */

const imgSize = 500 // pixels in rendered svgs

export const BUTTON_ICONS = {

  settings: `
  `,

  pause: `
  <svg viewBox="0 0 24 24" width="${imgSize}" height="${imgSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="4" y="4" width="6" height="16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="14" y="4" width="6" height="16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
  
  `,
  play: `
  <svg viewBox="0 0 24 24" width="${imgSize}" height="${imgSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.3125 12L7.6875 19L7.6875 5L17.3125 12Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
  
  `,
  fast: `
  
  <svg viewBox="0 0 24 24" width="${imgSize}" height="${imgSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.7778 12L4 19.1111L4 4.88892L13.7778 12Z" stroke="currentColor" stroke-width="1.77778" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.2222 19.1111L20 12L10.2222 4.88892" stroke="currentColor" stroke-width="1.77778" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

  `,
  faster: `
  <svg viewBox="0 0 24 24" width="${imgSize}" height="${imgSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.0833 12.0001L1 19.3334L1 4.66675L11.0833 12.0001Z" stroke="currentColor" stroke-width="1.83333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.41669 19.3334L17.5 12.0001L7.41669 4.66675" stroke="currentColor" stroke-width="1.83333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12.9167 19.3334L23 12.0001L12.9167 4.66675" stroke="currentColor" stroke-width="1.83333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
  
  `,

  bsp: `
  <svg viewBox="0 0 62.5 62.5" width="${imgSize}" height="${imgSize}" xmlns="http://www.w3.org/2000/svg">
<circle cx="16.44736842105263" cy="18.092105263157894" r="5.2631578947368425" fill="currentColor" stroke="currentColor" stroke-width="1"/>
<circle cx="31.25" cy="18.092105263157894" r="5.2631578947368425" fill="currentColor" stroke="currentColor" stroke-width="1"/>
<circle cx="46.05263157894737" cy="18.092105263157894" r="5.2631578947368425" fill="currentColor" stroke="currentColor" stroke-width="1"/>
<circle cx="9.046052631578945" cy="31.25" r="5.2631578947368425" fill="currentColor" stroke="currentColor" stroke-width="1"/>
<circle cx="23.848684210526315" cy="31.25" r="5.2631578947368425" fill="currentColor" stroke="currentColor" stroke-width="1"/>
<circle cx="38.651315789473685" cy="31.25" r="5.2631578947368425" fill="currentColor" stroke="currentColor" stroke-width="1"/>
<circle cx="53.453947368421055" cy="31.25" r="5.2631578947368425" fill="currentColor" stroke="currentColor" stroke-width="1"/>
<circle cx="16.44736842105263" cy="44.4078947368421" r="5.2631578947368425" fill="currentColor" stroke="currentColor" stroke-width="1"/>
<circle cx="31.25" cy="44.4078947368421" r="5.2631578947368425" fill="currentColor" stroke="currentColor" stroke-width="1"/>
<circle cx="46.05263157894737" cy="44.4078947368421" r="5.2631578947368425" fill="currentColor" stroke="currentColor" stroke-width="1"/>
</svg>
`,
} as const satisfies Record<string, string>

export type IconName = keyof typeof BUTTON_ICONS
