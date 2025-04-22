/**
 * @file Avenger Visualization Language
 * @author Jon Mease <jonmmease@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "avenger",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
