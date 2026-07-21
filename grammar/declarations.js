import { dslKeyword } from "./helpers.js";

const SLOT_SHAPES = [
  "expr", "expr_list", "literal", "number", "string", "boolean",
  "enum", "function", "ref", "block",
];

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
    $.store_declaration,
    $.selection_declaration,
    $.resource_declaration,
    $.theme_declaration,
    $.catalog_declaration,
    $.schema_declaration,
    $.table_declaration,
    $.group_declaration,
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
    $.overlay_declaration,
    $.layer_declaration,
    $.when_declaration,
    $.field_declaration,
    $.row_declaration,
    $.key_declaration,
    $.fields_declaration,
    $.scale_edit_declaration,
    $.scale_hint_declaration,
    $.dimension_declaration,
    $.clause_declaration,
    $.equality_declaration,
    $.interval_declaration,
    $.slot_declaration,
    $.channel_parameter_declaration,
    $.output_declaration,
    $.export_declaration,
    $.match_declaration,
    $.set_action,
    $.block_splice,
  ),

  _definition_item: $ => $._body_item,

  param_declaration: $ => seq(
    visibility($), "param", $.as_clause, field("body", $.param_body),
  ),
  store_declaration: $ => seq(
    visibility($), "store", $.as_clause, field("body", $.body),
  ),
  selection_declaration: $ => seq(
    visibility($), "selection", $.as_clause,
    field("body", alias($._selection_body, $.body)),
  ),
  resource_declaration: $ => seq(
    visibility($), "resource", field("kind", $.identifier), $.as_clause,
    field("body", $.body),
  ),

  param_body: $ => prec(2, seq(
    "{", repeat(choice($.param_type_property, $._body_item)), "}",
  )),
  param_type_property: $ => prec(3, seq(
    field("name", alias("type", $.property_name)),
    ":", field("type", $.arrow_type), ";",
  )),

  _selection_body: $ => prec(2, seq(
    "{",
    repeat(choice(alias($._selection_type_property, $.property), $._body_item)),
    "}",
  )),
  _selection_type_property: $ => seq(
    field("name", alias("type", $.property_name)),
    ":",
    field("value", alias($._selection_type_atom, $.sql_property_expression)),
    ";",
  ),
  _selection_type_atom: $ => $._structural_identifier,

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

  group_declaration: $ => seq(
    visibility($), dslKeyword($, "group"), optional($.as_clause), field("body", $.body),
  ),
  mark_declaration: $ => seq(
    visibility($), "mark", field("kind", $.identifier), optional($.as_clause),
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
    visibility($), "variable", field("kind", $.identifier), optional($.as_clause),
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
    optional(seq(field("kind", $.identifier), optional($.as_clause))),
    field("body", $.body),
  ),
  derive_declaration: $ => seq(
    visibility($), "derive", field("kind", $.identifier), optional($.as_clause),
    field("body", $.body),
  ),
  overlay_declaration: $ => seq(
    visibility($), "overlay", optional($.as_clause), field("body", $.body),
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
  dimension_declaration: $ => seq(
    visibility($), "dimension", $.as_clause, field("body", $.body),
  ),
  clause_declaration: $ => seq(visibility($), "clause", field("body", $.body)),
  equality_declaration: $ => seq(
    visibility($), "equality", field("body", $.body),
  ),
  interval_declaration: $ => seq(
    visibility($), dslKeyword($, "interval"), field("body", $.body),
  ),

  field_declaration: $ => seq(
    visibility($),
    "field",
    field("name", $.identifier),
    ":",
    field("type", $.arrow_type),
    optional("nullable"),
    ";",
  ),

  slot_declaration: $ => seq(
    visibility($),
    "slot",
    field("kind", alias(choice(...SLOT_SHAPES), $.slot_shape)),
    $.as_clause,
    choice(field("body", $.body), ";"),
  ),
  channel_parameter_declaration: $ => seq(
    visibility($),
    "channel",
    field("name", $.identifier),
    optional(seq(":", field("kind", $.identifier))),
    ";",
  ),
  output_declaration: $ => seq(
    visibility($),
    "output",
    field("name", $.identifier),
    optional(seq(":", field("value", $.sql_terminated_expression))),
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
    choice($._state_action, $._cursor_action),
  ),
  _state_action: $ => seq(
    field("kind", alias(choice("param", "store", "selection"), $.state_kind)),
    field("target", structuralPath($)),
    optional(field("time", $.action_time)),
    optional($.replacing_scopes_modifier),
    "=",
    choice(
      field("value", $.action_block),
      seq(field("value", $.sql_terminated_expression), ";"),
    ),
  ),
  _cursor_action: $ => seq(
    field("kind", alias("cursor", $.state_kind)),
    "=",
    field("value", $.sql_terminated_expression),
    ";",
  ),
  action_time: _ => seq("at", choice("current", "start")),
  replacing_scopes_modifier: _ => seq("replacing", "scopes"),
  action_block: $ => seq(
    field("kind", $.identifier),
    field("body", $.body),
  ),
};
