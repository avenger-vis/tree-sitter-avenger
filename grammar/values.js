import { commaSeparated } from "./helpers.js";

export default {
  property: $ => choice(
    seq(
      field("name", alias(choice("sql", "query"), $.property_name)),
      ":",
      field("value", $.sql_query),
      ";",
    ),
    seq(
      field("name", alias($.identifier, $.property_name)),
      ":",
      choice(
        field("value", $.anonymous_object),
        field("value", $.array),
        field("value", $.configured_expression),
        seq(field("value", $.sql_property_expression), ";"),
      ),
    ),
  ),

  anonymous_object: $ => prec(1, $.body),

  configured_expression: $ => seq(
    field("expression", $.sql_property_expression),
    field("configuration", $.body),
  ),

  array: $ => prec(1, seq(
    "[",
    optional(commaSeparated($, $.array_element)),
    "]",
    ";",
  )),

  array_element: $ => choice(
    $.anonymous_object,
    $.none_value,
    $.sql_array_expression,
  ),

  none_value: _ => "none",

  sql_query: $ => field("query", $._query),
  sql_property_expression: $ => field("expression", $._expression),
  sql_terminated_expression: $ => field("expression", $._expression),
  sql_array_expression: $ => prec(2, field("expression", $._expression)),
};
