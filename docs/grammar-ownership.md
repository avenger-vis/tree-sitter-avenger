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

## Source, root, and common structure

| EBNF production | Combined grammar rule/node |
| --- | --- |
| `file` | `source_file` |
| `version` | `version_directive` |
| `import` | `import_statement` |
| `chart` | `chart_declaration` |
| `define` | `definition_declaration` plus `definition_body` |
| `data_file` | repeated data-root declarations under `source_file` |
| `data_bind`, `catalog_bind`, `schema_bind`, `table_bind` | hidden root choice plus `catalog_declaration`, `schema_declaration`, `table_declaration` |
| `kind` | inherited `identifier` in a `kind:` field |
| `bind` | `as_clause` with `name:` field |
| `qual` | `qualified_name` |
| `body` | `body` |
| `item`, `child`, `child_decl`, `resource` | hidden ordered choices; concrete children retain named nodes |
| `visibility` | `visibility_modifier` |

## Definitions and declarations

| EBNF production | Combined grammar rule/node |
| --- | --- |
| `slot`, `slot_shape`, `channel_param` | `slot_declaration` with direct `name`; `channel` is a closed `slot_shape` |
| `output` | `output_declaration`; explicit sources use `sql_aliased_expression`, identity outputs contain only `name` |
| `export` | `export_declaration` |
| `match_block`, `match_arm` | `match_declaration`, `match_arm` |
| `splice` | `block_splice` |
| scalar `param`, store, selection | one `param_declaration` with direct `type`, `name`, and specialized param body; store/selection use `param_kind` |
| `res` | `resource_declaration` |
| `theme` | `theme_declaration` |
| group, overlay containers | one `container_declaration` with closed `container_kind` |
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
| `value sql_expr` | `visual_value` |
| `dim qual` | `dimension_value` |
| `pattern body` | `pattern_value` |
| `env string` | `environment_value` |
| `none` | `none_value` |
| reserved query value | `sql_query` |
| ordinary terminated expression | `sql_property_expression` |
| `terminator` | hidden choice between structural `body` and `;` |
| `array`, `elem` | `array`, `array_element`, and `sql_array_expression` |
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
