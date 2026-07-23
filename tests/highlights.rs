use std::collections::HashSet;
use tree_sitter::{Parser, Query, QueryCursor, StreamingIterator};

#[test]
fn composed_highlights_capture_sql_and_structural_roles() {
    let source = include_str!("../test/highlight/surface.avenger");
    let language = tree_sitter_avenger::LANGUAGE.into();
    let mut parser = Parser::new();
    parser.set_language(&language).unwrap();
    let tree = parser.parse(source, None).unwrap();
    assert!(
        !tree.root_node().has_error(),
        "{}",
        tree.root_node().to_sexp()
    );

    let query = Query::new(&language, tree_sitter_avenger::HIGHLIGHTS_QUERY).unwrap();
    let names = query.capture_names();
    let mut cursor = QueryCursor::new();
    let mut captures = cursor.captures(&query, tree.root_node(), source.as_bytes());
    let mut observed = HashSet::new();
    while let Some((query_match, capture_index)) = captures.next() {
        let capture = query_match.captures[*capture_index];
        observed.insert((
            names[capture.index as usize],
            &source[capture.node.byte_range()],
        ));
    }

    for expected in [
        ("comment.doc", "-- | A chart-level documentation comment.\n"),
        ("keyword", "chart"),
        ("keyword", "public"),
        ("type", "custom_mark"),
        ("variable", "points"),
        ("property", "x"),
        ("function", "coalesce"),
        ("function", "plot"),
        ("variable.special", "width"),
        ("attribute", "@start"),
        ("type.builtin", "float64"),
        ("keyword", "store"),
        ("type.builtin", "group"),
        ("type.builtin", "row"),
        ("property", "id"),
        ("variable.parameter", "x"),
    ] {
        assert!(
            observed.contains(&expected),
            "missing {expected:?}; observed: {observed:#?}"
        );
    }
}

#[test]
fn editor_queries_compile_against_the_committed_language() {
    let language = tree_sitter_avenger::LANGUAGE.into();
    for (name, source) in [
        ("highlights", tree_sitter_avenger::HIGHLIGHTS_QUERY),
        ("brackets", tree_sitter_avenger::BRACKETS_QUERY),
        ("indents", tree_sitter_avenger::INDENTS_QUERY),
    ] {
        Query::new(&language, source)
            .unwrap_or_else(|error| panic!("{name} query must compile: {error}"));
    }
}
