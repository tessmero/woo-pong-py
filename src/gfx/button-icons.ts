/**
 * @file button-icons.ts
 *
 * Button icons.
 */

/* eslint-disable max-len */

const imgSize = 500 // pixels in rendered svgs
const strokeWidth = 2

export const BUTTON_ICONS = {

  settings: `
<svg viewBox="0 0 24 24" width="${imgSize}" height="${imgSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
<path stroke="currentColor" stroke-width="${strokeWidth}" d="M17.2994 10.4527L19.2267 10.7677C19.3846 10.7935 19.5003 10.9298 19.5 11.0896V12.883C19.5 13.0412 19.3865 13.1768 19.2303 13.2042L17.3004 13.543C17.1885 13.9298 17.0349 14.3022 16.8415 14.6543L17.9823 16.2382C18.0759 16.3679 18.0612 16.5463 17.9483 16.6595L16.6804 17.9283C16.5682 18.0401 16.3921 18.0561 16.2623 17.9645L14.6627 16.8424C14.3099 17.0387 13.9352 17.1952 13.5442 17.3103L13.2034 19.231C13.176 19.3865 13.0406 19.5 12.8825 19.5H11.0888C10.9294 19.5 10.7934 19.3849 10.7676 19.228L10.4493 17.3168C10.059 17.204 9.6823 17.0485 9.32585 16.8525L7.73767 17.9648C7.60821 18.0558 7.43178 18.0401 7.31992 17.9283L6.05198 16.6595C5.93947 16.5463 5.9248 16.3686 6.01741 16.2391L7.13958 14.6697C6.94163 14.3116 6.78444 13.9337 6.67062 13.5414L4.76905 13.2042C4.61349 13.1765 4.5 13.0412 4.5 12.883V11.0896C4.5 10.9304 4.61544 10.7941 4.77263 10.768L6.67421 10.4514C6.78868 10.0582 6.94586 9.68022 7.14316 9.32315L6.0347 7.73739C5.94371 7.60793 5.95937 7.43185 6.07122 7.32L7.33883 6.0525C7.452 5.94 7.62908 5.925 7.7592 6.01793L9.33433 7.14293C9.68817 6.94924 10.0639 6.795 10.4552 6.6825L10.767 4.77359C10.7927 4.61576 10.929 4.5 11.0888 4.5H12.8825C13.041 4.5 13.1763 4.61413 13.2037 4.77L13.5399 6.68935C13.929 6.8025 14.304 6.95837 14.6591 7.15467L16.2385 6.01957C16.3683 5.92598 16.5464 5.94065 16.6595 6.05348L17.9278 7.32098C18.0397 7.43315 18.0553 7.60957 17.9643 7.73902L16.8392 9.34239C17.0323 9.69424 17.1865 10.066 17.2994 10.4527ZM9.71725 12C9.71725 13.2607 10.7393 14.2826 12.0001 14.2826C13.2608 14.2826 14.2829 13.2607 14.2829 12C14.2829 10.7394 13.2608 9.71742 12.0001 9.71742C10.7393 9.71742 9.71725 10.7394 9.71725 12Z"/>
</svg>
  `,

  pause: `
  <svg viewBox="0 0 24 24" width="${imgSize}" height="${imgSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="4" y="4" width="6" height="16" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="14" y="4" width="6" height="16" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
  
  `,
  play: `
  <svg viewBox="0 0 24 24" width="${imgSize}" height="${imgSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.3125 12L7.6875 19L7.6875 5L17.3125 12Z" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
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

  eye: `
<svg fill="currentColor" width="${imgSize}" height="${imgSize}" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
<title>eye</title>
<path d="M0 16q0.064 0.128 0.16 0.352t0.48 0.928 0.832 1.344 1.248 1.536 1.664 1.696 2.144 1.568 2.624 1.344 3.136 0.896 3.712 0.352 3.712-0.352 3.168-0.928 2.592-1.312 2.144-1.6 1.664-1.632 1.248-1.6 0.832-1.312 0.48-0.928l0.16-0.352q-0.032-0.128-0.16-0.352t-0.48-0.896-0.832-1.344-1.248-1.568-1.664-1.664-2.144-1.568-2.624-1.344-3.136-0.896-3.712-0.352-3.712 0.352-3.168 0.896-2.592 1.344-2.144 1.568-1.664 1.664-1.248 1.568-0.832 1.344-0.48 0.928zM10.016 16q0-2.464 1.728-4.224t4.256-1.76 4.256 1.76 1.76 4.224-1.76 4.256-4.256 1.76-4.256-1.76-1.728-4.256zM12 16q0 1.664 1.184 2.848t2.816 1.152 2.816-1.152 1.184-2.848-1.184-2.816-2.816-1.184-2.816 1.184l2.816 2.816h-4z"></path>
</svg>
`,

  choose: `
  <svg version="1.1" id="Uploaded to svgrepo.com" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
  width="800px" height="800px" viewBox="0 0 32 32" xml:space="preserve">
  <style type="text/css">
  .puchipuchi_een{fill:#111918;}
  </style>
  <path class="puchipuchi_een" d="M7,6c0-2.757,2.243-5,5-5s5,2.243,5,5c0,1.627-0.793,3.061-2,3.974V6c0-1.654-1.346-3-3-3
  S9,4.346,9,6v3.974C7.793,9.061,7,7.627,7,6z M24,13c-1.104,0-2,0.896-2,2v-1c0-1.104-0.896-2-2-2s-2,0.896-2,2v-1
  c0-1.104-0.896-2-2-2s-2,0.896-2,2V6c0-1.104-0.896-2-2-2s-2,0.896-2,2v10.277C9.705,16.106,9.366,16,9,16c-1.104,0-2,0.896-2,2v3
  c0,0.454,0.155,0.895,0.438,1.249L11,28h12l2.293-3.293C25.682,24.318,26,23.55,26,23v-8C26,13.896,25.104,13,24,13z M11,29v1
  c0,0.552,0.447,1,1,1h10c0.553,0,1-0.448,1-1v-1H11z"/>
  </svg>
`,

  grow: `
<svg width="800px" height="800px" viewBox="0 0 24 24" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"><defs><style>.cls-1{fill:none;stroke:#020202;stroke-miterlimit:10;stroke-width:1.91px;}</style></defs><path class="cls-1" d="M18.54,23.5h0a24.47,24.47,0,0,1,2.29-9.9,8.62,8.62,0,0,0,.73-3.25A8.71,8.71,0,0,0,13.25,1.5a8.61,8.61,0,0,0-8.9,8.61c0,.2,0,.39,0,.58L2.58,14.58a1.49,1.49,0,0,0-.15.66h0A1.57,1.57,0,0,0,4,16.8h.35v1a2.86,2.86,0,0,0,2.87,2.87H9.13V23.5"/><polygon class="cls-1" points="13.91 8.2 12 11.06 13.91 11.06 13.91 8.2"/><polygon class="cls-1" points="13.91 13.94 15.83 11.06 13.91 11.06 13.91 13.94"/></svg>
`,

  home: `
  <svg width="800px" height="800px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8 0L0 6V8H1V15H4V10H7V15H15V8H16V6L14 4.5V1H11V2.25L8 0ZM9 10H12V13H9V10Z" 
fill="currentColor"/>
</svg>
  `
} as const satisfies Record<string, string>

export type IconName = keyof typeof BUTTON_ICONS
