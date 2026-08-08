use serde::Deserialize;
use std::fs;
use std::path::{Path, PathBuf};
use tree_sitter::{Node, Parser, Tree};

#[derive(Deserialize)]
struct FixtureManifest {
    source_count: usize,
    sources: Vec<Fixture>,
}

#[derive(Deserialize)]
struct Fixture {
    path: String,
    classification: String,
    root: Option<String>,
}

#[derive(Deserialize)]
struct BoundaryManifest {
    sites: Vec<BoundarySite>,
    boundary_cases: Vec<BoundaryCase>,
    structural_cases: Vec<StructuralCase>,
}

#[derive(Deserialize)]
struct BoundarySite {
    name: String,
    context: String,
}

#[derive(Deserialize)]
struct BoundaryCase {
    id: String,
    site: String,
    source: String,
    outer: String,
    accepted: bool,
}

#[derive(Deserialize)]
struct StructuralCase {
    id: String,
    source: String,
    accepted: bool,
}

fn parse(source: &str, old_tree: Option<&Tree>) -> Tree {
    let language = tree_sitter_avenger::LANGUAGE.into();
    let mut parser = Parser::new();
    parser.set_language(&language).unwrap();
    parser.parse(source, old_tree).unwrap()
}

fn find(node: Node<'_>, kind: &str) -> bool {
    if node.kind() == kind {
        return true;
    }
    let mut cursor = node.walk();
    let found = node.children(&mut cursor).any(|child| find(child, kind));
    found
}

fn fixture_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("test/fixtures/compiler/sources")
}

#[test]
fn every_compiler_valid_source_parses_cleanly_with_its_expected_root() {
    let manifest: FixtureManifest =
        serde_json::from_str(include_str!("../test/fixtures/avenger-fixtures.json")).unwrap();
    assert_eq!(manifest.sources.len(), manifest.source_count);
    let expected_checked = manifest
        .sources
        .iter()
        .filter(|fixture| {
            matches!(
                fixture.classification.as_str(),
                "strict_valid" | "canonical_valid" | "example_valid" | "stdlib_valid"
            )
        })
        .count();

    let mut checked = 0;
    for fixture in &manifest.sources {
        if !matches!(
            fixture.classification.as_str(),
            "strict_valid" | "canonical_valid" | "example_valid" | "stdlib_valid"
        ) {
            continue;
        }
        let source = fs::read_to_string(fixture_root().join(&fixture.path)).unwrap();
        let tree = parse(&source, None);
        assert!(
            !tree.root_node().has_error(),
            "{}: {}",
            fixture.path,
            tree.root_node().to_sexp()
        );
        let expected = match fixture.root.as_deref().unwrap() {
            "chart" => ["chart_declaration"].as_slice(),
            "definition" => ["definition_declaration"].as_slice(),
            "data" => [
                "catalog_declaration",
                "schema_declaration",
                "table_declaration",
            ]
            .as_slice(),
            other => panic!("unknown fixture root {other}"),
        };
        assert!(
            expected.iter().any(|kind| find(tree.root_node(), kind)),
            "{} does not contain expected {:?} root",
            fixture.path,
            expected
        );
        checked += 1;
    }
    assert_eq!(checked, expected_checked);
}

#[test]
fn strict_invalid_sources_are_errors_or_documented_editor_tolerance() {
    let manifest: FixtureManifest =
        serde_json::from_str(include_str!("../test/fixtures/avenger-fixtures.json")).unwrap();
    let tolerated = [
        "avenger-lang-core/tests/fixtures/parse/invalid/empty-module.avenger",
        "avenger-lang-core/tests/fixtures/parse/invalid/import-only.avenger",
        "avenger-lang-core/tests/fixtures/parse/invalid/invalid-slot-shape.avenger",
        "avenger-lang-core/tests/fixtures/parse/invalid/late-interface.avenger",
        "avenger-lang-core/tests/fixtures/parse/invalid/malformed-action.avenger",
    ];
    let expected_checked = manifest
        .sources
        .iter()
        .filter(|fixture| fixture.classification == "strict_invalid")
        .count();
    let mut checked = 0;
    for fixture in &manifest.sources {
        if fixture.classification != "strict_invalid" {
            continue;
        }
        let source = fs::read_to_string(fixture_root().join(&fixture.path)).unwrap();
        let tree = parse(&source, None);
        if tolerated.contains(&fixture.path.as_str()) {
            assert!(
                !tree.root_node().has_error(),
                "documented tolerance must remain clean: {}",
                fixture.path
            );
        } else {
            assert!(
                tree.root_node().has_error(),
                "strict-invalid fixture unexpectedly clean: {}",
                fixture.path
            );
        }
        assert_eq!(tree.root_node().kind(), "source_file");
        let anchor = if fixture.path.ends_with("empty-module.avenger") {
            "version_directive"
        } else if fixture.path.ends_with("import-only.avenger") {
            "import_statement"
        } else if fixture.path.ends_with("define-widget.avenger")
            || fixture.path.ends_with("illegal-visibility.avenger")
            || fixture.path.ends_with("wrong-root.avenger")
        {
            "ERROR"
        } else if fixture.path.ends_with("invalid-slot-shape.avenger")
            || fixture.path.ends_with("late-interface.avenger")
        {
            "definition_declaration"
        } else if fixture.path.ends_with("malformed-action.avenger") {
            "set_action"
        } else {
            "chart_declaration"
        };
        assert!(
            find(tree.root_node(), anchor),
            "{} lost useful recovery anchor {anchor}: {}",
            fixture.path,
            tree.root_node().to_sexp()
        );
        checked += 1;
    }
    assert_eq!(checked, expected_checked);
}

fn wrap_boundary(case: &BoundaryCase, context: &str) -> String {
    match context {
        "query_property" => format!("avenger 1; chart custom {{ sql: {} }}", case.source),
        "projection_property" => {
            format!("avenger 1; chart custom {{ expressions: {} }}", case.source)
        }
        "property_expression" => format!("avenger 1; chart custom {{ x: {} }}", case.source),
        "terminated_expression" => {
            format!(
                "avenger 1; chart custom {{ on click {{ set cursor = {} }} }}",
                case.source
            )
        }
        "aliased_expression" => {
            if case.outer == ";" {
                format!(
                    "avenger 1; define transform sample {{ output {} }}",
                    case.source
                )
            } else {
                format!(
                    "avenger 1; define transform sample {{ output {}; }}",
                    case.source
                )
            }
        }
        "array_expression" if case.outer == "," => {
            format!("avenger 1; chart custom {{ x: [{}]; }}", case.source)
        }
        "array_expression" => format!("avenger 1; chart custom {{ x: [{}; }}", case.source),
        other => panic!("unknown boundary context {other}"),
    }
}

#[test]
fn compiler_owned_sql_boundary_contract_matches_the_combined_parser() {
    let manifest: BoundaryManifest = serde_json::from_str(include_str!(
        "../test/fixtures/compiler/sql_island_boundaries.json"
    ))
    .unwrap();
    for case in &manifest.boundary_cases {
        let context = manifest
            .sites
            .iter()
            .find(|site| site.name == case.site)
            .unwrap_or_else(|| panic!("unknown boundary site {}", case.site));
        let source = wrap_boundary(case, &context.context);
        let tree = parse(&source, None);
        assert_eq!(
            !tree.root_node().has_error(),
            case.accepted,
            "{}: {}\n{}",
            case.id,
            source,
            tree.root_node().to_sexp()
        );
    }
    for case in &manifest.structural_cases {
        let tree = parse(&case.source, None);
        assert_eq!(
            !tree.root_node().has_error(),
            case.accepted,
            "{}: {}",
            case.id,
            tree.root_node().to_sexp()
        );
    }
}
