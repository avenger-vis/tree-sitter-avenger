export const commaSeparated = ($, rule, trailing = true) => seq(
  rule,
  repeat(seq(",", rule)),
  trailing ? optional(",") : "",
);
