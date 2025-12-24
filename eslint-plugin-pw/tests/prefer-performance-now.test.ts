/**
 * @file prefer-performance-now.test.ts
 *
 * Test for the prefer-performance-now rule.
 */

import { RuleTester } from '@typescript-eslint/rule-tester'
const ruleTester = new RuleTester()
import rule from '../rules/prefer-performance-now'

ruleTester.run('prefer-performance-now', rule, {
  valid: [
    {
      code: `
        const t = performance.now();
      `,
    },
    {
      code: `
        function foo() {
          return performance.now();
        }
      `,
    },
    {
      code: `
        // unrelated Date usage
        const d = new Date();
      `,
    },
  ],

  invalid: [
    {
      code: `
        const t = Date.now();
      `,
      errors: [
        { messageId: 'preferPerformanceNow' },
      ],
      output: `
        const t = performance.now();
      `,
    },
    {
      code: `
        function foo() {
          return Date.now();
        }
      `,
      errors: [
        { messageId: 'preferPerformanceNow' },
      ],
      output: `
        function foo() {
          return performance.now();
        }
      `,
    },
  ],
})
