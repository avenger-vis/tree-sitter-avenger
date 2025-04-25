(comment) @comment
(marginalia) @comment
(slash_comment) @comment

(keyword_true) @boolean
(keyword_false) @boolean

(literal) @string

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

;; Function-related keywords
(keyword_fn) @keyword
(keyword_return) @keyword
(function_def "->" @operator)

;; Explicitly highlight function return kind
(function_def
  "->"
  "val" @keyword.storage.type)
(function_def
  "->"
  "expr" @keyword.storage.type)
(function_def
  "->"
  "dataset" @keyword.storage.type)

;; Function definition
(function_def
  name: (identifier) @function)

;; Function parameter kinds
(parameter_decl
  kind: _ @keyword.storage.type)

;; Function return type
(function_def
  return_kind: _ @keyword.storage.type)

(keyword_case) @conditional
(keyword_when) @conditional
(keyword_then) @conditional
(keyword_else) @conditional

;; Variable references (like @pi)
(parameter) @variable.special

;; Table references with variable (like @data_0 in FROM @data_0)
(table_ref_with_var "@" @variable.special)
(table_ref_with_var ref: (object_reference name: (table_identifier) @variable.special.reference))

(identifier) @variable
(field name: (identifier) @field)

(pascal_identifier) @type

;; Property type keywords with distinct stylings
(expr_prop "expr" @keyword.storage.type)
(val_prop "val" @keyword.storage.type)
(dataset_prop "dataset" @keyword.storage.type)
(comp_prop "comp" @keyword.storage.type)

;; Component definition
(component_def
  "component" @keyword
  "inherits" @keyword)

;; Type annotation
(type) @type.annotation

;; Property qualifier
(prop_qualifier) @keyword.directive

"+" @operator
"-" @operator
"*" @operator
"/" @operator
"%" @operator
"^" @operator
":=" @operator
"=" @operator
"<" @operator
"<=" @operator
"!=" @operator
">=" @operator
">" @operator
"<>" @operator
(op_other) @operator
(op_unary_other) @operator

"(" @punctuation.bracket
")" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket
"<" @punctuation.bracket
">" @punctuation.bracket

";" @punctuation.delimiter
"," @punctuation.delimiter
"." @punctuation.delimiter
":" @punctuation.delimiter