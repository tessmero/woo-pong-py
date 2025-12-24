/**
 * @file file-header.ts
 *
 * Rule to require file headers like this.
 */
import path from 'path'
import { ESLintUtils } from '@typescript-eslint/utils'

export default ESLintUtils.RuleCreator.withoutDocs({
  // name: 'file-header',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require JSDoc @file tag with correct filename and formatted description.',
    },
    fixable: undefined,
    schema: [],
    messages: {
      // missing jsdoc @file covered by jsdoc/require-file-overview
      // missing: 'File must start with a JSDoc block containing an @file tag.',
      filename: '@file tag must start with filename {{expected}}.',
      space: 'Must have blank line between filename and description',
      sentence: 'File description must start with an uppercase letter and end with a period.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(_node) {
        const source = context.getSourceCode()
        const comments = source.getAllComments()
        if (!comments.length || comments[0].type !== 'Block' || !comments[0].value.startsWith('*')) {
          // missing jsdoc @file covered by jsdoc/require-file-overview
          return
        }

        const loc = comments[0].loc
        const jsdoc = comments[0].value

        let filename: string | undefined
        let description: string | undefined

        // Match @file tag
        const fileTagMatch = jsdoc.match(/@file\s+([^\s]+)\s*([\s\S]*)/)
        if (fileTagMatch) {
          filename = fileTagMatch[1]
          description = fileTagMatch[2]
          description = description.replace(/^\s*\*\s?/gm, '').trim()
        }
        else {
          // missing jsdoc @file covered by jsdoc/require-file-overview
          return
        }

        // second line must be empty
        const allLines = jsdoc.split('\n').map(s => s.replace(/^\s*\*\s?/, ''))
        if (allLines[2]?.trim() !== '') {
          context.report({ loc, messageId: 'space' })
        }

        // filename must be correct
        const expectedFile = path.basename(context.filename)
        if (filename !== expectedFile) {
          context.report({
            loc,
            messageId: 'filename',
            data: { expected: expectedFile },
          })
        }

        // description must start with uppercase and end with period
        if (!/^[A-Z]/.test(description) || !/\.\s*$/.test(description)) {
          context.report({ loc, messageId: 'sentence' })
        }
      },
    }
  },
})
