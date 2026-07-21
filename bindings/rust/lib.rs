//! Tree-sitter grammar for the Avenger visualization language.
//!
//! This parser is tolerant and intended for editor tooling. The Avenger Rust
//! frontend remains the authority for strict syntax and semantics.

use tree_sitter_language::LanguageFn;

unsafe extern "C" {
    fn tree_sitter_avenger() -> *const ();
}

/// The Tree-sitter language function for this grammar.
pub const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_avenger) };

/// The generated public node contract.
pub const NODE_TYPES: &str = include_str!("../../src/node-types.json");

/// Composed SQL and structural syntax highlights.
pub const HIGHLIGHTS_QUERY: &str = include_str!("../../queries/highlights.scm");

/// Structural and inherited SQL bracket pairs.
pub const BRACKETS_QUERY: &str = include_str!("../../queries/brackets.scm");

/// Structural indentation query.
pub const INDENTS_QUERY: &str = include_str!("../../queries/indents.scm");

#[cfg(test)]
mod tests {
    #[test]
    fn grammar_and_queries_load() {
        let language = super::LANGUAGE.into();
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&language)
            .expect("Avenger language must load");
        for query in [
            super::HIGHLIGHTS_QUERY,
            super::BRACKETS_QUERY,
            super::INDENTS_QUERY,
        ] {
            tree_sitter::Query::new(&language, query).expect("query must compile");
        }
    }
}
