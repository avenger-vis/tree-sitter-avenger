; Avenger SQL syntax captures. Semantic schema/type distinctions belong to the LSP.

[
  (keyword_all)
  (keyword_and)
  (keyword_as)
  (keyword_asc)
  (keyword_between)
  (keyword_by)
  (keyword_case)
  (keyword_cast)
  (keyword_cross)
  (keyword_current)
  (keyword_date)
  (keyword_desc)
  (keyword_distinct)
  (keyword_double)
  (keyword_else)
  (keyword_end)
  (keyword_except)
  (keyword_exclude)
  (keyword_exists)
  (keyword_false)
  (keyword_filter)
  (keyword_first)
  (keyword_following)
  (keyword_from)
  (keyword_full)
  (keyword_group)
  (keyword_groups)
  (keyword_having)
  (keyword_ilike)
  (keyword_in)
  (keyword_inner)
  (keyword_intersect)
  (keyword_interval)
  (keyword_is)
  (keyword_join)
  (keyword_last)
  (keyword_lateral)
  (keyword_left)
  (keyword_like)
  (keyword_limit)
  (keyword_materialized)
  (keyword_natural)
  (keyword_no)
  (keyword_not)
  (keyword_null)
  (keyword_nulls)
  (keyword_offset)
  (keyword_on)
  (keyword_or)
  (keyword_order)
  (keyword_others)
  (keyword_outer)
  (keyword_over)
  (keyword_partition)
  (keyword_preceding)
  (keyword_precision)
  (keyword_range)
  (keyword_recursive)
  (keyword_right)
  (keyword_rlike)
  (keyword_row)
  (keyword_rows)
  (keyword_select)
  (keyword_then)
  (keyword_time)
  (keyword_timestamp)
  (keyword_ties)
  (keyword_true)
  (keyword_unbounded)
  (keyword_union)
  (keyword_using)
  (keyword_values)
  (keyword_when)
  (keyword_where)
  (keyword_window)
  (keyword_with)
] @keyword

(line_comment) @comment
(block_comment) @comment

(number) @number
(single_quoted_string) @string
(escaped_string) @string.escape
(dollar_quoted_string) @string
(hex_binary_literal) @string.special
(quoted_identifier) @variable

(function_call
  function: (qualified_name
    name: (name
      (identifier) @function)))

(relation
  value: (qualified_name
    name: (name
      (identifier) @type)))

(alias name: (identifier) @variable.parameter)
(alias name: (quoted_identifier) @variable.parameter)
(relation_alias name: (identifier) @variable.parameter)
(relation_alias name: (quoted_identifier) @variable.parameter)
(common_table_expression name: (identifier) @type)
(common_table_expression name: (quoted_identifier) @type)

(binding_reference
  "$" @punctuation.special
  root: (identifier) @variable.special)
(binding_reference member: (identifier) @property)
(json_access_expression member: (identifier) @property)
(temporal_qualifier) @attribute

[
  "+" "-" "*" "/" "%" "~"
  "=" "!=" "<>" "<" "<=" ">" ">="
  "@>" "<@" "->" "->>" "||" "|" "^" "&" "<<" ">>"
  "::" "=>" ":="
] @operator

["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["," "." ":" ";"] @punctuation.delimiter

(identifier) @variable

; Combined Avenger structural captures.
[
  "avenger"
  "import"
  "sha256"
  "as"
  "chart"
  "define"
  "catalog"
  "schema"
  "table"
  "param"
  "container"
  "resource"
  "theme"
  "mark"
  "transform"
  "tool"
  "widget"
  "view"
  "on"
  "cell"
  "plot"
  "variable"
  "part"
  "level"
  "adjust"
  "derive"
  "layer"
  "when"
  "field"
  "row"
  "key"
  "fields"
  "scale_edit"
  "scale_hint"
  "clause"
  "equality"
  "interval"
  "slot"
  "export"
  "match"
  "set"
  "at"
  "current"
  "start"
  "replacing"
  "scopes"
  "from"
  "nullable"
  "private"
  "public"
  "value"
  "dim"
  "pattern"
  "env"
  "marks"
  "subplot"
  "subplots"
  "legend"
  "output"
] @keyword

[
  (theme_kind)
  (param_kind)
  (container_kind)
  (variable_role)
  (adjust_kind)
] @keyword

(version_directive version: (number) @number)
(import_statement path: (single_quoted_string) @string)
(import_statement hash: (single_quoted_string) @string)
(import_statement alias: (identifier) @variable)
(chart_declaration kind: (identifier) @type)
(definition_declaration kind: (definition_kind) @keyword)
(definition_declaration name: (identifier) @type)
(catalog_declaration kind: (identifier) @type)
(schema_declaration kind: (identifier) @type)
(table_declaration kind: (identifier) @type)
(as_clause name: (identifier) @variable)
(param_declaration name: (identifier) @variable.parameter)
(resource_declaration kind: (identifier) @type)
(container_declaration kind: (container_kind) @type.builtin)
(mark_declaration kind: (identifier) @type)
(transform_declaration kind: (identifier) @type)
(tool_declaration kind: (identifier) @type)
(widget_declaration kind: (identifier) @type)
(view_declaration kind: (identifier) @type)
(event_declaration kind: (identifier) @type)
(cell_declaration kind: (identifier) @type)
(plot_declaration kind: (identifier) @type)
(variable_declaration role: (variable_role) @type.builtin)
(variable_declaration name: (identifier) @variable)
(adjust_declaration kind: (identifier) @type)
(derive_declaration kind: (identifier) @type)
(action_block kind: (identifier) @type)
(part_declaration name: (identifier) @variable)
(layer_declaration name: (identifier) @variable)
(match_declaration name: (identifier) @variable)
(match_arm name: (identifier) @constant)
(field_declaration name: (identifier) @property)
(slot_declaration kind: (slot_shape) @type.builtin)
(slot_declaration name: (identifier) @variable.parameter)
(output_declaration name: (identifier) @variable)
(export_declaration source: (qualified_name) @variable)
(export_declaration alias: (identifier) @variable)
(set_action target: (qualified_name) @variable)
(predicate_entry name: (identifier) @property)
(property name: (property_name) @property)
(block_splice name: (property_name) @variable.parameter)
(typed_object kind: (identifier) @type)
(typed_reference kind: (reference_kind) @type)
(typed_reference target: (qualified_name) @variable)
(environment_value name: (single_quoted_string) @string)
(none_value) @constant

((line_comment) @comment @comment.doc
  (#match? @comment.doc "^-- \\|"))

(primitive_arrow_type) @type.builtin
(arrow_type_constructor) @type.builtin
(arrow_time_unit) @constant
(arrow_interval_unit) @constant
(arrow_unsigned_integer (number) @number)
(arrow_signed_integer (number) @number)
(arrow_struct_field name: (single_quoted_string) @string)
