import { dslKeyword } from "./helpers.js";

const SLOT_SHAPES = [
  "expr", "expr_list", "literal", "number", "string", "boolean",
  "enum", "function", "ref", "block", "channel",
];

const VARIABLE_ROLES = ["row", "column", "item"];

const visibility = $ => optional($.visibility_modifier);
const structuralPath = $ => alias($._structural_qualified_name, $.qualified_name);

export default {
  chart_declaration: $ => seq(
    "chart",
    field("kind", $.identifier),
    optional($.as_clause),
    field("body", $.body),
  ),

  definition_declaration: $ => seq(
    "define",
    field("kind", alias(choice("mark", "tool", "transform"), $.definition_kind)),
    field("name", $.identifier),
    field("body", $.definition_body),
  ),

  catalog_declaration: $ => seq(
    visibility($),
    "catalog",
    field("kind", $.identifier),
    $.as_clause,
    field("body", $.body),
  ),

  schema_declaration: $ => seq(
    visibility($),
    "schema",
    field("kind", $.identifier),
    $.as_clause,
    field("body", $.body),
  ),

  table_declaration: $ => seq(
    visibility($),
    "table",
    field("kind", $.identifier),
    $.as_clause,
    field("body", $.body),
  ),

  as_clause: $ => seq("as", field("name", $.identifier)),
  visibility_modifier: _ => choice("private", "public"),

  body: $ => prec.dynamic(5, seq("{", repeat($._body_item), "}")),
  definition_body: $ => prec(1, seq("{", repeat($._definition_item), "}")),

  _body_item: $ => choice(
    $.property,
    $.param_declaration,
    $.resource_declaration,
    $.theme_declaration,
    $.catalog_declaration,
    $.schema_declaration,
    $.table_declaration,
    $.mark_declaration,
    $.transform_declaration,
    $.tool_declaration,
    $.widget_declaration,
    $.view_declaration,
    $.event_declaration,
    $.cell_declaration,
    $.plot_declaration,
    $.variable_declaration,
    $.part_declaration,
    $.level_declaration,
    $.adjust_declaration,
    $.derive_declaration,
    $.layer_declaration,
    $.when_declaration,
    $.field_declaration,
    $.row_declaration,
    $.key_declaration,
    $.fields_declaration,
    $.scale_edit_declaration,
    $.scale_hint_declaration,
    $.clause_declaration,
    $.equality_declaration,
    $.interval_declaration,
    $.slot_declaration,
    $.output_declaration,
    $.export_declaration,
    $.match_declaration,
    $.set_action,
    $.block_splice,
  ),

  _definition_item: $ => $._body_item,

  param_declaration: $ => seq(
    visibility($),
    "param",
    field("type", choice(
      $.arrow_type,
      alias(choice("store", "selection"), $.param_kind),
    )),
    "as",
    field("name", $._structural_identifier),
    field("body", $.param_body),
  ),
  resource_declaration: $ => seq(
    visibility($), "resource", field("kind", $.identifier), $.as_clause,
    field("body", $.body),
  ),

  param_body: $ => prec(2, seq("{", repeat($._body_item), "}")),

  theme_declaration: $ => seq(
    visibility($),
    "theme",
    field("kind", alias("css", $.theme_kind)),
    choice(
      seq(
        "from",
        field("source", $.single_quoted_string),
        optional(seq("sha256", field("hash", $.single_quoted_string))),
      ),
      seq(":", field("value", $.single_quoted_string)),
    ),
    ";",
  ),

  mark_declaration: $ => seq(
    visibility($),
    "mark",
    field("kind", choice($.identifier, alias($.keyword_group, $.identifier))),
    optional($.as_clause),
    field("body", $.body),
  ),
  transform_declaration: $ => seq(
    visibility($), "transform", field("kind", $.identifier), optional($.as_clause),
    field("body", $.body),
  ),
  tool_declaration: $ => seq(
    visibility($), "tool", field("kind", $.identifier), optional($.as_clause),
    choice(field("body", $.body), ";"),
  ),
  widget_declaration: $ => seq(
    visibility($), "widget", field("kind", $.identifier), $.as_clause,
    field("body", $.body),
  ),
  view_declaration: $ => seq(
    visibility($), "view", field("kind", $.identifier), optional($.as_clause),
    field("body", $.body),
  ),
  event_declaration: $ => seq(
    visibility($), dslKeyword($, "on"), field("kind", $.identifier), optional($.as_clause),
    field("body", $.body),
  ),
  cell_declaration: $ => seq(
    visibility($), "cell", field("kind", $.identifier), optional($.as_clause),
    optional(seq("at", field("placement", $.body))),
    field("body", $.body),
  ),
  plot_declaration: $ => seq(
    visibility($), "plot", field("kind", $.identifier), field("body", $.body),
  ),
  variable_declaration: $ => seq(
    visibility($),
    "variable",
    field("role", alias(choice(...VARIABLE_ROLES), $.variable_role)),
    field("name", $._structural_identifier),
    field("body", $.body),
  ),
  part_declaration: $ => seq(
    visibility($), "part", field("name", $.identifier), field("body", $.body),
  ),
  level_declaration: $ => seq(
    visibility($), "level", field("value", $.number), field("body", $.body),
  ),
  adjust_declaration: $ => seq(
    visibility($),
    "adjust",
    choice(
      field("kind", alias("expr", $.adjust_kind)),
      seq(field("kind", $.identifier), optional($.as_clause)),
    ),
    field("body", $.body),
  ),
  derive_declaration: $ => seq(
    visibility($), "derive", field("kind", $.identifier), optional($.as_clause),
    field("body", $.body),
  ),
  layer_declaration: $ => seq(
    visibility($), "layer", field("name", $.identifier), field("body", $.body),
  ),
  when_declaration: $ => seq(
    visibility($), dslKeyword($, "when"), field("body", $.body),
  ),
  row_declaration: $ => seq(
    visibility($), dslKeyword($, "row"), field("body", $.body),
  ),
  key_declaration: $ => seq(visibility($), "key", field("body", $.body)),
  fields_declaration: $ => seq(visibility($), "fields", field("body", $.body)),
  scale_edit_declaration: $ => seq(
    visibility($), "scale_edit", field("body", $.body),
  ),
  scale_hint_declaration: $ => seq(
    visibility($), "scale_hint", field("body", $.body),
  ),
  clause_declaration: $ => seq(visibility($), "clause", field("body", $.body)),
  equality_declaration: $ => seq(
    visibility($), "equality", field("body", $.predicate_body),
  ),
  interval_declaration: $ => seq(
    visibility($), dslKeyword($, "interval"), field("body", $.predicate_body),
  ),
  predicate_body: $ => seq("{", repeat($.predicate_entry), "}"),
  predicate_entry: $ => seq(
    field("name", $._structural_identifier),
    field("body", $.body),
  ),

  field_declaration: $ => seq(
    visibility($),
    "field",
    field("type", $.arrow_type),
    field("name", $._structural_identifier),
    optional("nullable"),
    ";",
  ),

  slot_declaration: $ => seq(
    visibility($),
    "slot",
    field("kind", alias(choice(...SLOT_SHAPES), $.slot_shape)),
    field("name", $._structural_identifier),
    choice(field("body", $.body), ";"),
  ),
  output_declaration: $ => seq(
    visibility($),
    "output",
    choice(
      field("name", $._structural_identifier),
      seq(
        field("source", $.sql_aliased_expression),
        "as",
        field("name", $._structural_identifier),
      ),
    ),
    ";",
  ),
  export_declaration: $ => seq(
    visibility($),
    "export",
    field("source", structuralPath($)),
    optional(seq("as", field("alias", $.identifier))),
    ";",
  ),
  match_declaration: $ => seq(
    visibility($),
    "match",
    field("name", $.identifier),
    field("body", $.match_body),
  ),
  match_body: $ => seq("{", repeat($.match_arm), "}"),
  match_arm: $ => seq(
    field("name", $.identifier),
    field("body", alias($._match_arm_body, $.body)),
  ),
  _match_arm_body: $ => seq("{", repeat($._definition_item), "}"),
  block_splice: $ => prec(100, seq(
    field("name", $._property_name),
    ";",
  )),

  set_action: $ => seq(
    visibility($),
    "set",
    field("target", structuralPath($)),
    optional(field("time", $.action_time)),
    optional($.replacing_scopes_modifier),
    "=",
    choice(
      field("value", $.action_block),
      seq(field("value", $.sql_terminated_expression), ";"),
    ),
  ),
  action_time: _ => seq("at", choice("current", "start")),
  replacing_scopes_modifier: _ => seq("replacing", "scopes"),
  action_block: $ => seq(
    field("kind", $.identifier),
    field("body", $.body),
  ),
};
