use tree_sitter::{Node, Parser};

fn parse(source: &str) -> tree_sitter::Tree {
    let language = tree_sitter_avenger::LANGUAGE.into();
    let mut parser = Parser::new();
    parser
        .set_language(&language)
        .expect("Avenger language must load");
    parser
        .parse(source, None)
        .expect("parser must return a tree")
}

fn find<'tree>(node: Node<'tree>, kind: &str) -> Option<Node<'tree>> {
    if node.kind() == kind {
        return Some(node);
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if let Some(found) = find(child, kind) {
            return Some(found);
        }
    }
    None
}

#[test]
fn minimal_chart_has_stable_root_shape() {
    let tree = parse("avenger 1; chart cartesian {}");
    let root = tree.root_node();
    assert!(!root.has_error(), "{}", root.to_sexp());
    assert_eq!(root.kind(), "source_file");
    assert_eq!(root.named_child(0).unwrap().kind(), "version_directive");
    assert_eq!(root.named_child(1).unwrap().kind(), "chart_declaration");
    assert_eq!(
        root.named_child(1)
            .unwrap()
            .child_by_field_name("body")
            .unwrap()
            .kind(),
        "body"
    );
}

#[test]
fn malformed_header_and_body_recover_locally() {
    let missing_number = parse("avenger ;\nchart cartesian { value: 1; }");
    assert!(find(missing_number.root_node(), "ERROR").is_some());
    assert!(find(missing_number.root_node(), "chart_declaration").is_some());

    let missing_semicolon = parse("avenger 1\nchart cartesian { value: 1; }");
    assert!(find(missing_semicolon.root_node(), "chart_declaration").is_some());

    let missing_brace = parse("avenger 1;\nchart cartesian { value: 1;");
    assert!(find(missing_brace.root_node(), "chart_declaration").is_some());
    assert!(missing_brace.root_node().has_error());
}

#[test]
fn sql_boundaries_have_direct_inherited_children() {
    let tree = parse(
        "avenger 1; chart cartesian {\n\
         sql: FROM vega.movies SELECT title;\n\
         x: $width@start { enabled: true; }\n\
         output count: coalesce($width, 0);\n\
         values: [coalesce(1, 2), none];\n\
         }",
    );
    let root = tree.root_node();
    assert!(!root.has_error(), "{}", root.to_sexp());

    for (wrapper, inherited) in [
        ("sql_query", "query"),
        ("sql_property_expression", "binding_reference"),
        ("sql_terminated_expression", "function_call"),
        ("sql_array_expression", "function_call"),
    ] {
        let wrapper = find(root, wrapper).unwrap_or_else(|| panic!("missing {wrapper}"));
        assert_eq!(wrapper.named_child(0).unwrap().kind(), inherited);
    }
}

#[test]
fn exported_queries_compile() {
    let language = tree_sitter_avenger::LANGUAGE.into();
    for (name, source) in [
        ("highlights", tree_sitter_avenger::HIGHLIGHTS_QUERY),
        ("brackets", tree_sitter_avenger::BRACKETS_QUERY),
        ("indents", tree_sitter_avenger::INDENTS_QUERY),
    ] {
        tree_sitter::Query::new(&language, source)
            .unwrap_or_else(|error| panic!("{name} query must compile: {error}"));
    }
}

#[test]
fn arrow_types_are_structural_only_in_type_slots() {
    let tree = parse(
        "avenger 1; chart cartesian {\n\
         param as config {\n\
           type: struct(field('values', list(decimal128(38, -2))));\n\
         }\n\
         selection as brush { type: interval; }\n\
         }",
    );
    let root = tree.root_node();
    assert!(!root.has_error(), "{}", root.to_sexp());
    assert!(find(root, "arrow_struct_field").is_some());
    assert!(find(root, "arrow_signed_integer").is_some());

    let selection = find(root, "selection_declaration").unwrap();
    assert!(find(selection, "arrow_type").is_none());
    assert!(find(selection, "sql_property_expression").is_some());
}

#[test]
fn source_retains_multiple_tolerated_roots_and_unicode_names() {
    let tree = parse(
        "avenger 1;\n\
         chart custom as café {}\n\
         define mark Δvalue {}\n\
         catalog memory as sales_2026 {}\n\
         chart custom as Case {}\n\
         chart custom as case {}",
    );
    let root = tree.root_node();
    assert!(!root.has_error(), "{}", root.to_sexp());
    assert_eq!(root.named_child_count(), 6);
}

#[test]
fn structural_names_and_version_reject_noncanonical_prefixes() {
    for source in [
        "avenger -1; chart cartesian {}",
        "avenger +1; chart cartesian {}",
        "avenger 1; chart cartesian as $bad {}",
        "avenger 1; chart cartesian as @bad {}",
        "avenger 1; chart cartesian as #bad {}",
        "avenger 1; chart cartesian as 9bad {}",
    ] {
        let tree = parse(source);
        assert!(tree.root_node().has_error(), "unexpectedly clean: {source}");
    }
}
