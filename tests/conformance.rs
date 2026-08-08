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

fn find_with_field<'tree>(node: Node<'tree>, kind: &str, field: &str) -> Option<Node<'tree>> {
    if node.kind() == kind && node.child_by_field_name(field).is_some() {
        return Some(node);
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if let Some(found) = find_with_field(child, kind, field) {
            return Some(found);
        }
    }
    None
}

fn count(node: Node<'_>, kind: &str) -> usize {
    let own = usize::from(node.kind() == kind);
    let mut cursor = node.walk();
    own + node
        .children(&mut cursor)
        .map(|child| count(child, kind))
        .sum::<usize>()
}

fn assert_field(node: Node<'_>, field: &str, kind: &str) {
    let child = node.child_by_field_name(field).unwrap_or_else(|| {
        panic!(
            "{} must expose field {field}: {}",
            node.kind(),
            node.to_sexp()
        )
    });
    assert_eq!(child.kind(), kind, "{} field {field}", node.kind());
}

#[test]
fn minimal_chart_has_stable_root_shape() {
    let tree = parse("avenger 1; chart cartesian {}");
    let root = tree.root_node();
    assert!(!root.has_error(), "{}", root.to_sexp());
    assert_eq!(root.kind(), "source_file");
    assert_eq!(root.named_child(0).unwrap().kind(), "version_directive");
    assert_eq!(root.named_child(1).unwrap().kind(), "chart_declaration");
    assert_field(root.named_child(1).unwrap(), "kind", "qualified_name");
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
fn module_imports_exports_and_chart_binders_have_stable_fields() {
    let tree = parse(
        "avenger 1;\n\
         import { badge, summarize as aggregate } from './library.avenger' sha256 'abc';\n\
         import * as acme from 'native:acme';\n\
         export define mark badge {}\n\
         export chart acme.cartesian as dashboard {}",
    );
    let root = tree.root_node();
    assert!(!root.has_error(), "{}", root.to_sexp());

    let first_import = find(root, "import_statement").unwrap();
    assert_field(first_import, "clause", "named_import_clause");
    assert_field(first_import, "source", "single_quoted_string");
    assert_field(first_import, "hash", "single_quoted_string");
    let first_specifier = find(first_import, "import_specifier").unwrap();
    assert_field(first_specifier, "imported", "identifier");

    let namespace = find(root, "namespace_import_clause").unwrap();
    assert_field(namespace, "local", "identifier");

    assert_eq!(count(root, "exported_module_item"), 2);
    let exported = find(root, "exported_module_item").unwrap();
    assert!(exported.child_by_field_name("export").is_some());
    assert!(exported.child_by_field_name("declaration").is_some());

    let chart = find(root, "chart_declaration").unwrap();
    assert_field(chart, "kind", "qualified_name");
    assert_field(chart, "name", "identifier");
    assert_field(chart, "body", "body");
}

#[test]
fn obsolete_import_forms_recover_without_losing_later_charts() {
    for source in [
        "avenger 1; import './data.avenger' as data; chart cartesian as recovered {}",
        "avenger 1; import badge from './badge.avenger'; chart cartesian as recovered {}",
        "avenger 1; export { badge } from './badge.avenger'; chart cartesian as recovered {}",
    ] {
        let tree = parse(source);
        let root = tree.root_node();
        assert!(root.has_error(), "obsolete form parsed cleanly: {source}");
        assert_eq!(
            count(root, "chart_declaration"),
            1,
            "later chart was lost: {}",
            root.to_sexp()
        );
    }
}

#[test]
fn removed_assignment_actions_recover_without_hiding_canonical_actions() {
    for removed in ["set width = 2;", "set rows = upsert_rows;"] {
        let source = format!(
            "avenger 1; chart custom {{ on click {{ {removed} set cursor to 'crosshair'; }} }}"
        );
        let tree = parse(&source);
        let root = tree.root_node();
        assert!(root.has_error(), "removed form parsed cleanly: {removed}");
        assert_eq!(
            count(root, "state_action"),
            1,
            "canonical action was lost: {}",
            root.to_sexp()
        );
        assert_eq!(count(root, "set_action"), 0);
        assert_eq!(count(root, "action_block"), 0);
    }
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
         on click { set cursor to coalesce($cursor_name, 'default'); }\n\
         output coalesce($width, 0) as count;\n\
         values: [coalesce(1, 2), none];\n\
         }",
    );
    let root = tree.root_node();
    assert!(!root.has_error(), "{}", root.to_sexp());

    for (wrapper, inherited) in [
        ("sql_query", "query"),
        ("sql_property_expression", "binding_reference"),
        ("sql_terminated_expression", "function_call"),
        ("sql_aliased_expression", "function_call"),
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
         store as config {\n\
           field struct(field(list(decimal128(38, -2)), 'values')) value;\n\
         }\n\
         selection as brush {}\n\
         }",
    );
    let root = tree.root_node();
    assert!(!root.has_error(), "{}", root.to_sexp());
    assert!(find(root, "arrow_struct_field").is_some());
    assert!(find(root, "arrow_signed_integer").is_some());

    let selection = find(root, "selection_declaration").unwrap();
    assert!(find(selection, "arrow_type").is_none());
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

#[test]
fn value_shapes_and_structural_delimiters_are_stable() {
    let tree = parse(
        "avenger 1; chart cartesian {\n\
         typed: linear { clamp: true; }\n\
         configured: $width@previous { fallback: 0; }\n\
         reference: mark plot.points;\n\
         channel: direct 'literal';\n\
         values: [{name: 'dsl';}, 'literal', pattern {}, none,\n\
                  [1, 2], {key: 'sql'}, (SELECT 1), $$};,[]$$];\n\
         }",
    );
    let root = tree.root_node();
    assert!(!root.has_error(), "{}", root.to_sexp());
    for kind in [
        "typed_object",
        "configured_expression",
        "typed_reference",
        "anonymous_object",
        "channel_value",
        "channel_mode",
        "array_pattern_value",
        "none_value",
        "array_expression",
        "struct_expression",
        "subquery_expression",
        "dollar_quoted_string",
    ] {
        assert!(
            find(root, kind).is_some(),
            "missing {kind}: {}",
            root.to_sexp()
        );
    }
}

#[test]
fn complete_declaration_surface_has_stable_nodes_and_fields() {
    let source = include_str!("../test/fixtures/declarations.avenger");
    let tree = parse(source);
    let root = tree.root_node();
    assert!(!root.has_error(), "{}", root.to_sexp());

    for kind in [
        "param_declaration",
        "resource_declaration",
        "theme_declaration",
        "mark_declaration",
        "transform_declaration",
        "tool_declaration",
        "widget_declaration",
        "view_declaration",
        "event_declaration",
        "cell_declaration",
        "plot_declaration",
        "variable_declaration",
        "part_declaration",
        "level_declaration",
        "adjust_declaration",
        "derive_declaration",
        "layer_declaration",
        "when_declaration",
        "field_declaration",
        "row_declaration",
        "key_declaration",
        "fields_declaration",
        "scale_edit_declaration",
        "scale_hint_declaration",
        "clause_declaration",
        "equality_declaration",
        "interval_declaration",
        "predicate_entry",
    ] {
        assert!(find(root, kind).is_some(), "missing {kind}");
    }

    let cell = find(root, "cell_declaration").unwrap();
    assert_field(cell, "kind", "qualified_name");
    assert_field(cell, "placement", "body");
    assert_field(cell, "body", "body");

    assert_eq!(count(root, "param_declaration"), 1);
    let scalar = find(root, "param_declaration").unwrap();
    assert_field(scalar, "initializer", "literal");
    assert_field(scalar, "name", "identifier");
    assert_field(scalar, "body", "param_body");

    let store = find(root, "store_declaration").unwrap();
    assert_field(store, "name", "identifier");
    assert_field(store, "body", "param_body");

    let selection = find(root, "selection_declaration").unwrap();
    assert_field(selection, "name", "identifier");
    assert_field(selection, "body", "param_body");

    let group = find(root, "mark_declaration").expect("fixture must contain mark group");
    assert_field(group, "kind", "qualified_name");
    assert_field(group, "body", "body");

    let variable = find(root, "variable_declaration").unwrap();
    assert_field(variable, "role", "variable_role");
    assert_field(variable, "name", "identifier");

    let predicate = find(root, "predicate_entry").unwrap();
    assert_field(predicate, "name", "identifier");
    assert_field(predicate, "body", "body");
}

#[test]
fn definition_interfaces_and_actions_have_stable_fields() {
    let definitions = parse(include_str!("../test/fixtures/declarations.avenger"));
    let root = definitions.root_node();
    assert!(!root.has_error(), "{}", root.to_sexp());
    let definition = find(root, "definition_declaration").unwrap();
    assert_field(definition, "kind", "definition_kind");
    assert_field(definition, "name", "identifier");
    assert_field(definition, "body", "definition_body");
    let slot = find(definition, "slot_declaration").unwrap();
    assert_field(slot, "kind", "slot_shape");
    assert_field(slot, "name", "identifier");
    assert!(find(definition, "output_declaration").is_some());
    assert!(find(definition, "export_declaration").is_some());

    let action = find(root, "state_action").expect("fixture must contain an action");
    assert_field(action, "operation", "state_action_operation");
    assert_field(action, "target", "qualified_name");
    assert_field(action, "time", "action_time");
    assert_field(action, "replacing", "replacing_scopes_modifier");
    assert_field(action, "value", "sql_terminated_expression");
    assert!(find_with_field(root, "state_action", "body").is_some());
    assert!(find_with_field(root, "state_action", "source").is_some());
    assert!(find_with_field(root, "state_action", "within").is_some());
}

#[test]
fn syntactically_invalid_definition_heads_recover_without_hiding_following_roots() {
    let removed_state_params =
        parse("avenger 1; chart custom { param store as rows {} param selection as picked {} }");
    assert!(!removed_state_params.root_node().has_error());
    assert_eq!(
        count(removed_state_params.root_node(), "obsolete_state_param"),
        2
    );

    for source in [
        "avenger 1; define widget custom {} chart custom {}",
        "avenger 1; chart custom { id legacy {} mark symbol {} }",
        "avenger 1; chart custom { param as width { type: float64; default: 1; } }",
        "avenger 1; chart custom { group {} overlay {} dimension as x {} }",
        "avenger 1; chart custom { container group {} container overlay {} }",
        "avenger 1; chart custom { on click { set param width to 1; } }",
        "avenger 1; define mark sample { slot expr as x; channel x; }",
        "avenger 1; chart custom { variable row as x {} field x: float64; adjust {} }",
        "avenger 1; define transform sample { output result: value + 1; }",
    ] {
        let tree = parse(source);
        assert!(
            tree.root_node().has_error(),
            "must be recovery-only: {source}"
        );
        assert_eq!(tree.root_node().kind(), "source_file");
    }
}
