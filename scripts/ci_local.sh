#!/bin/sh
set -eu

sql_root="${1:-../tree-sitter-avenger-sql}"
avenger_root="${2:-../avenger}"

npm ci
npm run sync:sql-base -- --sql-root "$sql_root" --check
npm run sync:fixtures -- --avenger-root "$avenger_root" --check
npm run check-generated
npm test
npm run test:highlights
npm run test:fixtures
npm run test:wasm
npm run test:fixtures:wasm
npm run test:scanner-sanitizers
npm run test:fuzz
npm run measure -- --check
cargo fmt --all --check
cargo test --release
cargo clippy --release --all-targets -- -D warnings
cc -std=c11 -Wall -Wextra -Wpedantic -Werror -Isrc -c src/parser.c src/scanner.c
npm pack --dry-run
cargo package
