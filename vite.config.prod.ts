/**
 * @file vite.config.prod.ts
 *
 * The default vite build used for "npm run build:prod".
 */
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import json5Plugin from 'vite-plugin-json5'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    json5Plugin(),
    glsl(),
  ],
  base: './',
})
