import { readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const parserPath = resolve(root, "src/parser.c");
const parser = readFileSync(parserPath, "utf8");
const define = name => {
  const match = parser.match(new RegExp(`^#define ${name} (\\d+)$`, "m"));
  if (!match) throw new Error(`missing ${name} in src/parser.c`);
  return Number(match[1]);
};
const metrics = {
  grammar: "avenger",
  tree_sitter_cli: "0.26.3",
  abi_version: define("LANGUAGE_VERSION"),
  state_count: define("STATE_COUNT"),
  large_state_count: define("LARGE_STATE_COUNT"),
  symbol_count: define("SYMBOL_COUNT"),
  token_count: define("TOKEN_COUNT"),
  field_count: define("FIELD_COUNT"),
  parser_bytes: statSync(parserPath).size,
  grammar_json_bytes: statSync(resolve(root, "src/grammar.json")).size,
  node_types_bytes: statSync(resolve(root, "src/node-types.json")).size,
};
const output = `${JSON.stringify(metrics, null, 2)}\n`;
const recordPath = resolve(root, "test/metrics/current.json");

if (process.argv.includes("--write")) {
  writeFileSync(recordPath, output);
} else if (process.argv.includes("--check")) {
  if (readFileSync(recordPath, "utf8") !== output) {
    process.stderr.write("parser metrics differ; review and run npm run measure -- --write\n");
    process.exit(1);
  }
} else {
  process.stdout.write(output);
}
