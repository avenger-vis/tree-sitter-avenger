#include "tree_sitter/parser.h"

#include <assert.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum TokenType {
  LINE_COMMENT,
  BLOCK_COMMENT,
  DOLLAR_QUOTED_STRING,
};

void *tree_sitter_avenger_external_scanner_create(void);
void tree_sitter_avenger_external_scanner_destroy(void *payload);
unsigned tree_sitter_avenger_external_scanner_serialize(void *payload,
                                                            char *buffer);
void tree_sitter_avenger_external_scanner_deserialize(
    void *payload, const char *buffer, unsigned length);
bool tree_sitter_avenger_external_scanner_scan(
    void *payload, TSLexer *lexer, const bool *valid_symbols);

typedef struct {
  TSLexer lexer;
  const unsigned char *input;
  size_t length;
  size_t position;
  size_t mark;
} TestLexer;

static TestLexer *test_lexer(TSLexer *lexer) { return (TestLexer *)lexer; }

static int32_t decode(const unsigned char *input, size_t length, size_t position,
                      size_t *width) {
  if (position >= length) {
    *width = 0;
    return 0;
  }
  unsigned char first = input[position];
  if (first < 0x80) {
    *width = 1;
    return first;
  }
  if ((first & 0xe0) == 0xc0 && position + 1 < length) {
    *width = 2;
    return ((int32_t)(first & 0x1f) << 6) | (input[position + 1] & 0x3f);
  }
  if ((first & 0xf0) == 0xe0 && position + 2 < length) {
    *width = 3;
    return ((int32_t)(first & 0x0f) << 12) |
           ((int32_t)(input[position + 1] & 0x3f) << 6) |
           (input[position + 2] & 0x3f);
  }
  if ((first & 0xf8) == 0xf0 && position + 3 < length) {
    *width = 4;
    return ((int32_t)(first & 0x07) << 18) |
           ((int32_t)(input[position + 1] & 0x3f) << 12) |
           ((int32_t)(input[position + 2] & 0x3f) << 6) |
           (input[position + 3] & 0x3f);
  }
  *width = 1;
  return first;
}

static void advance(TSLexer *lexer, bool skip) {
  (void)skip;
  TestLexer *test = test_lexer(lexer);
  size_t width = 0;
  (void)decode(test->input, test->length, test->position, &width);
  test->position += width;
  lexer->lookahead = decode(test->input, test->length, test->position, &width);
}

static void mark_end(TSLexer *lexer) {
  TestLexer *test = test_lexer(lexer);
  test->mark = test->position;
}

static uint32_t get_column(TSLexer *lexer) {
  return (uint32_t)test_lexer(lexer)->position;
}

static bool included_range_start(const TSLexer *lexer) {
  (void)lexer;
  return false;
}

static bool eof(const TSLexer *lexer) {
  const TestLexer *test = (const TestLexer *)lexer;
  return test->position >= test->length;
}

static void log_message(const TSLexer *lexer, const char *format, ...) {
  (void)lexer;
  (void)format;
}

static TestLexer make_lexer(const char *source) {
  TestLexer test = {0};
  test.input = (const unsigned char *)source;
  test.length = strlen(source);
  test.lexer.advance = advance;
  test.lexer.mark_end = mark_end;
  test.lexer.get_column = get_column;
  test.lexer.is_at_included_range_start = included_range_start;
  test.lexer.eof = eof;
  test.lexer.log = log_message;
  size_t width = 0;
  test.lexer.lookahead = decode(test.input, test.length, 0, &width);
  return test;
}

static void expect_scan(const char *source, enum TokenType token,
                        bool expected) {
  TestLexer lexer = make_lexer(source);
  bool valid[3] = {false, false, false};
  valid[token] = true;
  bool scanned = tree_sitter_avenger_external_scanner_scan(
      NULL, &lexer.lexer, valid);
  assert(scanned == expected);
  if (expected) {
    assert(lexer.lexer.result_symbol == (TSSymbol)token);
    assert(lexer.mark == lexer.length);
  }
}

static char *nested_comment(size_t depth) {
  size_t length = depth * 4 + 1;
  char *source = malloc(length + 1);
  assert(source != NULL);
  size_t position = 0;
  for (size_t index = 0; index < depth; index++) {
    source[position++] = '/';
    source[position++] = '*';
  }
  source[position++] = 'x';
  for (size_t index = 0; index < depth; index++) {
    source[position++] = '*';
    source[position++] = '/';
  }
  source[position] = '\0';
  assert(position == length);
  return source;
}

static char *long_dollar_string(size_t tag_length, size_t body_length) {
  size_t length = (tag_length + 2) * 2 + body_length;
  char *source = malloc(length + 1);
  assert(source != NULL);
  size_t position = 0;
  for (int delimiter = 0; delimiter < 2; delimiter++) {
    source[position++] = '$';
    source[position++] = '_';
    memset(source + position, 't', tag_length - 1);
    position += tag_length - 1;
    source[position++] = '$';
    if (delimiter == 0) {
      memset(source + position, 'x', body_length);
      position += body_length;
    }
  }
  source[position] = '\0';
  assert(position == length);
  return source;
}

int main(void) {
  void *payload = tree_sitter_avenger_external_scanner_create();
  char serialization[TREE_SITTER_SERIALIZATION_BUFFER_SIZE] = {0};
  assert(payload == NULL);
  assert(tree_sitter_avenger_external_scanner_serialize(
             payload, serialization) == 0);
  for (unsigned length = 0; length <= TREE_SITTER_SERIALIZATION_BUFFER_SIZE;
       length++) {
    tree_sitter_avenger_external_scanner_deserialize(payload, serialization,
                                                         length);
    assert(tree_sitter_avenger_external_scanner_serialize(
               payload, serialization) == 0);
  }

  expect_scan("-", LINE_COMMENT, false);
  expect_scan("--", LINE_COMMENT, false);
  expect_scan("-- ", LINE_COMMENT, true);
  expect_scan("-- comment\n", LINE_COMMENT, true);
  expect_scan("--\xc2\xa0" "comment\n", LINE_COMMENT, true);
  expect_scan("-- comment\r\n", LINE_COMMENT, true);
  expect_scan("--\rcomment", LINE_COMMENT, true);
  expect_scan("--comment", LINE_COMMENT, false);
  expect_scan("/", BLOCK_COMMENT, false);
  expect_scan("/*", BLOCK_COMMENT, false);
  expect_scan("/**", BLOCK_COMMENT, false);
  expect_scan("/**/", BLOCK_COMMENT, true);
  expect_scan("/* outer /* inner */ outer */", BLOCK_COMMENT, true);
  expect_scan("/* unterminated", BLOCK_COMMENT, false);
  expect_scan("$", DOLLAR_QUOTED_STRING, false);
  expect_scan("$$", DOLLAR_QUOTED_STRING, false);
  expect_scan("$$x", DOLLAR_QUOTED_STRING, false);
  expect_scan("$$raw$$", DOLLAR_QUOTED_STRING, true);
  expect_scan("$t", DOLLAR_QUOTED_STRING, false);
  expect_scan("$t$", DOLLAR_QUOTED_STRING, false);
  expect_scan("$t$x", DOLLAR_QUOTED_STRING, false);
  expect_scan("$t$x$", DOLLAR_QUOTED_STRING, false);
  expect_scan("$t$x$t", DOLLAR_QUOTED_STRING, false);
  expect_scan("$tag$raw$tag$", DOLLAR_QUOTED_STRING, true);
  expect_scan("$tag$raw$other$", DOLLAR_QUOTED_STRING, false);
  expect_scan("$caf\xc3\xa9$raw$caf\xc3\xa9$", DOLLAR_QUOTED_STRING, false);

  char *nested = nested_comment(100000);
  expect_scan(nested, BLOCK_COMMENT, true);
  free(nested);

  char *dollar = long_dollar_string(100000, 1000000);
  expect_scan(dollar, DOLLAR_QUOTED_STRING, true);
  free(dollar);

  tree_sitter_avenger_external_scanner_destroy(payload);
  return 0;
}
