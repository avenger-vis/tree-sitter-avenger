export default {
  source_file: $ => repeat(choice(
    $.version_directive,
    $.import_statement,
    $.chart_declaration,
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
};
