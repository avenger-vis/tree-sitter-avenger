# tree-sitter-avenger

Tree-sitter grammar for the Avenger visualization language. This is a tolerant
editor parser; the Rust frontend in the Avenger repository remains authoritative
for strict syntax and semantic validation.

The grammar extends the pinned `tree-sitter-avenger-sql` grammar at generation
time. SQL expressions and queries therefore appear as direct descendants in a
single Avenger syntax tree. See [SQL_BASE.md](SQL_BASE.md) for the immutable
base revision and synchronization policy.

## Development

The initial checkout expects `tree-sitter-avenger-sql` as a sibling directory.

```sh
npm ci
npm run sync:sql-base -- --sql-root ../tree-sitter-avenger-sql --check
npm run generate
npm test
npm run test:highlights
npm run build:wasm
npm run test:wasm
cargo test --release
```

Generated parser sources and composed queries are committed. Run
`npm run check-generated` from a clean worktree to verify deterministic
generation. Never edit `vendor/avenger_sql_scanner.c`,
`queries/sql-highlights.scm`, or the SQL section of `queries/highlights.scm`
directly.

## Supported bindings

The repository initially publishes the generated C parser/header and a minimal
Rust binding. Other language bindings and release packaging will be added only
for identified consumers.
