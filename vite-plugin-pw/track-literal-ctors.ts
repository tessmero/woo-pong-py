/**
 * @file track-literal-ctors.ts
 *
 * Vite plugin to wrap literals [] and {} with functions.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Plugin } from 'vite'
import { parse } from '@babel/parser'

// @ts-expect-error import babel/traverse
import _traverse from '@babel/traverse'

// @ts-expect-error import babel/generator
import generate from '@babel/generator'

import * as t from '@babel/types'

const traverse = (typeof _traverse === 'function'
  ? _traverse
  : (_traverse as any).default) as typeof _traverse

const TRACK_OBJECT_FN = '__trackObject'
const TRACK_ARRAY_FN = '__trackArray'

/* eslint-disable max-lines-per-function */
export default function trackLiteralsPlugin(): Plugin {
  return {
    name: 'track-literals',
    enforce: 'post',

    transform(code, id) {
      if (!/\.(ts|tsx|js|jsx)$/.test(id) || id.includes('node_modules')) {
        return null
      }

      // Skip the runtime that defines the tracking functions
      if (id.endsWith('src/util/literal-ctor-tracker.ts')) {
        return null
      }

      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      })

      let changed = false

      traverse(ast, {
        ObjectExpression(path: any) {
          path.traverse({
            ObjectExpression(p: any) {
              if (
                t.isCallExpression(p.parent)
                && t.isIdentifier(p.parent.callee)
                && (p.parent.callee.name === TRACK_OBJECT_FN
                  || p.parent.callee.name === TRACK_ARRAY_FN)
              ) {
                return
              }

              const loc = p.node.loc
              const meta = t.objectExpression([
                t.objectProperty(t.identifier('file'), t.stringLiteral(id)),
                loc
                  ? t.objectProperty(
                      t.identifier('line'),
                      t.numericLiteral(loc.start.line),
                    )
                  : null,
              ].filter(Boolean) as Array<t.ObjectProperty>)

              const wrapped = t.callExpression(
                t.identifier(TRACK_OBJECT_FN),
                [p.node as any, meta],
              )

              p.replaceWith(wrapped)
              changed = true
            },
            ArrayExpression(p: any) {
              if (
                t.isCallExpression(p.parent)
                && t.isIdentifier(p.parent.callee)
                && (p.parent.callee.name === TRACK_OBJECT_FN
                  || p.parent.callee.name === TRACK_ARRAY_FN)
              ) {
                return
              }

              const loc = p.node.loc
              const meta = t.objectExpression([
                t.objectProperty(t.identifier('file'), t.stringLiteral(id)),
                loc
                  ? t.objectProperty(
                      t.identifier('line'),
                      t.numericLiteral(loc.start.line),
                    )
                  : null,
              ].filter(Boolean) as Array<t.ObjectProperty>)

              const wrapped = t.callExpression(
                t.identifier(TRACK_ARRAY_FN),
                [p.node as any, meta],
              )

              p.replaceWith(wrapped)
              changed = true
            },
          })

          // Then, wrap the object itself if not already wrapped
          if (
            t.isCallExpression(path.parent)
            && t.isIdentifier(path.parent.callee)
            && (path.parent.callee.name === TRACK_OBJECT_FN
              || path.parent.callee.name === TRACK_ARRAY_FN)
          ) {
            return
          }

          const loc = path.node.loc
          const meta = t.objectExpression([
            t.objectProperty(t.identifier('file'), t.stringLiteral(id)),
            loc
              ? t.objectProperty(
                  t.identifier('line'),
                  t.numericLiteral(loc.start.line),
                )
              : null,
          ].filter(Boolean) as Array<t.ObjectProperty>)

          const wrapped = t.callExpression(
            t.identifier(TRACK_OBJECT_FN),
            [path.node as any, meta],
          )

          path.replaceWith(wrapped)
          changed = true
        },

        ArrayExpression(path: any) {
          path.traverse({
            ObjectExpression(p: any) {
              if (
                t.isCallExpression(p.parent)
                && t.isIdentifier(p.parent.callee)
                && (p.parent.callee.name === TRACK_OBJECT_FN
                  || p.parent.callee.name === TRACK_ARRAY_FN)
              ) {
                return
              }

              const loc = p.node.loc
              const meta = t.objectExpression([
                t.objectProperty(t.identifier('file'), t.stringLiteral(id)),
                loc
                  ? t.objectProperty(
                      t.identifier('line'),
                      t.numericLiteral(loc.start.line),
                    )
                  : null,
              ].filter(Boolean) as Array<t.ObjectProperty>)

              const wrapped = t.callExpression(
                t.identifier(TRACK_OBJECT_FN),
                [p.node as any, meta],
              )

              p.replaceWith(wrapped)
              changed = true
            },
            ArrayExpression(p: any) {
              if (
                t.isCallExpression(p.parent)
                && t.isIdentifier(p.parent.callee)
                && (p.parent.callee.name === TRACK_OBJECT_FN
                  || p.parent.callee.name === TRACK_ARRAY_FN)
              ) {
                return
              }

              const loc = p.node.loc
              const meta = t.objectExpression([
                t.objectProperty(t.identifier('file'), t.stringLiteral(id)),
                loc
                  ? t.objectProperty(
                      t.identifier('line'),
                      t.numericLiteral(loc.start.line),
                    )
                  : null,
              ].filter(Boolean) as Array<t.ObjectProperty>)

              const wrapped = t.callExpression(
                t.identifier(TRACK_ARRAY_FN),
                [p.node as any, meta],
              )

              p.replaceWith(wrapped)
              changed = true
            },
          })

          // Then, wrap the array itself if not already wrapped
          if (
            t.isCallExpression(path.parent)
            && t.isIdentifier(path.parent.callee)
            && (path.parent.callee.name === TRACK_OBJECT_FN
              || path.parent.callee.name === TRACK_ARRAY_FN)
          ) {
            return
          }

          const loc = path.node.loc
          const meta = t.objectExpression([
            t.objectProperty(t.identifier('file'), t.stringLiteral(id)),
            loc
              ? t.objectProperty(
                  t.identifier('line'),
                  t.numericLiteral(loc.start.line),
                )
              : null,
          ].filter(Boolean) as Array<t.ObjectProperty>)

          const wrapped = t.callExpression(
            t.identifier(TRACK_ARRAY_FN),
            [path.node as any, meta],
          )

          path.replaceWith(wrapped)
          changed = true
        },
      })

      if (!changed) return null

      const output = generate(
        ast,
        { sourceMaps: true, sourceFileName: id },
        code,
      )

      return {
        code: output.code,
        map: output.map,
      }
    },
  }
}
