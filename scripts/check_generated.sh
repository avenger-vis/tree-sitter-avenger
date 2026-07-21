#!/bin/sh
set -eu

if [ "${1:-}" = "--from-json" ]; then
  output="$(mktemp -d "${TMPDIR:-/tmp}/tree-sitter-avenger-generated.XXXXXX")"
  tree-sitter generate src/grammar.json --output "$output"
  for path in \
    parser.c \
    node-types.json \
    tree_sitter/alloc.h \
    tree_sitter/array.h \
    tree_sitter/parser.h
  do
    cmp "src/$path" "$output/$path" || {
      echo "src/$path differs from regeneration using src/grammar.json" >&2
      exit 1
    }
  done
  exit 0
fi

tree-sitter generate
git --no-pager diff --no-ext-diff --exit-code -- \
  src/grammar.json \
  src/node-types.json \
  src/parser.c \
  src/tree_sitter/alloc.h \
  src/tree_sitter/array.h \
  src/tree_sitter/parser.h
