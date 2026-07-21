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
  "store"
  "selection"
  "resource"
  "theme"
  "group"
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
  "overlay"
  "layer"
  "when"
  "field"
  "row"
  "key"
  "fields"
  "scale_edit"
  "scale_hint"
  "dimension"
  "clause"
  "equality"
  "interval"
  "slot"
  "channel"
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
  (state_kind)
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
(resource_declaration kind: (identifier) @type)
(mark_declaration kind: (identifier) @type)
(transform_declaration kind: (identifier) @type)
(tool_declaration kind: (identifier) @type)
(widget_declaration kind: (identifier) @type)
(view_declaration kind: (identifier) @type)
(event_declaration kind: (identifier) @type)
(cell_declaration kind: (identifier) @type)
(plot_declaration kind: (identifier) @type)
(variable_declaration kind: (identifier) @type)
(adjust_declaration kind: (identifier) @type)
(derive_declaration kind: (identifier) @type)
(action_block kind: (identifier) @type)
(part_declaration name: (identifier) @variable)
(layer_declaration name: (identifier) @variable)
(match_declaration name: (identifier) @variable)
(match_arm name: (identifier) @constant)
(field_declaration name: (identifier) @property)
(slot_declaration kind: (slot_shape) @type.builtin)
(channel_parameter_declaration name: (identifier) @variable.parameter)
(output_declaration name: (identifier) @variable)
(export_declaration source: (qualified_name) @variable)
(export_declaration alias: (identifier) @variable)
(set_action target: (qualified_name) @variable)
(property name: (property_name) @property)
(param_type_property name: (property_name) @property)
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
