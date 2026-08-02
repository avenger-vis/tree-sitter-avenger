# Avenger SQL base

The combined Avenger grammar extends the `avenger_sql` grammar at generation
time. The initial composition candidate is pinned to:

| Field | Value |
| --- | --- |
| Repository | `https://github.com/avenger-vis/tree-sitter-avenger-sql` |
| Revision | `eb90082c73ada5aa8ef0f66ed73b1444ce4501db` |
| Package | `@avenger-vis/tree-sitter-avenger-sql` 0.1.0 |
| Tree-sitter CLI / ABI | 0.26.3 / 15 |

The root `package.json` and npm lock fetch the package archive for this exact
full Git revision over HTTPS. A sibling checkout is needed only to audit or
update synchronized scanner, query, keyword, and provenance artifacts;
ordinary generation imports the locked package from `node_modules`.

The base grammar object is imported directly; its rule graph is never copied.
The external scanner and SQL highlight query must be physical files in the
derived parser package, so `scripts/sync_sql_base.mjs` synchronizes them and
records their content hashes in `vendor/sql-base.json`. The same check also
locks the base keyword inventory used by structural-name adapters and the
scanner sanitizer harness.

```sh
node scripts/sync_sql_base.mjs \
  --sql-root /path/to/tree-sitter-avenger-sql \
  --check
```

Never edit a synchronized file in this repository. Update the SQL base first,
pin a new immutable revision here, run the synchronization command without
`--check`, review generated/parser/query changes, and run both repositories'
full suites.

## SQL-base upgrade procedure

1. Land and fully test the SQL change in `tree-sitter-avenger-sql` first.
2. Record its immutable full commit and update the pin in
   `scripts/sync_sql_base.mjs`, this document, and the package dependency.
3. Run the sync command without `--check`; never hand-edit synchronized scanner,
   harness, SQL capture, or metadata files.
4. Regenerate the combined parser and review `src/node-types.json`, parser
   metrics, and composed highlight changes.
5. Run corpus, compiler fixtures, native/Wasm, incremental, fuzz, sanitizer,
   Rust, and package audits in both repositories.
6. Update the recorded performance evidence and downstream immutable pin only
   after the combined candidate is committed.

## Structural DSL change procedure

Land normative syntax, strict parser/AST behavior, and compiler-owned fixture
manifests in Avenger first. Then update the Avenger revision pin, synchronize
the fixture corpus, implement the tolerant grammar, review named-node and query
changes, and run the same full validation contract. Tree-sitter recovery must
not become a second source of language validity.
