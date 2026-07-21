import AvengerSql from "@avenger-vis/tree-sitter-avenger-sql";

export default grammar(AvengerSql, {
  name: "avenger_composition",

  rules: {
    source_file: $ => repeat(choice(
      $.sql_query,
      $.sql_property_expression,
      $.sql_terminated_expression,
      $.sql_array_property,
    )),

    sql_query: $ => seq(
      field("name", choice("sql", "query")),
      ":",
      field("query", $._query),
      field("terminator", ";"),
    ),

    sql_property_expression: $ => seq(
      "property",
      ":",
      field("expression", $._expression),
      field("configuration", $.configuration_body),
    ),

    sql_terminated_expression: $ => seq(
      field("name", choice("output", "action")),
      ":",
      field("expression", $._expression),
      field("terminator", ";"),
    ),

    sql_array_property: $ => seq(
      "values",
      ":",
      "[",
      optional(seq(
        $.structural_array_item,
        repeat(seq(",", $.structural_array_item)),
        optional(","),
      )),
      "]",
      ";",
    ),

    structural_array_item: $ => choice(
      $.sql_array_expression,
      $.anonymous_body,
      seq("value", $.sql_array_expression),
      seq("pattern", $.sql_array_expression),
      "none",
    ),

    sql_array_expression: $ => field("expression", $._expression),

    configuration_body: $ => seq(
      "{",
      repeat($.configuration_entry),
      "}",
    ),

    anonymous_body: $ => prec(1, seq(
      "{",
      repeat($.configuration_entry),
      "}",
    )),

    configuration_entry: $ => seq(
      field("name", $.identifier),
      ":",
      field("value", $._expression),
      ";",
    ),
  },
});
