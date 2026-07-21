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

#[test]
fn checked_repairs_converge_to_clean_parse() {
    let manifest: EditManifest =
        serde_json::from_str(include_str!("../test/fixtures/incremental/edits.json")).unwrap();
    assert_eq!(manifest.schema_version, 1);
    for case in manifest.cases {
        let mut old_tree = parse(&case.initial, None);
        assert!(
            old_tree.root_node().has_error(),
            "{} must begin partial",
            case.id
        );

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
        "avenger 1;\nimport './data.avenger' as data;\nchart custom as demo { x: coalesce($width@start, 0); }",
        "avenger 1;\ndefine mark badge { slot number as radius; mark symbol as points {} }",
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
        assert!(!tree.root_node().has_error(), "{}", tree.root_node().to_sexp());
        assert_eq!(tree.root_node().to_sexp(), clean.root_node().to_sexp());
    }
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
    let source = "avenger 1;\nchart custom as demo {\n  param as width { type: float64; default: 10; }\n  sql: FROM vega.movies SELECT title;\n  on click { set param width at start = $width@previous + 1; }\n  mark symbol as points {}\n}\n";
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
        "type",
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
