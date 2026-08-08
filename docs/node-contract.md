# Public node contract

`src/node-types.json` is the machine-readable authority for the Avenger
Tree-sitter API. This document identifies the named nodes and fields editor
consumers should use. The strict Rust parser remains the validity and semantic
authority; a clean editor parse is not proof that a chart compiles.

## Roots and shared structure

| Node | Stable fields | Role |
| --- | --- | --- |
| `source_file` | repeated `item` | Ordered optional version, imports, and module items. The editor grammar tolerates an empty or import-only in-progress module; the strict parser requires at least one item. |
| `version_directive` | `version` | `avenger` header; a missing semicolon is tolerated for local recovery. |
| `import_statement` | `clause`, `source`, optional `hash` | A named or namespace clause followed by `from`; structural module sources and hashes are ordinary single-quoted strings. |
| `named_import_clause` | — | Ordered `import_specifier` children; trailing commas are accepted. |
| `import_specifier` | `imported`, optional `local` | A shorthand or `imported as local` binding. |
| `namespace_import_clause` | `local` | The local binder in `* as namespace`. |
| `exported_module_item` | `export`, `declaration` | Top-level export wrapper preserving the underlying chart, definition, catalog, schema, or table node. |
| `chart_declaration` | `kind`, optional direct `name`, `body` | Chart module item. Unlike nested `as`-bound declarations, its optional binder is a direct field for runnable queries. |
| `definition_declaration` | `kind`, `name`, `body` | Mark, tool, or transform definition. `kind` is a `definition_kind`; `body` is a `definition_body`. |
| `catalog_declaration`, `schema_declaration`, `table_declaration` | `kind`, `body` | Top-level module items or nested data declarations; binder is required as an `as_clause`. |
| `as_clause` | `name` | Uniform binder wrapper. Consumers should not infer binders from sibling order. |
| `body`, `param_body`, `definition_body`, `match_body` | — | Ordered structural containers with distinct syntactic roles. |
| `qualified_name` | `name`, repeated `member` | Shared public path node. DSL paths contain unquoted structural identifiers; inherited SQL paths may contain `name` wrappers and quoted identifiers. |

Every schema-owned kind position uses structural `qualified_name`, so imported
module members retain their path shape. The grammar deliberately tolerates
some misplaced declarations and incomplete module headers. Category, export,
schema, and module-item legality belong to the compiler.

## Declarations

The declaration nodes below are the post-unification, pre-1.0 contract.
Scalar params, stores, and selections are peer declarations: `param` owns a
SQL initializer, while `store` and `selection` are already complete categories
and have dedicated nodes. Logical groups remain ordinary mark declarations;
overlay, keyed predicate, and channel-slot concepts use their parent-owned
structural forms rather than standalone declaration nodes.

All open kind values are structural `qualified_name` nodes unless the syntax
itself closes the set. Native and third-party marks, transforms, tools, widgets, views,
coordinates, resources, and data providers therefore require no grammar edit.

| Family | Stable fields and named children |
| --- | --- |
| `param_declaration` | required SQL `initializer`, direct `name` after structural `as`, and either `;` or `body: param_body` |
| `store_declaration` | direct `name` after structural `as` and required `body: param_body` |
| `selection_declaration` | direct `name` after structural `as` and required `body: param_body` |
| `obsolete_state_param` | recovery-only node for removed `param store` / `param selection` headers; never canonical source |
| `resource_declaration` | `kind`, `body`; required `as_clause` |
| `theme_declaration` | `kind`, and either `source` plus optional `hash`, or `value` |
| `mark_declaration` | `kind: qualified_name`, including contextual SQL `group`; required `body`; optional `as_clause` |
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

`visibility_modifier`, `definition_kind`, `theme_kind`,
`variable_role`, `adjust_kind`, and `slot_shape` are closed
named keyword nodes. The grammar preserves definition items in source order
but does not enforce interface-before-implementation ordering.

Top-level item export is represented only by `exported_module_item`.
`export_declaration` is the distinct definition-body construct that publishes
an internal output path. Nested `private`/`public` visibility remains a
component concern; top-level visibility is rejected by the strict compiler.

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
- `channel_value` with `channel_mode`, `dimension_value`, `pattern_value`, `environment_value`, and
  `none_value`;
- `event_targets`, `event_scope`, and `event_surface` for globally reserved
  event property names;
- the SQL boundary wrappers below.

A bare structural identifier followed by `{` is a `typed_object`. Other valid
expression heads followed by `{` form a `configured_expression`. A leading
`{` at property-value start is always an Avenger `anonymous_object`; SQL struct
expressions remain available within SQL expression positions, including array
elements.

`channel_value` owns the contextual outer-language `encoded` and `direct`
qualifiers and embeds an unchanged SQL expression after the qualifier. Arrays
contain ordinary SQL expressions directly and never accept a channel mode.

## SQL boundaries

| Node | Direct inherited content | Structural owner |
| --- | --- | --- |
| `sql_query` | `query` | Property colon and final semicolon |
| `sql_projection_list` | SQL `projection` | Reserved `expressions:` property colon and final semicolon |
| `sql_named_projection_list` | one or more `sql_named_projection_item` nodes | Arbitrary property colon and final semicolon; every item owns a required explicit `AS` alias |
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
