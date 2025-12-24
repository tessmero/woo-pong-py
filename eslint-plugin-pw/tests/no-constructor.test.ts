/**
 * @file no-constructor.test.ts
 *
 * Test for the no-constructors rule.
 */

import { RuleTester } from '@typescript-eslint/rule-tester'
const ruleTester = new RuleTester()
import rule from '../rules/no-constructor'

ruleTester.run('no-constructor', rule, {
  valid: [
    {
      code: `
        class MyClass {
          myMethod() {}
        }
      `,
    },
    {
      code: `
        class AnotherClass {
          // No constructor here!
        }
      `,
    },
    {
      code: `
        const MyExprClass = class {
          foo() {}
        }
      `,
    },
    {
      code: `
        abstract class AbstractClass {
          abstract foo(): void;
        }
      `,
    },
  ],

  invalid: [
    {
      code: `
        class MyClass {
          constructor() {}
        }
      `,
      errors: [{ messageId: 'noConstructor' }],
    },
    {
      code: `
        class MyClass {
          constructor(param: string) {}
        }
      `,
      errors: [{ messageId: 'noConstructor' }],
    },
    {
      code: `
        const MyExprClass = class {
          constructor() {}
        }
      `,
      errors: [{ messageId: 'noConstructor' }],
    },
    {
      code: `
        class WithStatic {
          static foo() {}
          constructor() {}
        }
      `,
      errors: [{ messageId: 'noConstructor' }],
    },
  ],
})
