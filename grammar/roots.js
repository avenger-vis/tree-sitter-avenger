export default {
  source_file: $ => repeat(choice(
    $.version_directive,
    $.import_statement,
    $.chart_declaration,
    $.definition_declaration,
    $.catalog_declaration,
    $.schema_declaration,
    $.table_declaration,
  )),

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
    field("path", $.single_quoted_string),
    optional(seq("sha256", field("hash", $.single_quoted_string))),
    optional(seq("as", field("alias", $.identifier))),
    ";",
  ),

  // This private structural production is aliased to the shared public
  // `qualified_name` node. SQL keeps its richer quoted-name production while
  // DSL paths remain strictly unquoted identifiers.
  _structural_qualified_name: $ => prec.right(10, seq(
    field("name", $.identifier),
    repeat(seq(".", field("member", $.identifier))),
  )),
};
