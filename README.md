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

The locked SQL grammar dependency is fetched from its immutable Git revision,
so ordinary generation and tests need only this checkout:

```sh
npm ci
npm run generate
npm test
npm run test:highlights
npm run test:fixtures
npm run test:wasm
npm run test:fixtures:wasm
npm run test:scanner-sanitizers
cargo test --release
cargo clippy --release --all-targets -- -D warnings
```

The SQL-base and compiler-fixture synchronization checks additionally use
checkouts at the revisions recorded in `SQL_BASE.md` and
`test/fixtures/avenger-fixtures.json`:

```sh
npm run sync:sql-base -- --sql-root ../tree-sitter-avenger-sql --check
npm run sync:fixtures -- --avenger-root ../avenger --check
```

Generated parser sources and composed queries are committed. Run
`npm run check-generated` from a clean worktree to verify deterministic
generation from the composed JavaScript grammar. CI additionally runs
`npm run check-generated:json`, which regenerates the parser and node contract
from the committed composed `src/grammar.json` without a sibling checkout.
Never edit `vendor/avenger_sql_scanner.c`,
`queries/sql-highlights.scm`, or the SQL section of `queries/highlights.scm`
directly.

Run `npm run test:fuzz` explicitly for the bounded Tree-sitter fuzz suite. The
ignored Rust performance test records local clean/incremental evidence:

```sh
cargo test --release --test performance -- --ignored --nocapture
```

From clean sibling checkouts at the pinned revisions, the complete local CI
contract is:

```sh
sh scripts/ci_local.sh ../tree-sitter-avenger-sql ../avenger
```

This contract passes from fresh clones on macOS and Linux ARM64 (Ubuntu 24.04,
Rust 1.82.0); the checked Linux evidence is recorded in
`test/metrics/linux-validation-2026-07-21.json`. Windows remains CI-only until
its first completed run and is not claimed as locally verified.

The workflow's cross-repository job checks out the exact SQL and Avenger
revisions and verifies synchronization plus complete JavaScript generation.

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

The SQL npm dependency is a package archive pinned to a full, fetchable Git
commit. SQL-base upgrades must update that dependency, its lock entry,
`SQL_BASE.md`, and the synchronization provenance together.
