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

; Keep binding captures after the generic identifier rule so the sigil and
; every path component resolve to one semantic family. `variable.special` is
; preferred when a theme defines it; `variable.parameter` is the fallback.
(binding_reference
  "$" @variable.parameter @variable.special
  root: (identifier) @variable.parameter @variable.special)
(binding_reference
  member: (identifier) @variable.parameter @variable.special)

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
  (variable_role)
  (adjust_kind)
] @keyword

(version_directive version: (number) @number)
(import_statement source: (single_quoted_string) @string)
(import_statement hash: (single_quoted_string) @string)
(import_specifier imported: (identifier) @variable)
(import_specifier local: (identifier) @variable)
(namespace_import_clause local: (identifier) @namespace)
(chart_declaration kind: (qualified_name) @type)
(chart_declaration name: (identifier) @variable)
(definition_declaration kind: (definition_kind) @keyword)
(definition_declaration name: (identifier) @type)
(catalog_declaration kind: (qualified_name) @type)
(schema_declaration kind: (qualified_name) @type)
(table_declaration kind: (qualified_name) @type)
(as_clause name: (identifier) @variable)
(param_declaration name: (identifier) @variable.parameter)
(resource_declaration kind: (qualified_name) @type)
(mark_declaration kind: (qualified_name) @type)
(transform_declaration kind: (qualified_name) @type)
(tool_declaration kind: (qualified_name) @type)
(widget_declaration kind: (qualified_name) @type)
(view_declaration kind: (qualified_name) @type)
(event_declaration kind: (qualified_name) @type)
(cell_declaration kind: (qualified_name) @type)
(plot_declaration kind: (qualified_name) @type)
(variable_declaration role: (variable_role) @type.builtin)
(variable_declaration name: (identifier) @variable)
(adjust_declaration kind: (qualified_name) @type)
(derive_declaration kind: (qualified_name) @type)
(action_block kind: (qualified_name) @type)
(part_declaration name: (identifier) @variable)
(layer_declaration name: (identifier) @variable)
(match_declaration name: (identifier) @variable)
(match_arm name: (identifier) @constant)
(field_declaration name: (identifier) @property)
(slot_declaration kind: (slot_shape) @type.builtin)
(slot_declaration name: (identifier) @variable.parameter)
(sql_required_projection_alias name: (identifier) @variable)
(sql_required_projection_alias name: (quoted_identifier) @variable)
(output_declaration name: (identifier) @variable)
(export_declaration source: (qualified_name) @variable)
(export_declaration alias: (identifier) @variable)
(set_action target: (qualified_name) @variable)
(predicate_entry name: (identifier) @property)
(property name: (property_name) @property)

; Channel modes classify their following expressions. Keep these constant
; captures after the generic property rule so conditional mode keys retain the
; same style as well.
(channel_mode) @constant

(when_declaration
  (body
    (property
      name: (property_name) @constant
      (#match? @constant "^(encoded|direct)$"))))

(property
  name: (property_name) @_otherwise
  (#eq? @_otherwise "otherwise")
  value: (anonymous_object
    (body
      (property
        name: (property_name) @constant
        (#match? @constant "^(encoded|direct)$")))))
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
