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

    // Keep the derived grammar aligned with AvengerSqlDialect while the
    // independently versioned SQL base is being repinned.
    projection: ($, previous) => seq(previous, optional(",")),

    // Derived DSL keywords are contextual. When one appears as an unquoted SQL
    // struct key, adapt that inherited token back to the base's identifier
    // node rather than letting a simultaneously viable DSL body steal it.
    struct_field: ($, previous) => choice(
      previous,
      seq(
        field("name", $._contextual_keyword_identifier),
        ":",
        field("value", $._expression),
      ),
    ),

    // SQL identifiers remain contextual after the derived grammar adds its
    // declaration keywords to the same parse table.
    name: ($, previous) => choice(previous, $._dsl_keyword_identifier),
  },
});
