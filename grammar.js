import AvengerSql from "@avenger-vis/tree-sitter-avenger-sql";

import arrowTypeRules from "./grammar/arrow_types.js";
import declarationRules from "./grammar/declarations.js";
import rootRules from "./grammar/roots.js";
import valueRules from "./grammar/values.js";

export default grammar(AvengerSql, {
  name: "avenger",

  conflicts: ($, previous) => [
    ...previous,
    [$.struct_field, $._property_name],
    [$._dsl_keyword_identifier, $._property_name],
    [$.property, $._property_name],
    [$._dsl_keyword_identifier, $.property, $._property_name],
    [$.struct_expression, $.body],
    [$.array_expression, $.sql_array_expression],
  ],

  rules: {
    ...rootRules,
    ...declarationRules,
    ...valueRules,
    ...arrowTypeRules,

    // Derived DSL keywords are contextual. When one appears as an unquoted SQL
    // struct key, adapt that inherited token back to the base's identifier
    // node rather than letting a simultaneously viable DSL body steal it.
    struct_field: ($, previous) => choice(
      previous,
      seq(
        field("name", $._dsl_keyword_identifier),
        ":",
        field("value", $._expression),
      ),
    ),

    // DataFusion accepts the SQL-standard EXTRACT(field FROM value) special
    // form. It is not an ordinary comma-separated function call, so retain a
    // dedicated node while the aggressively trimmed SQL base is embedded.
    _expression: ($, previous) => choice(previous, $.extract_expression),
    keyword_from: _ => token(prec(2, /[fF][rR][oO][mM]/)),
    extract_expression: $ => prec(20, seq(
      alias(token(prec(2, /[eE][xX][tT][rR][aA][cC][tT]/)), $.keyword_extract),
      "(",
      field("field", $.identifier),
      $.keyword_from,
      field("value", $._expression),
      ")",
    )),

    // SQL identifiers remain contextual after the derived grammar adds its
    // declaration keywords to the same parse table.
    name: ($, previous) => choice(previous, $._dsl_keyword_identifier),

    // SQL keyword tokens remain contextual as the final member of a qualified
    // name. This keeps relation-qualified output handles such as `stack.end`
    // available without turning bare keywords into general column names.
    qualified_name: ($, previous) => choice(
      previous,
      prec.right(seq(
        field("name", $.name),
        repeat(seq(".", field("member", $.name))),
        ".",
        field(
          "member",
          alias($._contextual_keyword_identifier, $.name),
        ),
      )),
    ),

  },
});
