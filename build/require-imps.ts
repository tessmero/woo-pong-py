/**
 * @file require-imps.ts
 *
 * Programmatically require all implementation files for one or more
 * ImpManifest entries, triggering their static registration blocks.
 */

import { globSync } from 'glob'
import { join } from 'path'
import type { ImpManifest } from '../src/imp-names'

const projectRoot = join(__dirname, '..')

/**
 * Require all implementation files matching the SOURCES globs of the
 * given ImpManifest(s). This triggers the `static { }` registration
 * blocks in each implementation file.
 */
export function requireImps(...manifests: readonly ImpManifest[]): void {
  for (const manifest of manifests) {
    for (const source of manifest.SOURCES) {
      const pattern = source.includes('*') ? source : join(source, '**/*.ts')
      const files = globSync(pattern, { cwd: projectRoot })
      for (const file of files) {
        require(join(projectRoot, file))
      }
    }
  }
}
