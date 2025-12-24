/**
 * @file prefer-performance-now.ts
 *
 * Enforce the use of performance.now() instead of Date.now() for timing.
 */
import { ESLintUtils, TSESTree } from '@typescript-eslint/utils'

export default ESLintUtils.RuleCreator.withoutDocs({
  // name: 'prefer-performance-now',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce the use of performance.now() instead of Date.now() for timing.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferPerformanceNow: 'Prefer performance.now() for timing instead of Date.now().',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (
          node.callee.type === 'MemberExpression'
          && node.callee.object.type === 'Identifier'
          && node.callee.object.name === 'Date'
          && node.callee.property.type === 'Identifier'
          && node.callee.property.name === 'now'
        ) {
          context.report({
            node,
            messageId: 'preferPerformanceNow',
            fix(fixer) {
              return fixer.replaceText(node, 'performance.now()')
            },
          })
        }
      },
    }
  },
})
