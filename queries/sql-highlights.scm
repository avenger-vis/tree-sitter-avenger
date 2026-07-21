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
