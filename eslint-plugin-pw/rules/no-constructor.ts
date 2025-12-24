/**
 * @file no-constructor.ts
 *
 * Rule to disallow defining constructors in classes.
 *
 * Used to restrict named implementation classes that should
 * follow a registry pattern in sea-block.
 */
import { ESLintUtils, TSESTree } from '@typescript-eslint/utils'

export default ESLintUtils.RuleCreator.withoutDocs({
  // name: 'no-constructor',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow defining constructors in classes.',
    },
    schema: [],
    messages: {
      noConstructor: 'Defining a constructor in a subclass is not allowed.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      // Match class declarations and class expressions
      'MethodDefinition[kind="constructor"]'(node: TSESTree.MethodDefinition) {
        context.report({
          node,
          messageId: 'noConstructor',
        })
      },
      // For TS 4.3+ supports class fields, but constructors are always MethodDefinition
    }
  },
})
