# V1 grammar ownership map

This map assigns every normative EBNF production in `chart-dsl.md` to exactly
one grammar owner and public combined-tree role before node implementation is
frozen. Hidden choice/list plumbing may change without changing these roles.

## Shared lexical and SQL productions

| EBNF production | Owner | Combined-tree role |
| --- | --- | --- |
| `ident` | `avenger_sql` | inherited `identifier` |
| `column` | `avenger_sql` | inherited `quoted_identifier` |
| `string` | `avenger_sql` | inherited `single_quoted_string` |
| `number` | `avenger_sql` | inherited `number`; sign remains an operator/structural wrapper |
| `binding`, `temporal` | `avenger_sql` | inherited `binding_reference`, `temporal_qualifier` |
| comments and shared punctuation | `avenger_sql` lexical layer | inherited comment/token nodes and anonymous punctuation |
| `sql_expr` | `avenger_sql` | inherited `_expression` under one of four expression wrappers |
| `sql_query` | `avenger_sql` | inherited `_query` under `sql_query` |

## Source modules and common structure

| EBNF production | Combined grammar rule/node |
| --- | --- |
| `module` | `source_file`, with ordered version, imports, and module items |
| `version` | `version_directive` |
| named/namespace `import` | `import_statement`, `named_import_clause`, `import_specifier`, `namespace_import_clause` |
| module-item `export` | `exported_module_item` around the underlying declaration |
| `chart` | `chart_declaration`; optional chart binder is the direct `name` field |
| `define` | `definition_declaration` plus `definition_body` |
| catalog/schema/table items | hidden module-item choice plus `catalog_declaration`, `schema_declaration`, `table_declaration` |
| `kind` | structural `qualified_name` in every schema-owned open `kind:` field |
| nested declaration bind | `as_clause` with `name:` field |
| `qual` | `qualified_name` |
| `body` | `body` |
| `item`, `child`, `child_decl`, `resource` | hidden ordered choices; concrete children retain named nodes |
| nested component `visibility` | `visibility_modifier`; top-level module export is separate |

## Definitions and declarations

| EBNF production | Combined grammar rule/node |
| --- | --- |
| `slot`, `slot_shape`, `channel_param` | `slot_declaration` with direct `name`; `channel` is a closed `slot_shape` |
| `output` | `output_declaration`; explicit sources use `sql_aliased_expression`, identity outputs contain only `name` |
| definition output `export` | `export_declaration` (distinct from top-level `exported_module_item`) |
| `match_block`, `match_arm` | `match_declaration`, `match_arm` |
| `splice` | `block_splice` |
| scalar `param` | `param_declaration` with SQL `initializer`, direct `name`, and optional sharing body |
| store, selection | peer `store_declaration` / `selection_declaration` nodes with direct `name` and required body |
| `res` | `resource_declaration` |
| `theme` | `theme_declaration` |
| logical groups | ordinary `mark_declaration` with contextual `group` kind |
| continuous-colorbar overlays | schema-known `overlay` property block containing marks |
| `mark` | `mark_declaration` |
| `transform` | `transform_declaration` |
| `tool` | `tool_declaration` |
| `widget` | `widget_declaration` |
| `view` | `view_declaration` |
| `event` | `event_declaration` |
| `cell` | `cell_declaration` with separate `placement:` and `body:` fields |
| `plot` | `plot_declaration` |
| `variable` | `variable_declaration` with closed `role` and direct `name` |
| `part` | `part_declaration` |
| `level` | `level_declaration` |
| `adjust` | `adjust_declaration` |
| `derive` | `derive_declaration` |
| `layer` | `layer_declaration` |
| `when` | `when_declaration` |
| `field` | type-first `field_declaration` with structural `arrow_type` and direct `name` |
| `row` | `row_declaration` |
| `key` | `key_declaration` |
| `fields` | `fields_declaration` |
| `scale_edit` | `scale_edit_declaration` |
| `scale_hint` | `scale_hint_declaration` |
| `selection_clause` | `clause_declaration` |
| `equality_predicate` | `equality_declaration` with parent-owned `predicate_entry` children |
| `interval_predicate` | `interval_declaration` with parent-owned `predicate_entry` children |

There is deliberately no `id_declaration`; `id:` is an ordinary property.
There is deliberately no `define widget` alternative.

## Events, actions, and special references

| EBNF production | Combined grammar rule/node |
| --- | --- |
| `event_target` | `event_targets` or `typed_reference` selected by `target:` |
| `event_scope` | `event_scope` selected by `scope:` |
| `event_surface` | `event_surface` selected by `surface:` |
| `action` | `set_action` |
| `state_action`, `cursor_action` | one `set_action` with `target:` and `value:` fields; the compiler resolves target category and cursor restrictions |
| `typed_ref`, `ref_kind` | `typed_reference` and contextual kind token |

## Properties and values

| EBNF production | Combined grammar rule/node |
| --- | --- |
| `property` | `property`, with reserved-name dispatch for `sql`/`query` and structural event/type contexts |
| anonymous `body` value | `anonymous_object` |
| `ident body` value | `typed_object` |
| `sql_expr body` value | `configured_expression` containing `sql_property_expression` |
| `typed_ref` value | `typed_reference` |
| `(encoded | direct) sql_expr` | `channel_value` with named `mode` and `expression` fields |
| `dim qual` | `dimension_value` |
| `pattern body` | `pattern_value` |
| `env string` | `environment_value` |
| `none` | `none_value` |
| reserved query value | `sql_query` |
| reserved `expressions` projection list | `sql_projection_list` |
| self-identifying named projection list | `sql_named_projection_list` |
| ordinary terminated expression | `sql_property_expression` |
| `terminator` | hidden choice between structural `body` and `;` |
| `array`, `elem` | `array`, `array_element`, and `sql_array_expression`; channel qualifiers are not array elements |
| structurally terminated action expression | `sql_terminated_expression` |
| transform output source terminated by top-level `as` | `sql_aliased_expression` |

## Physical Arrow types

`arrow_type` is owned exclusively by `grammar/arrow_types.js`. Its public
roles are `arrow_type`, `primitive_arrow_type`, `parameterized_arrow_type`,
`arrow_type_arguments`, `arrow_struct_field`, `arrow_time_unit`,
`arrow_interval_unit`, `arrow_unsigned_integer`, and `arrow_signed_integer`.
It is reachable only from scalar param headers, `field_declaration`, and nested
`arrow_struct_field` arguments; ordinary properties named `type` remain
ordinary expressions.

The closed constructor inventory is the exact normative algebra: primitive
types; `time32`, `time64`, `timestamp`, `duration`, `interval`,
`fixed_size_binary`, `decimal128`, `decimal256`, `list`, `large_list`,
`fixed_size_list`, `struct`/`field`, and `map`. Arity, range, unit legality,
timezone validity, and duplicate-field checks remain compiler semantics.
