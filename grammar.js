import AvengerSql from "@avenger-vis/tree-sitter-avenger-sql";

import arrowTypeRules from "./grammar/arrow_types.js";
import declarationRules from "./grammar/declarations.js";
import rootRules from "./grammar/roots.js";
import valueRules from "./grammar/values.js";

export default grammar(AvengerSql, {
  name: "avenger",

  rules: {
    ...rootRules,
    ...declarationRules,
    ...valueRules,
    ...arrowTypeRules,
  },
});
