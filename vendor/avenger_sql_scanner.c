#include "tree_sitter/parser.h"

#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

enum TokenType {
  LINE_COMMENT,
  BLOCK_COMMENT,
  DOLLAR_QUOTED_STRING,
};

static bool is_avenger_whitespace(int32_t codepoint) {
  return (codepoint >= 0x0009 && codepoint <= 0x000d) || codepoint == 0x0020 ||
         codepoint == 0x0085 || codepoint == 0x00a0 || codepoint == 0x1680 ||
         (codepoint >= 0x2000 && codepoint <= 0x200a) ||
         codepoint == 0x2028 || codepoint == 0x2029 || codepoint == 0x202f ||
         codepoint == 0x205f || codepoint == 0x3000;
}

static bool is_ascii_alpha(int32_t codepoint) {
  return (codepoint >= 'a' && codepoint <= 'z') ||
         (codepoint >= 'A' && codepoint <= 'Z');
}

static bool is_ascii_digit(int32_t codepoint) {
  return codepoint >= '0' && codepoint <= '9';
}

static bool scan_line_comment(TSLexer *lexer) {
  if (lexer->lookahead != '-') return false;
  lexer->advance(lexer, false);
  if (lexer->lookahead != '-') return false;
  lexer->advance(lexer, false);
  if (lexer->eof(lexer) || !is_avenger_whitespace(lexer->lookahead)) {
    return false;
  }

  while (!lexer->eof(lexer)) {
    int32_t codepoint = lexer->lookahead;
    lexer->advance(lexer, false);
    if (codepoint == '\n') break;
  }
  lexer->mark_end(lexer);
  lexer->result_symbol = LINE_COMMENT;
  return true;
}

static bool scan_block_comment(TSLexer *lexer) {
  if (lexer->lookahead != '/') return false;
  lexer->advance(lexer, false);
  if (lexer->lookahead != '*') return false;
  lexer->advance(lexer, false);

  uint32_t depth = 1;
  int32_t previous = 0;
  while (!lexer->eof(lexer)) {
    int32_t current = lexer->lookahead;
    lexer->advance(lexer, false);
    if (previous == '/' && current == '*') {
      if (depth == UINT32_MAX) return false;
      depth++;
      previous = 0;
      continue;
    }
    if (previous == '*' && current == '/') {
      depth--;
      if (depth == 0) {
        lexer->mark_end(lexer);
        lexer->result_symbol = BLOCK_COMMENT;
        return true;
      }
      previous = 0;
      continue;
    }
    previous = current;
  }
  return false;
}

static bool append_byte(char **buffer, size_t *length, size_t *capacity,
                        char byte) {
  if (*length == *capacity) {
    size_t next_capacity = *capacity == 0 ? 16 : *capacity * 2;
    if (next_capacity < *capacity) return false;
    char *next = realloc(*buffer, next_capacity);
    if (next == NULL) return false;
    *buffer = next;
    *capacity = next_capacity;
  }
  (*buffer)[(*length)++] = byte;
  return true;
}

static bool scan_dollar_quoted_string(TSLexer *lexer) {
  if (lexer->lookahead != '$') return false;
  lexer->advance(lexer, false);

  char *tag = NULL;
  size_t tag_length = 0;
  size_t tag_capacity = 0;
  if (lexer->lookahead == '$') {
    lexer->advance(lexer, false);
  } else {
    if (!is_ascii_alpha(lexer->lookahead) && lexer->lookahead != '_') {
      return false;
    }
    while (is_ascii_alpha(lexer->lookahead) ||
           is_ascii_digit(lexer->lookahead) || lexer->lookahead == '_') {
      if (!append_byte(&tag, &tag_length, &tag_capacity,
                       (char)lexer->lookahead)) {
        free(tag);
        return false;
      }
      lexer->advance(lexer, false);
    }
    if (lexer->lookahead != '$') {
      free(tag);
      return false;
    }
    lexer->advance(lexer, false);
  }

  if (tag_length > SIZE_MAX - 2) {
    free(tag);
    return false;
  }
  size_t delimiter_length = tag_length + 2;
  char *delimiter = malloc(delimiter_length);
  size_t *prefix = calloc(delimiter_length, sizeof(size_t));
  if (delimiter == NULL || prefix == NULL) {
    free(tag);
    free(delimiter);
    free(prefix);
    return false;
  }
  delimiter[0] = '$';
  for (size_t index = 0; index < tag_length; index++) {
    delimiter[index + 1] = tag[index];
  }
  delimiter[delimiter_length - 1] = '$';
  free(tag);

  for (size_t index = 1, matched = 0; index < delimiter_length; index++) {
    while (matched > 0 && delimiter[index] != delimiter[matched]) {
      matched = prefix[matched - 1];
    }
    if (delimiter[index] == delimiter[matched]) matched++;
    prefix[index] = matched;
  }

  size_t matched = 0;
  while (!lexer->eof(lexer)) {
    int32_t codepoint = lexer->lookahead;
    lexer->advance(lexer, false);
    while (matched > 0 &&
           (codepoint > 0x7f || (char)codepoint != delimiter[matched])) {
      matched = prefix[matched - 1];
    }
    if (codepoint <= 0x7f && (char)codepoint == delimiter[matched]) matched++;
    if (matched == delimiter_length) {
      free(delimiter);
      free(prefix);
      lexer->mark_end(lexer);
      lexer->result_symbol = DOLLAR_QUOTED_STRING;
      return true;
    }
  }

  free(delimiter);
  free(prefix);
  return false;
}

void *tree_sitter_avenger_sql_external_scanner_create(void) { return NULL; }

void tree_sitter_avenger_sql_external_scanner_destroy(void *payload) {
  (void)payload;
}

unsigned tree_sitter_avenger_sql_external_scanner_serialize(void *payload,
                                                            char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}

void tree_sitter_avenger_sql_external_scanner_deserialize(
    void *payload, const char *buffer, unsigned length) {
  (void)payload;
  (void)buffer;
  (void)length;
}

bool tree_sitter_avenger_sql_external_scanner_scan(
    void *payload, TSLexer *lexer, const bool *valid_symbols) {
  (void)payload;
  while (is_avenger_whitespace(lexer->lookahead)) {
    lexer->advance(lexer, true);
  }
  if (valid_symbols[LINE_COMMENT] && lexer->lookahead == '-') {
    return scan_line_comment(lexer);
  }
  if (valid_symbols[BLOCK_COMMENT] && lexer->lookahead == '/') {
    return scan_block_comment(lexer);
  }
  if (valid_symbols[DOLLAR_QUOTED_STRING] && lexer->lookahead == '$') {
    return scan_dollar_quoted_string(lexer);
  }
  return false;
}
