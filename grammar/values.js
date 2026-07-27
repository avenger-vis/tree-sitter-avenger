import {
  aliasedStructuralIdentifier,
  commaSeparated,
} from "./helpers.js";

const REFERENCE_KINDS = ["mark", "selection", "tool", "widget", "resource"];

export default {
  property: $ => choice(
    seq(
      field("name", alias(choice("sql", "query"), $.property_name)),
      ":",
      field("value", $.sql_query),
      ";",
    ),
    seq(
      field("name", alias("expressions", $.property_name)),
      ":",
      field("value", $.sql_projection_list),
      ";",
    ),
    prec.dynamic(6, seq(
      field("name", $._property_name),
      ":",
      field("value", $.sql_named_projection_list),
      ";",
    )),
    seq(
      field("name", alias("target", $.property_name)),
      ":",
      field("value", $.event_targets),
    ),
    seq(
      field("name", alias("scope", $.property_name)),
      ":",
      field("value", $.event_scope),
    ),
    seq(
      field("name", alias("surface", $.property_name)),
      ":",
      field("value", $.event_surface),
    ),
    prec(100, seq(
      field("name", $._property_name),
      ":",
      field("value", $.anonymous_object),
    )),
    prec.dynamic(5, seq(
      field("name", $._property_name),
      ":",
      field("value", alias($._terminated_atom_expression, $.sql_property_expression)),
      ";",
    )),
    prec(50, seq(
      field("name", $._property_name),
      ":",
      choice(
        field("value", $.typed_object),
        field("value", $.typed_reference),
        seq(field("value", $.array), ";"),
        field("value", $.visual_value),
        field("value", $.dimension_value),
        field("value", $.pattern_value),
        field("value", $.environment_value),
        seq(field("value", $.none_value), ";"),
        field("value", $.configured_expression),
        seq(field("value", $.sql_property_expression), ";"),
      ),
    )),
  ),

  // At property-value start a leading `{` is always the EBNF's anonymous DSL
  // object, never a top-level SQL struct expression. The higher lexical
  // precedence applies only while this structural token is valid; SQL braces
  // elsewhere continue to use the inherited token and production.
  anonymous_object: $ => field("body", alias($._anonymous_body, $.body)),
  _anonymous_body: $ => seq(
    token(prec(100, "{")),
    repeat($._body_item),
    "}",
  ),

  _array_anonymous_object: $ => prec.dynamic(10, field("body", $.body)),

  typed_object: $ => prec(4, seq(
    field("kind", $._structural_identifier),
    field("body", $.body),
  )),

  configured_expression: $ => prec.dynamic(10, seq(
    field("expression", $.sql_property_expression),
    field("configuration", $.body),
  )),

  typed_reference: $ => prec(10, seq(
    field("kind", alias(choice(...REFERENCE_KINDS), $.reference_kind)),
    field("target", alias($._structural_qualified_name, $.qualified_name)),
    ";",
  )),

  _property_name: $ => aliasedStructuralIdentifier($, $.property_name),
  _terminated_atom_expression: $ => alias(
    $._contextual_keyword_identifier,
    $.qualified_name,
  ),

  array: $ => prec(2, seq(
    "[",
    optional(commaSeparated($, $.array_element)),
    "]",
  )),

  array_element: $ => choice(
    alias($._array_anonymous_object, $.anonymous_object),
    $.array_visual_value,
    $.array_pattern_value,
    $.none_value,
    $.sql_array_expression,
  ),

  visual_value: $ => prec(10, seq(
    "value",
    field("value", $.sql_property_expression),
    choice(";", field("configuration", $.body)),
  )),

  array_visual_value: $ => prec(10, seq(
    "value",
    field("value", $.sql_array_expression),
  )),

  dimension_value: $ => prec(10, seq(
    "dim",
    field("target", alias($._structural_qualified_name, $.qualified_name)),
    choice(";", field("configuration", $.body)),
  )),

  pattern_value: $ => prec(10, seq(
    "pattern",
    field("body", $.body),
  )),

  array_pattern_value: $ => prec(10, seq(
    "pattern",
    field("body", $.body),
  )),

  environment_value: $ => prec(10, seq(
    "env",
    field("name", $.single_quoted_string),
    ";",
  )),

  none_value: _ => prec(10, "none"),

  event_targets: $ => prec(4, choice(
    seq(
      "mark",
      field("target", alias($._structural_qualified_name, $.qualified_name)),
      ";",
    ),
    seq("marks", field("targets", $.qualified_name_list), ";"),
  )),

  event_scope: $ => prec(4, choice(
    seq("plot", ";"),
    seq(
      "subplot",
      field("target", alias($._structural_qualified_name, $.qualified_name)),
      ";",
    ),
    seq("subplots", field("targets", $.qualified_name_list), ";"),
  )),

  event_surface: $ => prec(4, choice(
    seq(choice("plot", "all"), ";"),
    seq("legend", field("name", $._structural_identifier), ";"),
  )),

  qualified_name_list: $ => seq(
    "[",
    optional(commaSeparated(
      $,
      alias($._structural_qualified_name, $.qualified_name),
    )),
    "]",
  ),

  sql_query: $ => field("query", $._query),
  sql_projection_list: $ => field("projection", $.projection),
  sql_named_projection_list: $ => field(
    "projection",
    seq(
      $.sql_named_projection_item,
      repeat(seq(",", $.sql_named_projection_item)),
      optional(","),
    ),
  ),
  sql_named_projection_item: $ => seq(
    field("value", $._expression),
    field("alias", $.sql_required_projection_alias),
  ),
  sql_required_projection_alias: $ => seq(
    $.keyword_as,
    field("name", choice($.identifier, $.quoted_identifier)),
  ),
  sql_property_expression: $ => field("expression", $._expression),
  sql_terminated_expression: $ => field("expression", $._expression),
  sql_aliased_expression: $ => field("expression", $._expression),
  sql_array_expression: $ => prec.dynamic(5, field("expression", $._expression)),
};
