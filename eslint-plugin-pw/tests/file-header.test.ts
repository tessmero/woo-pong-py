/**
 * @file file-header.test.ts
 *
 * Test for the file-header rule.
 * In test context the filename is "file.ts".
 */

import { RuleTester } from '@typescript-eslint/rule-tester'
const ruleTester = new RuleTester()
import rule from '../rules/file-header'

ruleTester.run('file-header', rule,

  {
    valid: [{
      code: `
        /**
         * @file file.ts
         * 
         * This is a file.
         */
        class MyClass {
          constructor( param={} ){}
        }
      `,
    }, {
      code: `
        /**
         * @file file.ts
         * 
         * This is a file.
         * This is a second sentence.
         */
        class MyClass {
          constructor( param={} ){}
        }
      `,
    }],

    invalid: [{
      // wrong filename
      code: `
        /**
         * @file wrong-filename.ts
         * 
         * This is also a file.
         */
        class MyClass {
          constructor( param={} ){}
        }
      `,
      errors: [
        { messageId: 'filename' },
      ],
    }, {
      // no blank line before description
      code: `
        /**
         * @file file.ts
         * This is a file.
         */
      `,
      errors: [
        { messageId: 'space' },
      ],
    }, {
      // no description
      code: `
        /**
         * @file file.ts
         */
      `,
      errors: [
        { messageId: 'sentence' },
      ],
    }],
  },
)
