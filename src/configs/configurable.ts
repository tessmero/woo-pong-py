/**
 * @file configurable.ts
 *
 * Base class and registry for objects that
 * provide a flat, strong-typed views of a config trees.
 */
import type { ConfigurableName } from '../imp-names'
import type { ConfigTree } from './config-tree'

export abstract class Configurable<TConfigTree extends ConfigTree> {
  public abstract readonly tree: TConfigTree

  // assigned post-construction in create
  public flatConfig!: FlatConfigMap<TConfigTree>

  public refreshConfig(): void {
    this.flatConfig = flattenTree(this.tree)
  }

  // static registry pattern
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static _registry: Record<ConfigurableName, () => Configurable<ConfigTree>> = {} as any

  protected constructor() {}

  static register(name: ConfigurableName, factory: () => Configurable<ConfigTree>): void {
    if (name in this._registry) {
      throw new Error(`configurable already registered: '${name}'`)
    }
    this._registry[name] = factory
  }

  static create(name: ConfigurableName): Configurable<ConfigTree> {
    const factory = this._registry[name]
    const instance = factory()

    // Configurable
    // post-construction setup
    instance.refreshConfig()

    return instance
  }
}

// get flat key->value view of a tree with type T
export function flattenTree<TConfigTree extends ConfigTree>(
  tree: TConfigTree,
  out: Record<string, string | number> = {},
): FlatConfigMap<TConfigTree> {
  for (const [name, child] of Object.entries(tree.children)) {
    if ('action' in child) {
      // button, do nothing
    }
    else if ('value' in child) {
      out[name] = (child).value
    }
    else {
      flattenTree(child, out)
    }
  }
  return out as FlatConfigMap<TConfigTree>
}

// flat list of bottom-level keys
type AllLeafKeys<TConfigTree extends ConfigTree>
  = TConfigTree extends { children: infer P }
    ? { [K in keyof P]: P[K] extends ConfigTree ? AllLeafKeys<P[K]> : K }[keyof P]
    : never

// type for key K of tree T (string or number)
type LeafValueType<TConfigTree extends ConfigTree, TKey extends string>
  = TConfigTree extends { children: infer P }
    ? TKey extends keyof P
      ? P[TKey] extends { value: infer V }
        ? V
        : never
      : {
          [K2 in keyof P]: P[K2] extends ConfigTree
            ? LeafValueType<P[K2], TKey>
            : never
        }[keyof P]
    : never

// flat key -> value map
export type FlatConfigMap<TConfigTree extends ConfigTree> = {
  [TKey in AllLeafKeys<TConfigTree> & string]: LeafValueType<TConfigTree, TKey>
}
