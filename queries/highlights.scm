(comment) @comment
(marginalia) @comment
(slash_comment) @comment

(keyword_true) @boolean
(keyword_false) @boolean

(literal) @string

;; SQL Keywords
(keyword_in) @keyword.operator
(keyword_and) @keyword.operator
(keyword_or) @keyword.operator
(keyword_not) @keyword.operator
(keyword_by) @keyword.operator
(keyword_on) @keyword.operator
(keyword_select) @keyword
(keyword_from) @keyword
(keyword_where) @keyword
(keyword_values) @keyword

;; SQL operators
(is_not) @keyword.operator
(not_like) @keyword.operator
(similar_to) @keyword.operator
(not_similar_to) @keyword.operator
(distinct_from) @keyword.operator
(not_distinct_from) @keyword.operator
(not_in) @keyword.operator
(keyword_between) @keyword.operator

;; Function-related keywords
(keyword_fn) @keyword
(keyword_return) @keyword

;; Explicitly highlight function return kind
(function_def
  "->" @operator
  return_kind: (keyword_val) @keyword.storage.type)
(function_def
  "->" @operator
  return_kind: (keyword_expr) @keyword.storage.type)
(function_def
  "->" @operator
  return_kind: (keyword_dataset) @keyword.storage.type)

;; Function definition
(function_def
  name: (identifier) @function)

;; Function parameter kinds
(parameter_decl
  kind: _ @keyword.storage.type)

;; Conditionals
(keyword_case) @conditional
(keyword_when) @conditional
(keyword_then) @conditional
(keyword_else) @conditional
(keyword_end) @conditional

;; Variable references and parameters (including the three different forms: ?, $n, and @var)
(parameter) @variable.special

;; Table references with variable (like @data_0 in FROM @data_0)
(table_ref_with_var "@" @variable.special)
(table_ref_with_var ref: (object_reference name: (table_identifier) @variable.special.reference))

(identifier) @variable
(field name: (identifier) @field)

(pascal_identifier) @type

;; Property type keywords with distinct stylings
(expr_prop
  (keyword_expr) @keyword.storage.type)
(val_prop
  (keyword_val) @keyword.storage.type)
(dataset_prop
  (keyword_dataset) @keyword.storage.type)
(comp_prop
  (keyword_comp) @keyword.storage.type)

;; Component definition
(component_def
  "component" @keyword
  "inherits" @keyword)

;; Import statement
(keyword_import) @keyword
(import_path "from" @keyword)
(import_item "as" @keyword)

;; Type annotation
(type) @type.annotation

;; Property qualifier
(prop_qualifier) @keyword.directive

;; Operators
(op_other) @operator
(op_unary_other) @operator
(bang) @operator
(binary_expression operator: _ @operator)

;; Punctuation
["(" ")" "{" "}" "[" "]" "<" ">"] @punctuation.bracket
[";" "," "." ":"] @punctuation.delimiter

;; Assignment operator
":=" @operator

;; Cast operator
"::" @operator