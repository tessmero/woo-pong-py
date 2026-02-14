/**
 * @file valid-layout.ts
 *
 * Require exact file structure e.g. my-layout.ts:
 *
 *   import type { CssLayout } from 'util/layout-parser'
 *   export const MY_LAYOUT = { ... } as const satisfies CssLayout
 *
 * Used to enforce exact structure layout source files.
 */
import { ESLintUtils, TSESTree } from '@typescript-eslint/utils'

export default ESLintUtils.RuleCreator.withoutDocs({
  // name: 'valid-layout',
  meta: {
    type: 'problem',
    docs: {
      description: `Require exact file structure for layout files: 
      import CssLayout type and export a single const as satisfies CssLayout.`,
    },
    fixable: undefined,
    schema: [],
    messages: {
      importType: 'Must import type { CssLayout } from \'util/layout-parser\'.',
      exportConst: 'Must export a single const in ALL_CAPS named export.',
      satisfiesCssLayout: 'Exported const must end with \'as const satisfies CssLayout\'.',
      exportNameMatchesFile: 'Exported const name must match the ALL_CAPS version of the filename.',
    },
  },
  defaultOptions: [],

  create(context) {
    let hasCssLayoutImport = false
    let exportedConst: TSESTree.ExportNamedDeclaration | undefined

    return {
      Program(node) {
        // const source = context.getSourceCode()

        // 1. Check import type { CssLayout }
        for (const stmt of node.body) {
          if (
            stmt.type === 'ImportDeclaration'
            && stmt.importKind === 'type'
            && stmt.source.value === 'util/layout-parser'
          ) {
            if (
              stmt.specifiers.some(
                spec =>
                  spec.type === 'ImportSpecifier'
                  && spec.imported.type === 'Identifier'
                  && spec.imported.name === 'CssLayout',
              )
            ) {
              hasCssLayoutImport = true
            }
          }
        }

        if (!hasCssLayoutImport) {
          context.report({
            node,
            messageId: 'importType',
          })
        }

        // 2. Find named exports
        const exports = node.body.filter(
          (stmt): stmt is TSESTree.ExportNamedDeclaration =>
            stmt.type === 'ExportNamedDeclaration',
        )

        if (exports.length !== 1) {
          context.report({
            node,
            messageId: 'exportConst',
          })
          return
        }

        exportedConst = exports[0]

        // Check it's a const, named as ALL_CAPS
        if (
          !exportedConst.declaration
          || exportedConst.declaration.type !== 'VariableDeclaration'
          || exportedConst.declaration.kind !== 'const'
        ) {
          context.report({
            node: exportedConst,
            messageId: 'exportConst',
          })
          return
        }

        const declarator = exportedConst.declaration.declarations[0]
        if (
          !declarator
          || declarator.id.type !== 'Identifier'
          || !/^[A-Z0-9_]+$/.test(declarator.id.name)
        ) {
          context.report({
            node: exportedConst,
            messageId: 'exportConst',
          })
          return
        }

        // --- Enforce exported name matches filename ---
        const filename = context.filename
        // console.log('filename', filename)
        const baseName = filename
          .replace(/^.*[\\/]/, '')
          .replace(/\.ts$/, '')
          .replace(/-/g, '_')
        // console.log('basename', baseName)
        const expectedName = baseName.toUpperCase()
        // console.log('expectedName',expectedName)
        // console.log('declarator.id.name', declarator.id.name)
        if (declarator.id.name !== expectedName) {
          context.report({
            node: declarator,
            messageId: 'exportNameMatchesFile',
          })
          return
        }
        // ---------------------------------------------

        // 3. Check "as const satisfies CssLayout"
        if (
          !declarator.init
          || (
            declarator.init.type !== 'TSAsExpression'
            && declarator.init.type !== 'TSSatisfiesExpression'
          )
        ) {
          context.report({
            node: declarator,
            messageId: 'satisfiesCssLayout',
          })
          return
        }

        // Must be "as const satisfies CssLayout"
        // Traverse "as const" and "satisfies CssLayout"
        // We'll allow various TS AST permutations (as const) satisfies CssLayout
        function isAsConstSatisfiesCssLayout(expr: TSESTree.TSAsExpression | TSESTree.TSSatisfiesExpression) {
          if (expr.type === 'TSSatisfiesExpression') {
            // check type is CssLayout
            if (
              expr.typeAnnotation.type === 'TSTypeReference'
              && expr.typeAnnotation.typeName.type === 'Identifier'
              && expr.typeAnnotation.typeName.name === 'CssLayout'
            ) {
              // left should be TSAsExpression "as const"
              if (
                expr.expression.type === 'TSAsExpression'
                && expr.expression.typeAnnotation.type === 'TSTypeReference'
              ) {
                // if (
                //   (expr.expression.typeAnnotation.literal.type === 'Identifier'
                //     && expr.expression.typeAnnotation.literal.name === 'const')
                //   || (expr.expression.typeAnnotation.literal.type === 'TSLiteralType'
                //     && expr.expression.typeAnnotation.literal.literal.type === 'Identifier'
                //     && expr.expression.typeAnnotation.literal.literal.name === 'const')
                // ) {
                // return true
                // }

                // TypeScript-ESLint TSESTree types
                if (expr.type === 'TSSatisfiesExpression') {
                  // expr.typeAnnotation is usually a TSTypeReference
                  if (
                    expr.typeAnnotation.type === 'TSTypeReference'
                    && expr.typeAnnotation.typeName.type === 'Identifier'
                    && expr.typeAnnotation.typeName.name === 'CssLayout'
                  ) {
                    // Look at expr.expression: could be a TSAsExpression
                    if (expr.expression.type === 'TSAsExpression') {
                      const asExpr = expr.expression
                      if (
                        asExpr.typeAnnotation.type === 'TSTypeReference'
                        && asExpr.typeAnnotation.typeName.type === 'Identifier'
                        && asExpr.typeAnnotation.typeName.name === 'const'
                      ) {
                        // => This is "as const satisfies CssLayout"
                        return true
                      }
                    }
                  }
                }
              }
            }
          }
          return false
        }

        if (!isAsConstSatisfiesCssLayout(declarator.init)) {
          context.report({
            node: declarator,
            messageId: 'satisfiesCssLayout',
          })
        }
      },
    }
  },
})
