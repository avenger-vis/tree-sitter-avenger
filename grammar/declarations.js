export default {
  chart_declaration: $ => seq(
    "chart",
    field("kind", $.identifier),
    optional($.as_clause),
    field("body", $.body),
  ),

  as_clause: $ => seq(
    "as",
    field("name", $.identifier),
  ),

  body: $ => prec(1, seq(
    "{",
    repeat(choice(
      $.property,
      $.output_declaration,
    )),
    "}",
  )),

  output_declaration: $ => seq(
    "output",
    field("name", $.identifier),
    optional(seq(":", field("value", $.sql_terminated_expression))),
    ";",
  ),
};
