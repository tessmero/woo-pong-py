/**
 * @file vite.config.ts
 *
 * Configuration for vite build used in "npm run dev".
 */

import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import trackLiteralsPlugin from './vite-plugin-pw/track-literal-ctors'
import json5Plugin from 'vite-plugin-json5'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  plugins: [
    trackLiteralsPlugin(),
    tsconfigPaths(),
    json5Plugin(),
    glsl(),
    {
      name: 'reload',
      configureServer(server) {
        const { ws, watcher } = server
        watcher.on('change', (file) => {
          if (file.endsWith('.html')) {
            ws.send({
              type: 'full-reload',
            })
          }
        })
      },
    },
  ],
  base: './',
  build: {

    // // use polling instead of intended vite watch
    // watch: {
    //   chokidar: {
    //     usePolling: true,
    //     interval: 1000,
    //   },
    // },

    // keep output readable in browser debugger
    minify: false,
    terserOptions: {
      mangle: false,
      compress: false,
    },
  },
})
