# Generation-time SQL composition report

Recorded 2026-07-21 against `tree-sitter-avenger-sql`
`9ed9a6d5badfd34ec03e69c8cc5b3ec67c9d1553`, Tree-sitter CLI 0.26.3,
and ABI 15.

## Result

Generation-time base-grammar extension is accepted. The spike imported the
SQL grammar object and referenced inherited `_query` and `_expression` rules
directly from four representative DSL wrappers. It required no opaque SQL
range token, injection query, copied rule graph, or broad GLR conflict.

The only derived disambiguation was static precedence for structural bodies
and arrays versus SQL struct and array expressions. The repository-root v1
skeleton reproduced this behavior before the spike was removed.

## Size comparison

| Parser | States | Large states | Symbols | Tokens | Fields | `parser.c` bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| standalone `avenger_sql` | 2,460 | 48 | 219 | 132 | 28 | 3,638,952 |
| minimal composition spike | 2,508 | 51 | 240 | 141 | 30 | 3,670,561 |
| v1 repository-root skeleton | 2,536 | 53 | 246 | 141 | 33 | 3,685,000 |
| complete v1 derived parser | 3,376 | 857 | 464 | 253 | 40 | 7,316,089 |
| obsolete legacy combined parser | 4,686 | 16 | 346 | 196 | 88 | 4,750,682 |

The spike added 48 states and 31,609 bytes over the standalone base. Its valid
618-byte all-context fixture parsed in 0.17 ms (about 3,580 bytes/ms) on the
Apple M4 Pro planning machine. The first repository-root skeleton remained
close to that result while adding version, import, chart, body, and output
structure.

The complete v1 grammar remains below both the legacy parser's state count and
the 30,622-state upstream SQL parser, although contextual structural names and
the SQL-expression/DSL-value boundary produce more large parse states and a
larger generated table. All six declared conflicts were removed individually
during investigation and each produced its corresponding narrow generation
ambiguity. A 74.8 KB generated chart parses cleanly; local release measurements
recorded an 11.1 ms mean clean parse and a 1.8 μs mean prefix-only incremental
parse. This growth is understood and does not trigger the injection fallback.

## Proven behavior

- `sql_query` directly contains inherited standard and `FROM`-first queries.
- The four expression wrappers preserve direct inherited expression nodes,
  including the Avenger-owned top-level `as` boundary for output aliases.
- SQL-owned braces, brackets, commas, and semicolons remain inside SQL nodes;
  structural delimiters remain owned by the derived grammar.
- Binding paths and temporal qualifiers retain their SQL-base node identity.
- Invalid query projections, missing function closers, and unterminated quoted
  strings recover without consuming the following structural sibling.
- The synchronized external scanner builds under derived symbol names through
  a thin wrapper and is checked against a pinned content hash.
- SQL and structural highlight queries compose without `injections.scm`.
- Native, Wasm, and fuzz checks passed for the spike; repository-root parity
passed before retiring it.

The 2026-07-22 declaration unification records 3,845 states, 909 large states,
and an 8.40 MB generated parser. Relative to the immediately preceding
combined grammar (3,376 states, 857 large states, 7.32 MB), the state and table
growth comes from recursive physical types moving into param headers, the
fifth SQL boundary at top-level output `as`, and local recovery for direct-name
slots, variables, fields, and keyed predicate entries. It remains below the
4,686-state legacy combined parser and stayed within the existing performance
gate.

The 2026-07-24 ESM-style module revision records 3,703 states, 962 large
states, 461 symbols, 46 fields, and an 8.54 MB generated parser. It parses the
full synchronized 130-source compiler corpus cleanly where classified valid.
The added import/export/module fields and qualified structural kind paths stay
below the legacy state count and within the same performance gate.

## Default versus fallback

| Concern | Generation-time extension | Runtime injection fallback |
| --- | --- | --- |
| Syntax tree | one direct tree with inherited descendants | separate structural and injected trees |
| Boundary ownership | LR context plus exact SQL tokens | opaque range scanner/injection ranges required |
| SQL nodes | directly reusable | editor features cross injection boundaries |
| Highlighting | one composed query | injection registration and query layering |
| Measured complexity | small increase over SQL base | not built; no failure criterion was met |

Runtime injection should be reconsidered only if future structural growth
causes boundary corruption or unacceptable incremental performance. Current
full-corpus, mutation, fuzz, sanitizer, and performance evidence supports the
generation-time design.
