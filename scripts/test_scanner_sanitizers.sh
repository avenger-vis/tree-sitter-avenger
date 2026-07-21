#!/bin/sh
set -eu

: "${CC:=clang}"
mkdir -p target
"$CC" \
  -std=c11 \
  -Wall -Wextra -Wpedantic -Werror \
  -fsanitize=address,undefined \
  -fno-omit-frame-pointer \
  -Isrc \
  src/scanner.c tests/scanner_harness.c \
  -o target/scanner-sanitizer
if [ "$(uname -s)" = "Darwin" ]; then
  leak_check=0
else
  leak_check=1
fi
ASAN_OPTIONS=detect_leaks="$leak_check":halt_on_error=1 \
UBSAN_OPTIONS=halt_on_error=1 \
  target/scanner-sanitizer
