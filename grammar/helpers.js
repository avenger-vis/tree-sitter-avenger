export const commaSeparated = ($, rule, trailing = true) => seq(
  rule,
  repeat(seq(",", rule)),
  trailing ? optional(",") : "",
);

// SQL keywords are inherited lexical nodes. Structural name positions accept
// them as ordinary identifiers, preserving sqlparser's contextual-word model
// without defining a second identifier token. Keep this list synchronized with
// the pinned SQL base's grammar/keywords.js.
export const SQL_KEYWORDS = [
  "all", "and", "as", "asc", "between", "by", "case", "cast", "cross",
  "current", "date", "desc", "distinct", "double", "else", "end", "except",
  "exclude", "exists", "false", "filter", "first", "following", "from", "full",
  "group", "groups", "having", "ilike", "in", "inner", "intersect", "interval",
  "is", "join", "last", "lateral", "left", "like", "limit", "materialized",
  "natural", "no", "not", "null", "nulls", "offset", "on", "or", "order",
  "others", "outer", "over", "partition", "preceding", "precision", "range",
  "recursive", "right", "rlike", "row", "rows", "select", "then", "time",
  "timestamp", "ties", "true", "unbounded", "union", "using", "values", "when",
  "where", "window", "with",
];

export const DSL_KEYWORDS = [
  "avenger", "import", "sha256", "chart", "define", "catalog", "schema", "table",
  "param", "store", "selection", "resource", "theme", "css", "group", "mark",
  "transform", "tool", "widget", "view", "cell", "plot", "variable", "part",
  "level", "adjust", "derive", "layer", "when", "field", "row", "key",
  "fields", "scale_edit", "scale_hint", "dimension", "clause", "equality",
  "interval", "slot", "channel", "output", "export", "match", "set", "cursor",
  "private", "public", "nullable", "at", "replacing", "scopes", "from", "as",
  "target", "scope", "surface", "encoded", "direct", "dim", "pattern", "env", "none",
  "marks", "subplot", "subplots", "legend", "expr", "expr_list", "literal",
  "string", "boolean", "enum", "function", "ref", "block", "column", "item",
];

export const aliasedStructuralIdentifier = ($, aliasNode) => {
  const inheritedSqlKeywords = SQL_KEYWORDS.map(word => $[`keyword_${word}`]);
  const dslOnlyKeywords = DSL_KEYWORDS.filter(word => !SQL_KEYWORDS.includes(word));
  return choice(
    alias($.identifier, aliasNode),
    alias(choice(...inheritedSqlKeywords), aliasNode),
    alias(choice(...dslOnlyKeywords), aliasNode),
  );
};

export const dslKeyword = ($, word) => SQL_KEYWORDS.includes(word)
  ? choice(word, alias($[`keyword_${word}`], word))
  : word;
