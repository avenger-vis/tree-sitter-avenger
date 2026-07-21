# tree-sitter-avenger

Tree-sitter grammar for the Avenger visualization language. It provides one
incremental syntax tree for the structural DSL and its embedded SQL queries and
expressions.

This is a tolerant editor parser. The strict Rust frontend in the Avenger
repository remains authoritative for syntax validity, schema rules, name and
import resolution, typing, and compilation. A clean Tree-sitter parse means the
source is structurally useful to an editor; it does not guarantee that the
chart compiles.

The grammar extends the pinned `tree-sitter-avenger-sql` grammar at generation
time. SQL expressions and queries therefore appear as direct descendants in a
single Avenger syntax tree. See [SQL_BASE.md](SQL_BASE.md) for the immutable
base revision and synchronization policy.

## Supported language surface

The grammar covers Avenger v1 `.avenger` and `.data.avenger` sources:

- version headers, imports, charts, mark/tool/transform definitions, and
  catalog/schema/table roots;
- every structural declaration, property/value form, event action, definition
  interface form, and physical Arrow type;
- direct inherited SQL query and expression nodes, including `$binding.path`
  and `@start`/`@previous`;
- composed highlights, brackets, and indentation queries.

Native and custom kinds remain generic identifiers. The grammar does not embed
a registry of marks, coordinates, transforms, tools, widgets, or properties.
See [the node contract](docs/node-contract.md) for the stable editor API.

```avenger
avenger 1;
import './catalog.data.avenger' as data;

chart cartesian as movies {
  param as minimum_rating { type: float64; default: 7; }
  sql: FROM vega.movies AS m
       SELECT m.title, m.rating
       WHERE m.rating >= $minimum_rating;
  mark symbol as points {
    x: "rating";
    tooltip: "title";
  }
}
```

## Development

Generation currently expects the pinned `tree-sitter-avenger-sql` checkout and
the Avenger compiler-contract checkout as sibling directories:

```sh
npm ci
npm run sync:sql-base -- --sql-root ../tree-sitter-avenger-sql --check
npm run generate
npm test
npm run test:highlights
npm run test:fixtures
npm run test:wasm
npm run test:fixtures:wasm
npm run test:scanner-sanitizers
cargo test --release
cargo clippy --release --all-targets -- -D warnings
npm run sync:fixtures -- --avenger-root ../avenger --check
```

Generated parser sources and composed queries are committed. Run
`npm run check-generated` from a clean worktree to verify deterministic
generation. Never edit `vendor/avenger_sql_scanner.c`,
`queries/sql-highlights.scm`, or the SQL section of `queries/highlights.scm`
directly.

Run `npm run test:fuzz` explicitly for the bounded Tree-sitter fuzz suite. The
ignored Rust performance test records local clean/incremental evidence:

```sh
cargo test --release --test performance -- --ignored --nocapture
```

The synchronized compiler corpus contains 120 reviewed sources: 93 valid
chart/definition/data roots, 10 strict-invalid recovery sources, and 17 lexical
fragments. Normal parser and Cargo tests use the checked copies and do not read
a sibling checkout.

## Supported bindings

The repository initially publishes the generated C parser/header and a minimal
Rust binding. Other language bindings and release packaging will be added only
for identified consumers.

## Compatibility

Before 1.0, named nodes, fields, and grammar-owned query captures are treated
as an explicit compatibility surface. Changes require a reviewed generated
node-type diff, corpus/query updates, and downstream Zed review. Patch releases
preserve that surface.

The current `file:` npm dependency is intentionally local-only. Do not publish
or pin this grammar downstream until the SQL base has a fetchable immutable
repository revision and the dependency/lock are updated accordingly.
