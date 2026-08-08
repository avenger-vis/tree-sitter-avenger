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
  "to"
  "at"
  "current"
  "start"
  "replacing"
  "scopes"
  "from"
  "scene"
  "within"
  "shared"
  "free"
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
(store_declaration name: (identifier) @variable.parameter)
(selection_declaration name: (identifier) @variable.parameter)
(obsolete_state_param name: (identifier) @variable.parameter)
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
(state_action operation: (state_action_operation) @keyword)
(state_action target: (qualified_name) @variable)
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
