# Legacy grammar migration

This document freezes the evidence and disposition for replacing the obsolete
Avenger grammar with the v1 derived grammar. The replacement preserves history;
it does not incrementally modify the old grammar or advertise its syntax as a
compatibility surface.

## Immutable legacy reference

The last commit whose repository root is exclusively the legacy grammar is:

```text
2661a76a1796b34b0c16afb5fed35cc81e45b807
```

It is preserved locally as the annotated tag `legacy/avenger-v0-root`. The
existing release tags remain untouched; `v0.0.5` points to the older
`5796b33bc731810ad309acf5a5dbba7048678e43` and therefore is not a sufficient
reference for the final legacy root.

Generated with Tree-sitter ABI 15, the preserved parser has 4,686 states, 16
large states, 346 symbols, 196 tokens, 88 fields, and a 4,750,682-byte
`src/parser.c`. Its 488 top-level grammar rules combine an obsolete structural
language with a broad SQL grammar. The eleven `.avgr` examples are retained by
Git and the tag, not copied into the v1 corpus.

## Accepted replacement architecture

The v1 root extends `avenger_sql` at generation time and references inherited
`_query` and `_expression` rules directly. The completed composition spike at
`f5c13e6b5720559db5f53b7f9c6bea0eb1c6faf5` adds only 48 states and 31,609
bytes over SQL base `9ed9a6d5badfd34ec03e69c8cc5b3ec67c9d1553`, while retaining direct SQL
descendants, local recovery, native/Wasm parsing, and composed highlights.

This evidence makes generation-time extension the accepted architecture.
Runtime injection or opaque SQL-range scanning is reconsidered only if the full
grammar later shows measured pathological growth, boundary corruption, or
unacceptable incremental performance.

## Package and generation policy

- Package, crate, and grammar version: `0.1.0` until a reviewed pre-1.0 bump.
- Grammar name: `avenger`; scope: `source.avenger`; file type: `.avenger`.
- Initial supported surfaces: JavaScript grammar composition, committed C
  parser/header, minimal C and Rust bindings/tests, and Wasm verification.
- Generated `src/parser.c`, `src/grammar.json`, `src/node-types.json`, and
  template-managed headers are committed and never hand-edited.
- `tree-sitter-cli` and the Rust runtime are pinned to 0.26.3 / ABI 15.
- Native Node, Go, Python, Swift, Zig, CMake, Make, pixi, prebuild, and generic
  release machinery are removed until an identified consumer requires them.
- The SQL sibling currently has no public `origin`; its only remote is the
  disabled-push upstream fork source. A declared `file:` dependency is allowed
  for local generation, but no publishable lock or immutable candidate may use
  it. Publication remains gated on a fetchable full SQL revision.

## Tracked artifact disposition

Every path tracked at `f5c13e6` is covered below.

| Existing path or exact family | Disposition | v1 treatment |
| --- | --- | --- |
| `.editorconfig` | retain | Preserve basic repository formatting. |
| `.gitattributes` | replace | Keep generated-source markers only for retained surfaces. |
| `.gitignore` | replace | Ignore Node, Rust, C, Wasm, and package outputs only. |
| `.github/workflows/publish.yml` | remove | Mutable reusable publish workflow is not part of implementation. |
| `.github/workflows/release.yml` | remove | Replace with locked CI; publishing requires separate authorization. |
| `README.md` | replace | Document v1 scope, authority, commands, packaging, and limitations. |
| `SQL_BASE.md` | adapt | Promote spike dependency and synchronization policy to root authority. |
| `LICENSE` | add | Preserve MIT terms and both historical SQL and Avenger attribution. |
| `grammar.js` | replace | ES-module extension of the immutable SQL base. |
| `grammar/` | add | Modular v1 structural roots, declarations, values, Arrow types, helpers. |
| `package.json`, `package-lock.json` | replace | Version 0.1.0, CLI 0.26.3, grammar composition, stable command contract. |
| `tree-sitter.json` | replace | `.avenger` only; C and Rust bindings only. |
| `Cargo.toml`, `Cargo.lock` | adapt | Version/runtime 0.1.0/0.26.3 and minimal test package. |
| `bindings/c/tree_sitter/tree-sitter-avenger.h` | retain/regenerate | Minimal public C language header. |
| `bindings/c/tree-sitter-avenger.pc.in` | remove | No pkg-config consumer in the initial package. |
| `bindings/rust/build.rs`, `bindings/rust/lib.rs` | adapt | Compile combined parser/scanner and export language/query constants. |
| `binding.gyp`, `bindings/node/**`, tracked `build/**` | remove | Native Node addon/prebuild surface is not required for grammar composition. |
| `go.mod`, `bindings/go/**` | remove | No Go consumer. |
| `pyproject.toml`, `setup.py`, `bindings/python/**` | remove | No Python consumer. |
| `Package.swift`, `bindings/swift/**` | remove | No Swift consumer. |
| `CMakeLists.txt`, `Makefile` | remove | Redundant generic build surfaces. |
| `pixi.toml`, `pixi.lock` | remove | Node and Cargo locks own reproducibility. |
| `queries/highlights.scm` | replace | Deterministic SQL plus structural capture composition. |
| `queries/brackets.scm` | replace | Structural and inherited SQL pairs against v1 nodes. |
| `queries/structural-highlights.scm` | add | Canonical structural capture source. |
| `queries/indents.scm` | add | Grammar-owned indentation contract. |
| `scripts/sync_sql_base.mjs` | promote/adapt | Write/check root scanner, SQL captures, metadata, and composed query. |
| `scripts/sync_avenger_fixtures.mjs` | add | Write/check compiler-owned structural fixtures and provenance. |
| `scripts/check_generated.sh` | add | Regenerate and reject committed-source drift. |
| `scripts/measure_parser.mjs` | add | Record/check parser shape and timing evidence. |
| `scripts/test_highlights.mjs` | add | Deterministic query compilation/capture assertions. |
| `src/parser.c`, `src/grammar.json`, `src/node-types.json` | replace | Regenerate from the sole v1 root grammar. |
| `src/tree_sitter/{alloc.h,array.h,parser.h}` | regenerate | Template-managed 0.26.3 headers. |
| `src/scanner.c` | add/promote | Thin symbol-renaming wrapper around synchronized SQL scanner. |
| `vendor/avenger_sql_scanner.c`, `vendor/sql-base.json` | promote | Hash-checked immutable SQL artifacts. |
| `tests/*.avgr` | retire | Obsolete syntax; exact files listed below and preserved by the legacy tag. |
| `test/corpus/**`, `test/fixtures/**`, `tests/*.rs` | replace/add | Reviewed v1 trees, synchronized compiler corpus, recovery/incremental/query tests. |
| `composition-smoke/**` | promote then remove | Transfer its proven wrapper, scanner sync, captures, tests, and metrics to root; do not retain a second grammar. |

The tracked `build/` directory is an accidental native-addon artifact and is
deleted with the Node binding. No generated binary is retained.

## Legacy rule-family disposition

| Legacy family | Representative rules | Disposition and reason |
| --- | --- | --- |
| obsolete root | `file`, `statement` | Replace with `source_file`, version/imports, and v1 root families. |
| obsolete lexical split | `identifier`, `pascal_identifier`, `table_identifier`, `variable_reference` | Remove; inherit the single SQL-base identifier/binding contract. |
| obsolete type/function language | `type`, `function_def`, `parameter_decl`, `fn_statement`, `return_statement` | Remove; definitions are mark/tool/transform structural roots and Arrow types are closed DSL syntax. |
| obsolete imports | `import_item`, `import_path`, old `import_statement` | Replace with one path, optional hash, optional alias. |
| obsolete properties/components | `val_prop`, `expr_prop`, `dataset_prop`, `comp_prop`, `comp_instance`, `prop_binding` | Remove; none is reachable in v1. |
| embedded SQL entry | `sql_expr_or_query`, `sql_query`, `sql_expression` | Remove copied graph; use four wrappers over inherited `_query`/`_expression`. |
| broad statement/query SQL | `_cte`, `cte`, `set_operation`, `select_statement`, `select`, `from`, relations/joins/clauses | Remove local copies; inherit the aggressively trimmed SQL base. |
| broad expression SQL | object/field, call, case, cast, interval, window, unary/binary, literal, subquery, array rules | Remove local copies; inherit stable base nodes and precedence. |
| broad SQL types | `_type` and all integer/string/time/vendor constructors | Remove; SQL cast types remain base-owned and physical Arrow types are a separate structural module. |
| legacy comments/literals | `comment`, `slash_comment`, `marginalia`, old quote/number rules | Remove; inherit exact line/block comments, strings, quoted identifiers, and numbers. |
| keyword inventory | `keyword_*`, helper compounds | Remove local 250+ inventory; structural keywords are contextual literals and SQL keywords remain base-owned. |
| conflicts/precedence/supertypes | all legacy declarations | Replace only with conflicts or precedence demonstrated by v1 corpus evidence. |

The eleven retired fixtures are `binary_op.avgr`, `direct_comp_instance.avgr`,
`function_test.avgr`, `function_with_param.avgr`,
`function_with_return_kind.avgr`, `function_with_val.avgr`,
`minimal_function.avgr`, `minimal_function_with_return_kind.avgr`,
`simple_function.avgr`, `simple_param_function.avgr`, and `test.avgr`.

## Migration exit conditions

The spike may be removed only after the root grammar reproduces its direct SQL
composition, scanner-symbol wrapper, query composition, native/Wasm tests, and
recorded metrics. The v1 corpus must contain no reachable legacy node. Git and
`legacy/avenger-v0-root` remain the only compatibility archive.
