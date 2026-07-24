import {
  DSL_KEYWORDS,
  SQL_KEYWORDS,
  commaSeparated,
  dslKeyword,
} from "./helpers.js";

const inheritedSqlKeywords = $ => SQL_KEYWORDS.map(word => $[`keyword_${word}`]);
const dslOnlyKeywords = DSL_KEYWORDS.filter(word => !SQL_KEYWORDS.includes(word));

export default {
  source_file: $ => seq(
    optional($.version_directive),
    repeat($.import_statement),
    repeat(field("item", $._module_item)),
  ),

  _module_item: $ => choice(
    $._module_declaration,
    $.exported_module_item,
  ),

  _module_declaration: $ => choice(
    $.chart_declaration,
    $.definition_declaration,
    $.catalog_declaration,
    $.schema_declaration,
    $.table_declaration,
  ),

  exported_module_item: $ => seq(
    field("export", "export"),
    field("declaration", $._module_declaration),
  ),

  version_directive: $ => seq(
    "avenger",
    field("version", $.number),
    // The strict compiler requires this terminator. Keeping it optional in the
    // editing grammar prevents a partially typed header from consuming the
    // following top-level declaration during error recovery.
    optional(";"),
  ),

  import_statement: $ => seq(
    "import",
    field("clause", choice(
      $.named_import_clause,
      $.namespace_import_clause,
    )),
    dslKeyword($, "from"),
    field("source", $.single_quoted_string),
    optional(seq("sha256", field("hash", $.single_quoted_string))),
    ";",
  ),

  named_import_clause: $ => seq(
    "{",
    optional(commaSeparated($, $.import_specifier)),
    "}",
  ),

  import_specifier: $ => seq(
    field("imported", $._structural_identifier),
    optional(seq("as", field("local", $._structural_identifier))),
  ),

  namespace_import_clause: $ => seq(
    "*",
    "as",
    field("local", $._structural_identifier),
  ),

  // This private structural production is aliased to the shared public
  // `qualified_name` node. SQL keeps its richer quoted-name production while
  // DSL paths remain strictly unquoted identifiers.
  _structural_qualified_name: $ => prec.right(10, seq(
    field("name", $._structural_identifier),
    repeat(seq(".", field("member", $._structural_identifier))),
  )),

  _structural_identifier: $ => prec(100, choice(
    $.identifier,
    $._contextual_keyword_identifier,
  )),

  _contextual_keyword_identifier: $ => prec(100, choice(
    alias(choice(...inheritedSqlKeywords($)), $.identifier),
    $._dsl_keyword_identifier,
  )),

  _dsl_keyword_identifier: $ => alias(choice(...dslOnlyKeywords), $.identifier),
};
