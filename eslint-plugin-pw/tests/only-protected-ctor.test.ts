/**
 * @file only-protected-ctor.test.ts
 *
 * Test for the only-protected-ctor rule.
 */

import { RuleTester } from '@typescript-eslint/rule-tester'
const ruleTester = new RuleTester()
import rule from '../rules/only-protected-ctor'

ruleTester.run('only-protected-ctor', rule, {
  valid: [
    {
      code: `
        class A {
          protected constructor() {}
        }
      `,
    },
    {
      code: `
        class B {
          protected constructor(param: number) {}
        }

        class C {
          protected constructor() {
            // some logic
          }
        }
      `,
    },
  ],

  invalid: [
    {
      // missing constructor completely
      code: `
        class A {
          method() {}
        }
      `,
      errors: [
        { messageId: 'missingConstructor' },
      ],
    },
    {
      // missing explicit accessor
      code: `
        class A {
          constructor() {}
        }
      `,
      errors: [
        { messageId: 'missingProtected' },
      ],
    },
    {
      // public accessor
      code: `
        class A {
          public constructor() {}
        }
      `,
      errors: [
        { messageId: 'notProtected' },
      ],
    },
    {
      // private accessor
      code: `
        class A {
          private constructor() {}
        }
      `,
      errors: [
        { messageId: 'notProtected' },
      ],
    },
  ],
})
