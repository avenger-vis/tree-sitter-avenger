#!/bin/sh
set -eu

tree-sitter generate
git --no-pager diff --no-ext-diff --exit-code -- \
  src/grammar.json \
  src/node-types.json \
  src/parser.c \
  src/tree_sitter/alloc.h \
  src/tree_sitter/array.h \
  src/tree_sitter/parser.h
