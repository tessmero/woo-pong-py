/**
 * @file valid-key-type.ts
 *
 * Restrict structure and naming conventions for key enum types files.
 * Example: freecam-layout-keys.ts
 *
 *   export const FREECAM_LAYOUT_KEYS = [
 *     'configBtn',
 *     'chessBtn',
 *     'musicBtn',
 *   ] as const
 *
 *   export type FreecamLayoutKey = (typeof FREECAM_LAYOUT_KEYS)[number]
 *
 * Must export an array of unique strings and a corresponding type.
 * Names must match the filename and end with KEYS / Key.
 *
 */

import { ESLintUtils, TSESTree } from '@typescript-eslint/utils'

export default ESLintUtils.RuleCreator.withoutDocs({
  // name: 'valid-key-type',
  meta: {
    type: 'problem',
    docs: {
      description: `
      Restrict structure and naming conventions for key enum types files. 
      Must export a const array of unique strings named ALL_CAPS
       ending with _KEYS, and a type named PascalCase ending with Key.`,
    },
    fixable: undefined,
    schema: [
      {
        type: 'object',
        properties: {
          allowedSuffixes: {
            type: 'array',
            items: { type: 'string' },
            default: ['-keys.ts', '-urls.ts'],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      keysFilename: 'Filename for key type must end with one of: {{suffixes}}',
      exportConstArray: 'Must export an array like "export const {{expected}} = [...] as const"',
      exportType: 'Must export a type referencing the array, e.g. (typeof ARRAY_NAME)[number].',
      arrayNameMatchesType: 'Type name must match PascalCase version of array name: {{expected}}',
      uniqueStrings: 'Array must contain only unique string values. Duplicate: {{duplicate}}',
      nonNumeric: 'Array must contain non-numeric values',
    },
  },
  defaultOptions: [{ allowedSuffixes: ['-keys.ts', '-urls.ts'] }],

  /* eslint-disable max-lines-per-function */
  create(context) {
    const options = context.options[0] || {}
    const allowedSuffixes: Array<string> = options.allowedSuffixes || ['-keys.ts', '-urls.ts']
    let exportedArrayDecl: TSESTree.ExportNamedDeclaration | undefined
    let exportedTypeDecl: TSESTree.ExportNamedDeclaration | undefined

    return {
      Program(node) {
        // Check filename first
        const filename = context.getFilename()
        const matchesSuffix = allowedSuffixes.some(suffix => filename.endsWith(suffix))
        if (!matchesSuffix) {
          context.report({
            node,
            messageId: 'keysFilename',
            data: { suffixes: allowedSuffixes.join(', ') },
          })
          return
        }

        // Find named exports
        const exports = node.body.filter(
          (stmt): stmt is TSESTree.ExportNamedDeclaration =>
            stmt.type === 'ExportNamedDeclaration',
        )

        // Find exported const array
        exportedArrayDecl = exports.find((exp) => {
          if (!exp.declaration || exp.declaration.type !== 'VariableDeclaration') return false
          const decl = exp.declaration as TSESTree.VariableDeclaration
          if (decl.kind !== 'const') return false
          const firstDecl = decl.declarations[0]
          return (
            firstDecl.id.type === 'Identifier'
            // && /^[A-Z0-9_]$/.test(firstDecl.id.name)
          )
        })
        if (
          !exportedArrayDecl
          || !exportedArrayDecl.declaration
          || exportedArrayDecl.declaration.type !== 'VariableDeclaration'
        ) {
          // Suggest expected array name from filename
          const base = (() => {
            for (const suffix of allowedSuffixes) {
              if (filename.endsWith(suffix)) {
                return filename
                  .replace(new RegExp(`.*/(.+)\\.ts$`), '$1')
                  .toUpperCase()
                  .replace(/-/g, '_')
              }
            }
            return 'ARRAY_KEYS'
          })()
          context.report({ node, messageId: 'exportConstArray', data: { expected: base } })
          return
        }

        // Check array is array of unique strings and non-numeric values
        const arrayDecl = exportedArrayDecl.declaration as TSESTree.VariableDeclaration
        const arrayDeclarator = arrayDecl.declarations[0]
        let arrayValues: Array<string> = []
        if (
          arrayDeclarator.init
          && arrayDeclarator.init.type === 'TSAsExpression'
          && arrayDeclarator.init.expression.type === 'ArrayExpression'
        ) {
          const elements = arrayDeclarator.init.expression.elements
          let hasNumeric = false
          let hasStringifiedNumber = false
          arrayValues = []
          for (const e of elements) {
            if (!e) {
              continue
            }
            if (e.type === 'Literal') {
              if (typeof e.value === 'string') {
                arrayValues.push(e.value)
                // Check for stringified number
                if (/^\d+$/.test(e.value)) {
                  hasStringifiedNumber = true
                }
              }
              else if (typeof e.value === 'number') {
                hasNumeric = true
              }
            }
          }
          // Find duplicate value if any
          const seen = new Set<string>()
          let duplicate: string | undefined
          for (const v of arrayValues) {
            if (seen.has(v)) {
              duplicate = v
              break
            }
            seen.add(v)
          }
          if (duplicate !== undefined) {
            context.report({ node: arrayDeclarator, messageId: 'uniqueStrings', data: { duplicate } })
          }
          if (hasNumeric || hasStringifiedNumber) {
            context.report({ node: arrayDeclarator, messageId: 'nonNumeric' })
          }
        }
        else {
          context.report({ node: arrayDeclarator, messageId: 'exportConstArray' })
        }

        // Find exported type
        exportedTypeDecl = exports.find((exp) => {
          if (!exp.declaration || exp.declaration.type !== 'TSTypeAliasDeclaration') return false
          const decl = exp.declaration as TSESTree.TSTypeAliasDeclaration
          return (
            decl.id.type === 'Identifier'
            // && /Key$/.test(decl.id.name)
          )
        })
        if (
          !exportedTypeDecl
          || !exportedTypeDecl.declaration
          || exportedTypeDecl.declaration.type !== 'TSTypeAliasDeclaration'
        ) {
          context.report({ node, messageId: 'exportType' })
          return
        }

        // Check type references array
        const typeDecl = exportedTypeDecl.declaration as TSESTree.TSTypeAliasDeclaration
        if (
          typeDecl.typeAnnotation.type === 'TSIndexedAccessType'
          && typeDecl.typeAnnotation.objectType.type === 'TSTypeQuery'
          && typeDecl.typeAnnotation.objectType.exprName.type === 'Identifier'
        ) {
          const arrayName = arrayDeclarator.id.type === 'Identifier' ? arrayDeclarator.id.name : ''
          const typeArrayName = typeDecl.typeAnnotation.objectType.exprName.name
          if (arrayName !== typeArrayName) {
            // Report exportConstArray with expected name if array name does not match filename
            const base = (() => {
              for (const suffix of allowedSuffixes) {
                if (filename.endsWith(suffix)) {
                  return filename
                    .replace(new RegExp(`.*/(.+)${suffix.replace('.', '\\.')}$`), '$1')
                    .toUpperCase()
                    .replace(/-/g, '_') + '_KEYS'
                }
              }
              return 'ARRAY_KEYS'
            })()
            context.report({ node: arrayDeclarator, messageId: 'exportConstArray', data: { expected: base } })
          }
        }
        else {
          context.report({ node: typeDecl, messageId: 'exportType' })
        }

        // Check type name matches PascalCase version of array name
        const arrayName = arrayDeclarator.id.type === 'Identifier' ? arrayDeclarator.id.name : ''
        const expectedTypeName = arrayName
          .toLowerCase()
          .replace(/(^|_)([a-z])/g, (_, __, l) => l.toUpperCase()).slice(0, -1)
        if (typeDecl.id.name !== expectedTypeName) {
          context.report({ node: typeDecl, messageId: 'arrayNameMatchesType', data: { expected: expectedTypeName } })
        }
      },
    }
  },
})
