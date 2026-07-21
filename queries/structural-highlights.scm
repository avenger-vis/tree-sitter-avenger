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
  "field"
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

(version_directive version: (number) @number)
(import_statement path: (single_quoted_string) @string)
(import_statement hash: (single_quoted_string) @string)
(import_statement alias: (identifier) @variable)
(chart_declaration kind: (identifier) @type)
(definition_declaration kind: ["mark" "tool" "transform"] @keyword)
(definition_declaration name: (identifier) @type)
(catalog_declaration kind: (identifier) @type)
(schema_declaration kind: (identifier) @type)
(table_declaration kind: (identifier) @type)
(as_clause name: (identifier) @variable)
(field_declaration name: (identifier) @property)
(output_declaration name: (identifier) @variable)
(property name: (property_name) @property)
(typed_object kind: (identifier) @type)
(typed_reference kind: (reference_kind) @type)
(environment_value name: (single_quoted_string) @string)
(none_value) @constant

(primitive_arrow_type) @type.builtin
(arrow_type_constructor) @type.builtin
(arrow_time_unit) @constant
(arrow_interval_unit) @constant
(arrow_unsigned_integer (number) @number)
(arrow_signed_integer (number) @number)
(arrow_struct_field name: (single_quoted_string) @string)

["{" "}" "[" "]" ":" ";" ","] @punctuation.delimiter
