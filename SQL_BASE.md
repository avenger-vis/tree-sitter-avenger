# Avenger SQL base

The combined Avenger grammar extends the `avenger_sql` grammar at generation
time. The initial composition candidate is pinned to:

| Field | Value |
| --- | --- |
| Repository | `https://github.com/avenger-vis/tree-sitter-avenger-sql` |
| Revision | `9ed9a6d5badfd34ec03e69c8cc5b3ec67c9d1553` |
| Package | `@avenger-vis/tree-sitter-avenger-sql` 0.1.0 |
| Tree-sitter CLI / ABI | 0.26.3 / 15 |

`composition-smoke/package.json` uses a declared sibling `file:` dependency for
local development until this revision is fetchable. It is not the publication
lock. Before publishing the combined grammar, replace the local dependency with
the repository URL and full revision above, regenerate the lock, and verify the
same generated metrics and corpus.

The base grammar object is imported directly; its rule graph is never copied.
The external scanner and SQL highlight query must be physical files in the
derived parser package, so `scripts/sync_sql_base.mjs` synchronizes them and
records their content hashes in `composition-smoke/vendor/sync.json`.

```sh
node scripts/sync_sql_base.mjs \
  --sql-root /path/to/tree-sitter-avenger-sql \
  --check
```

Never edit a synchronized file in this repository. Update the SQL base first,
pin a new immutable revision here, run the synchronization command without
`--check`, review generated/parser/query changes, and run both repositories'
full suites.
