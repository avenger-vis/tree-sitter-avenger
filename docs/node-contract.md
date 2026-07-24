# Public node contract

`src/node-types.json` is the machine-readable authority for the Avenger
Tree-sitter API. This document identifies the named nodes and fields editor
consumers should use. The strict Rust parser remains the validity and semantic
authority; a clean editor parse is not proof that a chart compiles.

## Roots and shared structure

| Node | Stable fields | Role |
| --- | --- | --- |
| `source_file` | — | Ordered version, import, chart, definition, and data roots. Multiple roots are tolerated while editing. |
| `version_directive` | `version` | `avenger` header; a missing semicolon is tolerated for local recovery. |
| `import_statement` | `path`, optional `hash`, optional `alias` | Structural strings are ordinary single-quoted strings. |
| `chart_declaration` | `kind`, `body` | Chart root; an optional binder is an `as_clause` child. |
| `definition_declaration` | `kind`, `name`, `body` | Mark, tool, or transform definition. `kind` is a `definition_kind`; `body` is a `definition_body`. |
| `catalog_declaration`, `schema_declaration`, `table_declaration` | `kind`, `body` | Data roots or nested data declarations; binder is required as an `as_clause`. |
| `as_clause` | `name` | Uniform binder wrapper. Consumers should not infer binders from sibling order. |
| `body`, `param_body`, `definition_body`, `match_body` | — | Ordered structural containers with distinct syntactic roles. |
| `qualified_name` | `name`, repeated `member` | Shared public path node. DSL paths contain unquoted structural identifiers; inherited SQL paths may contain `name` wrappers and quoted identifiers. |

The grammar deliberately tolerates multiple roots and some misplaced
declarations. Schema and root legality belong to the compiler.

## Declarations

The declaration nodes below are the post-unification, pre-1.0 contract. This
intentionally removes the former source-oriented `store_declaration`,
`selection_declaration`, `group_declaration`, `overlay_declaration`,
`dimension_declaration`, and `channel_parameter_declaration` nodes. Those
concepts now appear through the unified nodes and closed kind fields described
below; consumers must not retain compatibility matches for the removed nodes.

All kind values are generic identifiers unless the syntax itself closes the
set. Native and third-party marks, transforms, tools, widgets, views,
coordinates, resources, and data providers therefore require no grammar edit.

| Family | Stable fields and named children |
| --- | --- |
| `param_declaration` | required `type` (`arrow_type` or closed `param_kind`), direct `name` after the structural `as` token, and `body: param_body` |
| `resource_declaration` | `kind`, `body`; required `as_clause` |
| `theme_declaration` | `kind`, and either `source` plus optional `hash`, or `value` |
| `mark_declaration` | `kind: identifier`, including contextual SQL `group`; required `body`; optional `as_clause` |
| `transform_declaration`, `view_declaration` | `kind`, `body`; optional `as_clause` |
| `tool_declaration` | `kind`, optional `body`; optional `as_clause`; a stateless form ends in `;` |
| `widget_declaration` | `kind`, `body`; required `as_clause` |
| `event_declaration` | `kind`, `body`; optional `as_clause` |
| `cell_declaration` | `kind`, optional `placement`, required `body`; optional `as_clause` |
| `plot_declaration` | `kind`, `body` |
| `variable_declaration` | closed `role: variable_role`, direct `name`, and `body`; there is no `as_clause` |
| `adjust_declaration` | required `kind` and `body`; `expr` is a closed `adjust_kind` with no binder, while registry kinds are identifiers with an optional `as_clause` |
| `derive_declaration` | required `kind`, `body`, and optional `as_clause` |
| `part_declaration`, `layer_declaration` | `name`, `body` |
| `level_declaration` | `value`, `body` |
| `when_declaration`, `row_declaration`, `key_declaration`, `fields_declaration`, `scale_edit_declaration`, `scale_hint_declaration`, `clause_declaration`, `equality_declaration`, `interval_declaration` | `body` |
| `predicate_entry` | direct keyed `name` and `body`, accepted only in the `predicate_body` owned by `equality_declaration` or `interval_declaration` |
| `field_declaration` | `type` before direct `name`; `nullable` is an anonymous keyword child |
| `slot_declaration` | `kind: slot_shape`, direct `name`, and optional `body`; `channel` is one of the closed slot shapes |
| `output_declaration` | either identity `name`, or `source: sql_aliased_expression` followed by structural `as` and public `name` |
| `export_declaration` | `source`, optional `alias` |
| `match_declaration` | `name`, `body: match_body`; ordered `match_arm` children each expose `name` and `body` |
| `block_splice` | `name: property_name` | A definition block slot invocation. The `property_name` leaf permits the same contextual spelling as properties. |

`visibility_modifier`, `definition_kind`, `theme_kind`, `param_kind`,
`variable_role`, `adjust_kind`, and `slot_shape` are closed
named keyword nodes. The grammar preserves definition items in source order
but does not enforce interface-before-implementation ordering.

## Actions

`set_action` exposes a structural qualified `target`, optional `time`, optional
`replacing_scopes_modifier`, and required `value`. The resolved target decides
whether the action updates a scalar param, store, selection, or the reserved
unqualified cursor. The value is either an SQL expression or `action_block`;
target category and modifier legality remain compiler-owned.

## Properties and values

`property` always exposes one `name: property_name` and one `value`. Stable
value nodes are:

- `anonymous_object` with `body`;
- `typed_object` with `kind` and `body`;
- `configured_expression` with `expression` and `configuration`;
- `typed_reference` with `kind` and `target`;
- `array` with ordered `array_element` children;
- `visual_value`, `dimension_value`, `pattern_value`, `environment_value`, and
  `none_value`;
- `event_targets`, `event_scope`, and `event_surface` for globally reserved
  event property names;
- the four SQL boundary wrappers below.

A bare structural identifier followed by `{` is a `typed_object`. Other valid
expression heads followed by `{` form a `configured_expression`. A leading
`{` at property-value start is always an Avenger `anonymous_object`; SQL struct
expressions remain available within SQL expression positions, including array
elements.

## SQL boundaries

| Node | Direct inherited content | Structural owner |
| --- | --- | --- |
| `sql_query` | `query` | Property colon and final semicolon |
| `sql_property_expression` | SQL expression node | Property colon and semicolon or configuration body |
| `sql_terminated_expression` | SQL expression node | Declaration/action colon or equals and final semicolon |
| `sql_aliased_expression` | SQL expression node | Output keyword on the left and top-level structural `as <name>;` on the right |
| `sql_array_expression` | SQL expression node | Outer Avenger array brackets and commas |

Inherited SQL nodes and fields retain the contract documented by the pinned
`avenger_sql` grammar. In particular, bindings expose `$binding.path` and an
optional `temporal_qualifier`; the combined grammar does not classify a
binding as a param or store.

## Physical Arrow types

`arrow_type` contains either `primitive_arrow_type` or
`parameterized_arrow_type`. Constructors and closed units have dedicated
`arrow_type_constructor`, `arrow_time_unit`, and `arrow_interval_unit` nodes.
Signed integer parameters use `arrow_signed_integer`; struct entries use
`arrow_struct_field` with `type` before the quoted `name`. Arity, ranges, unit
validity in a particular constructor, and duplicate fields are semantic
checks.

## Lexical ownership and tolerance

The pinned SQL base owns `identifier`, `quoted_identifier`, `number`, all SQL
string forms, comments, bindings, and temporal qualifiers. DSL names reuse the
same unquoted identifier token and reject `$`, `@`, and leading digits.
Structural string slots accept only `single_quoted_string`; escaped,
dollar-quoted, and hex strings remain available in SQL expressions.

SQL and DSL words are contextual. The tolerant grammar may retain a keyword
spelling as an `identifier` in a structural name position, and may accept an
uppercase inherited keyword token in an ambiguous structural recovery path.
Canonical lowercase DSL spelling and all semantic restrictions are enforced by
the strict compiler.

Tree-sitter may add `ERROR`, `MISSING`, or alternate recovery structure during
editing. Tooling should anchor to the nearest stable named ancestor and avoid
depending on exact error-node shape except where corpus tests explicitly pin
it.

Before 1.0, removing or renaming a named node, field, or grammar-owned query
capture requires a reviewed `node-types.json` diff, corpus/query updates, and a
downstream Zed compatibility review. Patch releases preserve this contract.
