/**
 * @file valid-key-type.test.ts
 *
 * Tests for the valid-key-type rule.
 * In test context the filename is "freecam-layout-keys.ts".
 */

import { RuleTester } from '@typescript-eslint/rule-tester'
import rule from '../rules/valid-key-type'
const ruleTester = new RuleTester()

ruleTester.run('valid-key-type', rule, {
  valid: [

    {
      // Valid: correct array and type with -Url suffix
      code: `
        export const MESH_ASSET_URLS = [
          'raft/thruster.obj',
          'chess/rook.obj',
        ] as const
        export type MeshAssetUrl = (typeof MESH_ASSET_URLS)[number]
      `,
      filename: 'mesh-asset-urls.ts',
    },
    {
      // Valid: correct array and type
      code: `
        export const FREECAM_LAYOUT_KEYS = [
          'configBtn',
          'chessBtn',
          'musicBtn',
        ] as const
        export type FreecamLayoutKey = (typeof FREECAM_LAYOUT_KEYS)[number]
      `,
      filename: 'freecam-layout-keys.ts',
    },
    {
      // Valid: another correct array and type
      code: `
        export const CHESS_KEYS = [
          'a',
          'b',
        ] as const
        export type ChessKey = (typeof CHESS_KEYS)[number]
      `,
      filename: 'chess-keys.ts',
    },
  ],
  invalid: [
    {
      // Invalid: filename does not end with keys
      code: `
        export const FREECAM_LAYOUT = [
          'configBtn',
        ] as const
        export type FreecamLayoutKey = (typeof FREECAM_LAYOUT)[number]
      `,
      filename: 'freecam-layout.ts',
      errors: [{ messageId: 'keysFilename' }],
    },
    {
      // Invalid: array name does not match filename
      code: `
        export const FREECAM_LAYOUTT_KEYS = [
          'configBtn',
        ] as const
        export type FreecamLayouttKey = (typeof FREECAM_LAYOUT)[number]
      `,
      filename: 'freecam-layout-keys.ts',
      errors: [{ messageId: 'exportConstArray' }],
    },
    {
      // Invalid: type name does not match PascalCase version of array name
      code: `
        export const FREECAM_LAYOUT_KEYS = [
          'configBtn',
        ] as const
        export type FreecamKey = (typeof FREECAM_LAYOUT_KEYS)[number]
      `,
      filename: 'freecam-layout-keys.ts',
      errors: [{ messageId: 'arrayNameMatchesType' }],
    },
    {
      // Invalid: array contains number
      code: `
        export const FREECAM_LAYOUT_KEYS = [
          'configBtn',
          1,
        ] as const
        export type FreecamLayoutKey = (typeof FREECAM_LAYOUT_KEYS)[number]
      `,
      filename: 'freecam-layout-keys.ts',
      errors: [{ messageId: 'nonNumeric' }],
    },
    {
      // Invalid: array contains string that can be parsed as number
      code: `
        export const FREECAM_LAYOUT_KEYS = [
          'configBtn',
          '1',
        ] as const
        export type FreecamLayoutKey = (typeof FREECAM_LAYOUT_KEYS)[number]
      `,
      filename: 'freecam-layout-keys.ts',
      errors: [{ messageId: 'nonNumeric' }],
    },
    {
      // Invalid: array contains duplicate values
      code: `
        export const FREECAM_LAYOUT_KEYS = [
          'configBtn',
          'configBtn',
        ] as const
        export type FreecamLayoutKey = (typeof FREECAM_LAYOUT_KEYS)[number]
      `,
      filename: 'freecam-layout-keys.ts',
      errors: [{ messageId: 'uniqueStrings' }],
    },
    {
      // Invalid: missing type export
      code: `
        export const FREECAM_LAYOUT_KEYS = [
          'configBtn',
        ] as const
      `,
      filename: 'freecam-layout-keys.ts',
      errors: [{ messageId: 'exportType' }],
    },
    {
      // Invalid: missing array export
      code: `
        export type FreecamLayoutKey = string
      `,
      filename: 'freecam-layout-keys.ts',
      errors: [{ messageId: 'exportConstArray' }],
    },
  ],
})
