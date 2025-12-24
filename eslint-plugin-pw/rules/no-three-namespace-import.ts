/**
 * @file no-three-namespace-import.ts
 *
 * Rule to disallow `import * as ...` and default import from 'three'.
 */
import type { TSESTree } from '@typescript-eslint/utils'
import { ESLintUtils } from '@typescript-eslint/utils'

export default ESLintUtils.RuleCreator.withoutDocs({
  // name: 'no-three-namespace-import',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow namespace and default imports from \'three\'',
    },
    messages: {
      noNamespaceThree: 'Namespace import from \'three\' is not allowed. Use named imports instead.',
      noDefaultThree: 'Default import from \'three\' is not allowed. Use named imports instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        if (node.source.value === 'three') {
          for (const specifier of node.specifiers) {
            if (specifier.type === 'ImportNamespaceSpecifier') {
              context.report({
                node: specifier,
                messageId: 'noNamespaceThree',
              })
            }
            if (specifier.type === 'ImportDefaultSpecifier') {
              context.report({
                node: specifier,
                messageId: 'noDefaultThree',
              })
            }
          }
        }
      },
    }
  },
})
