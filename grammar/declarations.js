export default {
  chart_declaration: $ => seq(
    "chart",
    field("kind", $.identifier),
    optional($.as_clause),
    field("body", $.body),
  ),

  definition_declaration: $ => seq(
    "define",
    field("kind", choice("mark", "tool", "transform")),
    field("name", $.identifier),
    field("body", $.definition_body),
  ),

  catalog_declaration: $ => seq(
    "catalog",
    field("kind", $.identifier),
    $.as_clause,
    field("body", $.body),
  ),

  schema_declaration: $ => seq(
    "schema",
    field("kind", $.identifier),
    $.as_clause,
    field("body", $.body),
  ),

  table_declaration: $ => seq(
    "table",
    field("kind", $.identifier),
    $.as_clause,
    field("body", $.body),
  ),

  as_clause: $ => seq(
    "as",
    field("name", $.identifier),
  ),

  visibility_modifier: _ => choice("private", "public"),

  body: $ => prec(1, seq(
    "{",
    repeat(choice(
      $.property,
      $.output_declaration,
      $.param_declaration,
      $.store_declaration,
      $.selection_declaration,
      $.field_declaration,
      $.catalog_declaration,
      $.schema_declaration,
      $.table_declaration,
    )),
    "}",
  )),

  definition_body: $ => prec(1, seq(
    "{",
    repeat(choice(
      $.property,
      $.output_declaration,
      $.param_declaration,
      $.field_declaration,
    )),
    "}",
  )),

  param_declaration: $ => seq(
    optional($.visibility_modifier),
    "param",
    $.as_clause,
    field("body", $.param_body),
  ),

  store_declaration: $ => seq(
    optional($.visibility_modifier),
    "store",
    $.as_clause,
    field("body", $.body),
  ),

  selection_declaration: $ => seq(
    optional($.visibility_modifier),
    "selection",
    $.as_clause,
    field("body", alias($._selection_body, $.body)),
  ),

  _selection_body: $ => prec(2, seq(
    "{",
    repeat(choice(
      alias($._selection_type_property, $.property),
      $.property,
      $.field_declaration,
    )),
    "}",
  )),

  _selection_type_property: $ => seq(
    field("name", alias("type", $.property_name)),
    ":",
    field("value", alias($._selection_type_atom, $.sql_property_expression)),
    ";",
  ),

  _selection_type_atom: $ => $.identifier,

  param_body: $ => prec(2, seq(
    "{",
    repeat(choice(
      $.param_type_property,
      $.property,
      $.field_declaration,
    )),
    "}",
  )),

  param_type_property: $ => prec(2, seq(
    field("name", alias("type", $.property_name)),
    ":",
    field("type", $.arrow_type),
    ";",
  )),

  field_declaration: $ => seq(
    optional($.visibility_modifier),
    "field",
    field("name", $.identifier),
    ":",
    field("type", $.arrow_type),
    optional("nullable"),
    ";",
  ),

  output_declaration: $ => seq(
    "output",
    field("name", $.identifier),
    optional(seq(":", field("value", $.sql_terminated_expression))),
    ";",
  ),
};
