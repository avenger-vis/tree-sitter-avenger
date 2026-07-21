[
  "avenger"
  "import"
  "sha256"
  "as"
  "chart"
  "output"
] @keyword

(version_directive version: (number) @number)
(import_statement path: (single_quoted_string) @string)
(import_statement hash: (single_quoted_string) @string)
(import_statement alias: (identifier) @variable)
(chart_declaration kind: (identifier) @type)
(as_clause name: (identifier) @variable)
(output_declaration name: (identifier) @variable)
(property name: (property_name) @property)
(none_value) @constant

["{" "}" "[" "]" ":" ";" ","] @punctuation.delimiter
