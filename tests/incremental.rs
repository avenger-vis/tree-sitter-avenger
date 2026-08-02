use serde::Deserialize;
use tree_sitter::{InputEdit, Parser, Point, Tree};

#[derive(Deserialize)]
struct EditManifest {
    schema_version: u32,
    cases: Vec<EditCase>,
}

#[derive(Deserialize)]
struct EditCase {
    id: String,
    initial: String,
    start_byte: usize,
    old_end_byte: usize,
    start_position: Position,
    old_end_position: Position,
    replacement: String,
    final_node: String,
    #[serde(rename = "final")]
    expected_final: String,
    max_changed_ranges: usize,
    #[serde(default = "default_true")]
    initial_must_error: bool,
}

const fn default_true() -> bool {
    true
}

#[derive(Clone, Copy, Deserialize)]
struct Position {
    row: usize,
    column: usize,
}

fn parser() -> Parser {
    let language = tree_sitter_avenger::LANGUAGE.into();
    let mut parser = Parser::new();
    parser.set_language(&language).unwrap();
    parser
}

fn parse(source: &str, old_tree: Option<&Tree>) -> Tree {
    parser().parse(source, old_tree).unwrap()
}

fn point(position: Position) -> Point {
    Point::new(position.row, position.column)
}

fn advance(mut position: Point, text: &str) -> Point {
    for byte in text.bytes() {
        if byte == b'\n' {
            position.row += 1;
            position.column = 0;
        } else {
            position.column += 1;
        }
    }
    position
}

fn point_at(source: &str, byte: usize) -> Point {
    advance(Point::new(0, 0), &source[..byte])
}

fn contains_kind(node: tree_sitter::Node<'_>, kind: &str) -> bool {
    if node.kind() == kind {
        return true;
    }
    let mut cursor = node.walk();
    let found = node
        .children(&mut cursor)
        .any(|child| contains_kind(child, kind));
    found
}

fn assert_incremental_replacement(
    initial: &str,
    start_byte: usize,
    old_end_byte: usize,
    replacement: &str,
) {
    let mut old_tree = parse(initial, None);
    assert!(
        !old_tree.root_node().has_error(),
        "{}",
        old_tree.root_node().to_sexp()
    );
    let start_position = point_at(initial, start_byte);
    let old_end_position = point_at(initial, old_end_byte);
    old_tree.edit(&InputEdit {
        start_byte,
        old_end_byte,
        new_end_byte: start_byte + replacement.len(),
        start_position,
        old_end_position,
        new_end_position: advance(start_position, replacement),
    });

    let mut final_source = initial.to_owned();
    final_source.replace_range(start_byte..old_end_byte, replacement);
    let incremental = parse(&final_source, Some(&old_tree));
    let clean = parse(&final_source, None);
    assert!(
        !incremental.root_node().has_error(),
        "{final_source}\n{}",
        incremental.root_node().to_sexp()
    );
    assert_eq!(
        incremental.root_node().to_sexp(),
        clean.root_node().to_sexp(),
        "{final_source}"
    );
}

#[test]
fn checked_repairs_converge_to_clean_parse() {
    let manifest: EditManifest =
        serde_json::from_str(include_str!("../test/fixtures/incremental/edits.json")).unwrap();
    assert_eq!(manifest.schema_version, 1);
    for case in manifest.cases {
        let mut old_tree = parse(&case.initial, None);
        if case.initial_must_error {
            assert!(
                old_tree.root_node().has_error(),
                "{} must begin partial",
                case.id
            );
        }

        let start = point(case.start_position);
        let old_end = point(case.old_end_position);
        assert_eq!(point_at(&case.initial, case.start_byte), start);
        assert_eq!(point_at(&case.initial, case.old_end_byte), old_end);
        old_tree.edit(&InputEdit {
            start_byte: case.start_byte,
            old_end_byte: case.old_end_byte,
            new_end_byte: case.start_byte + case.replacement.len(),
            start_position: start,
            old_end_position: old_end,
            new_end_position: advance(start, &case.replacement),
        });
        let mut final_source = case.initial;
        final_source.replace_range(case.start_byte..case.old_end_byte, &case.replacement);
        assert_eq!(
            final_source, case.expected_final,
            "{} final source drift",
            case.id
        );
        let incremental = parse(&final_source, Some(&old_tree));
        let clean = parse(&final_source, None);
        assert!(
            !incremental.root_node().has_error(),
            "{}: {}",
            case.id,
            incremental.root_node().to_sexp()
        );
        assert_eq!(
            incremental.root_node().to_sexp(),
            clean.root_node().to_sexp(),
            "{}",
            case.id
        );
        assert!(
            contains_kind(incremental.root_node(), &case.final_node),
            "{} lost final node {}",
            case.id,
            case.final_node
        );
        let changed: Vec<_> = old_tree.changed_ranges(&incremental).collect();
        assert!(
            !changed.is_empty(),
            "{} must report a changed range",
            case.id
        );
        assert!(
            changed.len() <= case.max_changed_ranges,
            "{} changed ranges: {changed:?}",
            case.id
        );
        assert!(
            changed.len() <= 4,
            "{} changed ranges: {changed:?}",
            case.id
        );
    }
}

#[test]
fn character_by_character_construction_converges() {
    for source in [
        "avenger 1;\nimport { data } from './data.avenger';\nchart custom as demo { x: coalesce($width@start, 0); }",
        "avenger 1;\ndefine mark badge { slot number radius; mark symbol as points {} }",
        "avenger 1;\ncatalog memory as local { schema memory as vega { table csv as movies { path: 'movies.csv'; } } }",
        include_str!("../test/fixtures/declarations.avenger"),
        "avenger 1;\nchart custom { sql: FROM vega.movies AS m SELECT m.title WHERE m.rating > $minimum; }",
    ] {
        let mut current = String::new();
        let mut tree = parse(&current, None);
        for character in source.chars() {
            let start_byte = current.len();
            let start_position = point_at(&current, start_byte);
            let replacement = character.to_string();
            tree.edit(&InputEdit {
                start_byte,
                old_end_byte: start_byte,
                new_end_byte: start_byte + replacement.len(),
                start_position,
                old_end_position: start_position,
                new_end_position: advance(start_position, &replacement),
            });
            current.push(character);
            tree = parse(&current, Some(&tree));
        }
        let clean = parse(source, None);
        assert!(
            !tree.root_node().has_error(),
            "{}",
            tree.root_node().to_sexp()
        );
        assert_eq!(tree.root_node().to_sexp(), clean.root_node().to_sexp());
    }
}

#[test]
fn module_structure_edits_converge() {
    let private_chart = "avenger 1;\nchart cartesian as first {}\n";
    let chart_start = private_chart.find("chart").unwrap();
    assert_incremental_replacement(private_chart, chart_start, chart_start, "export ");

    let exported_chart = "avenger 1;\nexport chart cartesian as first {}\n";
    let export_start = exported_chart.find("export ").unwrap();
    assert_incremental_replacement(
        exported_chart,
        export_start,
        export_start + "export ".len(),
        "",
    );

    let shorthand =
        "avenger 1;\nimport { badge } from './library.avenger';\nchart badge as first {}\n";
    let badge_end = shorthand.find("badge").unwrap() + "badge".len();
    assert_incremental_replacement(shorthand, badge_end, badge_end, " as local");

    let singleton = "avenger 1;\nchart cartesian as first {}\n";
    assert_incremental_replacement(
        singleton,
        singleton.len(),
        singleton.len(),
        "chart polar as second {}\n",
    );

    let unqualified =
        "avenger 1;\nimport * as acme from 'native:acme';\nchart cartesian as first {}\n";
    let kind_start = unqualified.rfind("cartesian").unwrap();
    assert_incremental_replacement(
        unqualified,
        kind_start,
        kind_start + "cartesian".len(),
        "acme.cartesian",
    );
}

#[test]
fn truncation_and_delimiter_mutations_recover_without_crashing() {
    let source = include_str!("../test/fixtures/declarations.avenger");
    let clean = parse(source, None);
    assert!(!clean.root_node().has_error());

    for end in (0..source.len()).step_by(7) {
        if source.is_char_boundary(end) {
            let _ = parse(&source[..end], None);
        }
    }

    for (index, character) in source.char_indices().filter(|(_, character)| {
        matches!(
            character,
            '{' | '}' | '[' | ']' | '(' | ')' | ':' | ';' | ',' | '\''
        )
    }) {
        let end = index + character.len_utf8();
        let mut mutated = source.to_owned();
        mutated.replace_range(index..end, "");
        let mut broken = parse(&mutated, None);
        let start_position = point_at(&mutated, index);
        broken.edit(&InputEdit {
            start_byte: index,
            old_end_byte: index,
            new_end_byte: end,
            start_position,
            old_end_position: start_position,
            new_end_position: advance(start_position, &source[index..end]),
        });
        let repaired = parse(source, Some(&broken));
        assert_eq!(
            repaired.root_node().to_sexp(),
            clean.root_node().to_sexp(),
            "failed to repair delimiter {character:?} at {index}"
        );
    }
}

#[test]
fn scanner_binding_and_temporal_delimiters_repair_incrementally() {
    let source = "avenger 1;\n-- comment\nchart custom {\n  /* outer /* inner */ outer */\n  text: 'abc';\n  raw: $tag$raw text$tag$;\n  value: $width@previous;\n}\n";
    let clean = parse(source, None);
    assert!(
        !clean.root_node().has_error(),
        "{}",
        clean.root_node().to_sexp()
    );

    for (index, character) in source
        .char_indices()
        .filter(|(_, character)| matches!(character, '-' | '/' | '*' | '$' | '@' | '\''))
    {
        let end = index + character.len_utf8();
        let mut mutated = source.to_owned();
        mutated.replace_range(index..end, "");
        let mut broken = parse(&mutated, None);
        let start_position = point_at(&mutated, index);
        broken.edit(&InputEdit {
            start_byte: index,
            old_end_byte: index,
            new_end_byte: end,
            start_position,
            old_end_position: start_position,
            new_end_position: advance(start_position, &source[index..end]),
        });
        let repaired = parse(source, Some(&broken));
        assert_eq!(
            repaired.root_node().to_sexp(),
            clean.root_node().to_sexp(),
            "failed to repair scanner delimiter {character:?} at {index}"
        );
    }
}

#[test]
fn keyword_binder_operator_and_boundary_tokens_repair_incrementally() {
    let source = "avenger 1;\nchart custom as demo {\n  param float64 as width { value: 10; }\n  sql: FROM vega.movies SELECT title;\n  on click { set width at start = $width@previous + 1; }\n  mark symbol as points {}\n}\n";
    let clean = parse(source, None);
    assert!(
        !clean.root_node().has_error(),
        "{}",
        clean.root_node().to_sexp()
    );

    for needle in [
        "avenger",
        "chart",
        " as ",
        "param",
        "float64",
        "sql:",
        "FROM",
        "SELECT",
        "on",
        "set",
        " at start",
        " = ",
        "$width",
        "@previous",
        "+",
        "mark",
    ] {
        let index = source
            .find(needle)
            .unwrap_or_else(|| panic!("missing {needle}"));
        let end = index + needle.len();
        let mut mutated = source.to_owned();
        mutated.replace_range(index..end, "");
        let mut broken = parse(&mutated, None);
        let start_position = point_at(&mutated, index);
        broken.edit(&InputEdit {
            start_byte: index,
            old_end_byte: index,
            new_end_byte: end,
            start_position,
            old_end_position: start_position,
            new_end_position: advance(start_position, needle),
        });
        let repaired = parse(source, Some(&broken));
        assert_eq!(
            repaired.root_node().to_sexp(),
            clean.root_node().to_sexp(),
            "failed to repair token {needle:?}"
        );
    }
}
