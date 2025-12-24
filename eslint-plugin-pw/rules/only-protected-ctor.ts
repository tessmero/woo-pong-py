/**
 * @file only-protected-ctor.ts
 *
 * Require classes to have explicit "protected constructor".
 * Used to enforce static registry pattern in certain base classes.
 */
import { ESLintUtils, TSESTree } from '@typescript-eslint/utils'

export default ESLintUtils.RuleCreator.withoutDocs({
  // name: 'no-protected-ctor',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require class constructors to be explicitly marked "protected" and to be defined.',
    },
    fixable: undefined,
    schema: [],
    messages: {
      missingConstructor: 'Class must define a constructor.',
      missingProtected: 'Constructor must be explicitly marked as "protected".',
      notProtected: 'Constructor must not be "public" or "private", only "protected".',
    },
  },
  defaultOptions: [],
  create(context) {
    // Track all classes to check if they have a constructor or not.
    const classesWithoutCtor = new Set<TSESTree.ClassDeclaration | TSESTree.ClassExpression>()

    return {
      ClassDeclaration(node) {
        classesWithoutCtor.add(node)
      },
      ClassExpression(node) {
        classesWithoutCtor.add(node)
      },
      MethodDefinition(node: TSESTree.MethodDefinition) {
        if (
          node.kind === 'constructor'
          && node.parent
          && node.parent.type === 'ClassBody'
        ) {
          // Remove class from "without constructor" set because constructor is found
          if (
            node.parent.parent
            && (node.parent.parent.type === 'ClassDeclaration' || node.parent.parent.type === 'ClassExpression')
          ) {
            classesWithoutCtor.delete(node.parent.parent)
          }

          // "accessibility" is set for TS, omitted = public
          const accessibility = node.accessibility

          if (!accessibility) {
            context.report({
              node,
              messageId: 'missingProtected',
            })
          }
          else if (accessibility !== 'protected') {
            context.report({
              node,
              messageId: 'notProtected',
            })
          }
        }
      },
      'Program:exit'() {
        // After traversing entire file, report any classes without constructor
        for (const classNode of classesWithoutCtor) {
          context.report({
            node: classNode.id || classNode,
            messageId: 'missingConstructor',
          })
        }
      },
    }
  },
})
