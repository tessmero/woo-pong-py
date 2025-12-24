/**
 * @file valid-layout.test.ts
 *
 * Test for the valid-layout rule.
 * In test context the filename is "my-layout.ts".
 */

import { RuleTester } from '@typescript-eslint/rule-tester'
const ruleTester = new RuleTester()
import rule from '../rules/valid-layout'

ruleTester.run('valid-layout', rule, {
  valid: [
    {
      // simple valid case
      code: `
        
import type { CssLayout } from 'util/layout-parser'
        export const MY_LAYOUT = {
          foo: 'bar'
        } as const satisfies CssLayout
      `,
      filename: 'my-layout.ts',
    },
    {
      // spaces don't matter, still valid
      code: `
        
import type { CssLayout } from 'util/layout-parser'
        
        export const MY_LAYOUT = {} as const satisfies CssLayout
      `,
      filename: 'my-layout.ts',
    },
    {
      // extra parens don't break things
      code: `
        
import type { CssLayout } from 'util/layout-parser'
        export const MY_LAYOUT = ({}) as const satisfies CssLayout
      `,
      filename: 'my-layout.ts',
    },
  ],

  invalid: [
    {
      // incorrect variable name
      code: `
        
import type { CssLayout } from 'util/layout-parser'
        export const MYY_LAYOUT = {
          foo: 'bar'
        } as const satisfies CssLayout
      `,
      filename: 'my-layout.ts',
      errors: [{ messageId: 'exportNameMatchesFile' }],
    },
    {
      // wrong import
      code: `
        import type { WrongType } from '../util/layout-parser'
        export const MY_LAYOUT = {} as const satisfies CssLayout
      `,
      filename: 'my-layout.ts',
      errors: [{ messageId: 'importType' }],
    },
    {
      // missing import
      code: `
        export const MY_LAYOUT = {} as const satisfies CssLayout
      `,
      filename: 'my-layout.ts',
      errors: [{ messageId: 'importType' }],
    },
    {
      // wrong export name
      code: `
        
import type { CssLayout } from 'util/layout-parser'
        export const myLayout = {} as const satisfies CssLayout
      `,
      filename: 'my-layout.ts',
      errors: [{ messageId: 'exportConst' }],
    },
    {
      // not a const
      code: `
        
import type { CssLayout } from 'util/layout-parser'
        export let MY_LAYOUT = {} as const satisfies CssLayout
      `,
      filename: 'my-layout.ts',
      errors: [{ messageId: 'exportConst' }],
    },
    {
      // wrong as/satisfies
      code: `
        
import type { CssLayout } from 'util/layout-parser'
        export const MY_LAYOUT = {} as CssLayout
      `,
      filename: 'my-layout.ts',
      errors: [{ messageId: 'satisfiesCssLayout' }],
    },
    {
      // more than one export
      code: `
        
import type { CssLayout } from 'util/layout-parser'
        export const LAYOUT1 = {} as const satisfies CssLayout
        export const LAYOUT2 = {} as const satisfies CssLayout
      `,
      filename: 'my-layout.ts',
      errors: [{ messageId: 'exportConst' }],
    },
    {
      // export default
      code: `
        
import type { CssLayout } from 'util/layout-parser'
        const MY_LAYOUT = {} as const satisfies CssLayout
        export default MY_LAYOUT
      `,
      filename: 'my-layout.ts',
      errors: [{ messageId: 'exportConst' }],
    },
    {
      // wrong satisfies type
      code: `
        
import type { CssLayout } from 'util/layout-parser'
        export const MY_LAYOUT = {} as const satisfies OtherType
      `,
      filename: 'my-layout.ts',
      errors: [{ messageId: 'satisfiesCssLayout' }],
    },
    {
      // missing as const
      code: `
        
import type { CssLayout } from 'util/layout-parser'
        export const MY_LAYOUT = {} satisfies CssLayout
      `,
      filename: 'my-layout.ts',
      errors: [{ messageId: 'satisfiesCssLayout' }],
    },
  ],
})
