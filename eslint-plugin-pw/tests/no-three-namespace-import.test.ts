/**
 * @file no-three-namespace-import.test.ts
 *
 * Test for the no-three-namespace-import rule.
 */

import { RuleTester } from '@typescript-eslint/rule-tester'
const ruleTester = new RuleTester()
import rule from '../rules/no-three-namespace-import'

ruleTester.run('no-three-namespace-import', rule,

  {
    valid: [
      {
        code: `
          import { Mesh, Scene } from 'three'
        `,
      },
      {
        code: `
          import { Vector3 as Vec3 } from 'three'
        `,
      },
      {
        code: `
          import * as _ from 'lodash'
        `,
      },
    ],

    invalid: [
      {
        code: `
          import * as THREE from 'three'
        `,
        errors: [
          { messageId: 'noNamespaceThree' },
        ],
      },
      {
        code: `
          import * as T from 'three'
        `,
        errors: [
          { messageId: 'noNamespaceThree' },
        ],
      },
      {
        code: `
          import THREE from 'three'
        `,
        errors: [
          { messageId: 'noDefaultThree' },
        ],
      },
      {
        code: `
          import T from 'three'
        `,
        errors: [
          { messageId: 'noDefaultThree' },
        ],
      },
    ],
  },
)
