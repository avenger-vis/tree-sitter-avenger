# Generation-time SQL composition report

Date: 2026-07-21

SQL base: `tree-sitter-avenger-sql`
`0198a1f7a8fe21e0af976859042f7910d57eaad0`

Tree-sitter CLI: 0.26.3, ABI 15

## Result

Generation-time base-grammar extension is accepted. The spike imports the
published grammar object and references inherited `_query` and `_expression`
rules directly from four representative DSL wrappers. It requires no opaque SQL
range token, injection query, copied rule graph, or broad GLR conflict. Runtime
SQL injection remains a documented fallback, but the spike produced no signal
that justifies adopting it.

The only derived disambiguation is static precedence for an empty structural
anonymous body versus an empty SQL struct expression inside a structural array.
Non-empty bodies distinguish naturally by their structural semicolon versus SQL
comma syntax.

## Size comparison

| Parser | States | Large states | Symbols | Tokens | Fields | `parser.c` bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| standalone `avenger_sql` | 2,450 | 25 | 215 | 129 | 28 | 3,546,204 |
| minimal derived composition | 2,498 | 24 | 236 | 138 | 30 | 3,573,547 |
| obsolete legacy combined parser | 4,686 | 16 | 346 | 196 | 88 | 4,750,682 |

The four wrapper families add 48 states and 27,343 bytes over the standalone
base. The valid 624-byte all-context fixture parsed in 0.18 ms (about 3,503
bytes/ms) on the Apple M4 Pro planning machine. Full structural grammar growth
must still be measured by the umbrella implementation, but the base-extension
overhead itself is small.

## Proven behavior

- `sql_query` directly contains inherited standard and `FROM`-first query
  trees; the wrapper owns the terminating semicolon.
- `sql_property_expression` stops before a structural configuration body.
- `sql_terminated_expression` preserves SQL braces inside CASE, escaped,
  ordinary, dollar, and hex literals while the wrapper owns its semicolon.
- `sql_array_expression` keeps SQL arrays, structs, calls, subqueries, and their
  commas inside one inherited expression while the structural array owns item
  commas and `]`.
- Structural arrays also preserve anonymous body, `value`, `pattern`, and
  `none` alternatives.
- Binding roots/members, adjacent temporal qualifiers, store relations, JSON
  access, functions, casts, windows, CTEs, values, and set operations remain
  the exact inherited named nodes.
- `FROM vega.movies AS m SELECT m.` retains the relation and alias despite a
  local projection error.
- A missing function closer and an unterminated quoted string preserve the next
  wrapper sibling. The latter finding produced a base-grammar recovery rule
  that stops an invalid quote token at DSL boundary characters while complete
  multiline strings still win by token length.
- The synchronized scanner builds with derived symbol names through a thin
  wrapper; the scanner body is byte-identical to the pinned base and hash
  checked.
- The combined highlight query is the exact synchronized SQL query plus two
  structural patterns. Deterministic capture assertions prove inherited query,
  relation, alias, function, operator, literal, binding, temporal, and property
  captures without `injections.scm`.
- Native corpus, Wasm corpus, and 100-iteration/8-edit Tree-sitter fuzz runs
  pass. Fuzz seed: `10694216584646832522`.

## Default versus fallback

| Concern | Generation-time extension | Runtime injection fallback |
| --- | --- | --- |
| Syntax tree | one direct tree with inherited descendants | separate structural and injected trees |
| Boundary ownership | LR context plus exact SQL tokens | opaque range scanner/injection ranges required |
| Binding/query nodes | directly reusable | editor features must cross injection boundaries |
| Highlighting | one composed query | injection registration and query layering |
| Measured complexity | +48 states over SQL base | not built because no failure criterion was met |
| Recovery evidence | following siblings retained in checked fixtures | would require a second boundary/recovery design |

Runtime injection should be reconsidered only if the full structural grammar,
unlike this spike, causes pathological state growth, broad conflicts, greedy
recovery, or unacceptable per-keystroke performance. It must not be adopted
merely to avoid ordinary local grammar factoring.

## Reproduction

```sh
node ../scripts/sync_sql_base.mjs \
  --sql-root /path/to/tree-sitter-avenger-sql \
  --check
npm ci
npm test
npx tree-sitter fuzz --iterations 100 --edits 8
npm run test:wasm
```
