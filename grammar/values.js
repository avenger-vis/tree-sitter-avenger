import { commaSeparated } from "./helpers.js";

const REFERENCE_KINDS = ["mark", "group", "selection", "tool", "widget", "resource"];

export default {
  property: $ => choice(
    seq(
      field("name", alias(choice("sql", "query"), $.property_name)),
      ":",
      field("value", $.sql_query),
      ";",
    ),
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
    seq(
      field("name", alias($.identifier, $.property_name)),
      ":",
      choice(
        field("value", $.anonymous_object),
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
    ),
  ),

  anonymous_object: $ => prec(2, field("body", $.body)),

  typed_object: $ => prec(4, seq(
    field("kind", $.identifier),
    field("body", $.body),
  )),

  configured_expression: $ => prec(2, seq(
    field("expression", $.sql_property_expression),
    field("configuration", $.body),
  )),

  typed_reference: $ => seq(
    field("kind", alias(choice(...REFERENCE_KINDS), $.reference_kind)),
    field("target", alias($._structural_qualified_name, $.qualified_name)),
    ";",
  ),

  array: $ => prec(2, seq(
    "[",
    optional(commaSeparated($, $.array_element)),
    "]",
  )),

  array_element: $ => choice(
    $.anonymous_object,
    $.array_visual_value,
    $.array_pattern_value,
    $.none_value,
    $.sql_array_expression,
  ),

  visual_value: $ => seq(
    "value",
    field("value", $.sql_property_expression),
    choice(";", field("configuration", $.body)),
  ),

  array_visual_value: $ => seq(
    "value",
    field("value", $.sql_array_expression),
  ),

  dimension_value: $ => seq(
    "dim",
    field("target", alias($._structural_qualified_name, $.qualified_name)),
    choice(";", field("configuration", $.body)),
  ),

  pattern_value: $ => seq(
    "pattern",
    field("body", $.body),
  ),

  array_pattern_value: $ => seq(
    "pattern",
    field("body", $.body),
  ),

  environment_value: $ => seq(
    "env",
    field("name", $.single_quoted_string),
    ";",
  ),

  none_value: _ => "none",

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
    seq("legend", field("name", $.identifier), ";"),
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
  sql_property_expression: $ => field("expression", $._expression),
  sql_terminated_expression: $ => field("expression", $._expression),
  sql_array_expression: $ => prec(3, field("expression", $._expression)),
};
