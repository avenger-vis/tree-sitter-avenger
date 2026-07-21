import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const executable = process.env.TREE_SITTER ?? resolve(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tree-sitter.cmd" : "tree-sitter",
);
const manifest = JSON.parse(readFileSync(
  resolve(root, "test/fixtures/avenger-fixtures.json"),
));
const valid = new Set([
  "strict_valid",
  "canonical_valid",
  "example_valid",
  "stdlib_valid",
]);
const paths = manifest.sources
  .filter(source => valid.has(source.classification))
  .map(source => resolve(root, "test/fixtures/compiler/sources", source.path));
const args = ["parse", "--quiet"];
if (process.argv.includes("--wasm")) args.push("--wasm");
args.push(...paths);
const result = spawnSync(executable, args, {
  cwd: root,
  encoding: "utf8",
  shell: process.platform === "win32",
  maxBuffer: 16 * 1024 * 1024,
});
if (result.status !== 0) {
  throw new Error(
    `compiler-valid fixture parse failed (${result.status}):\n${result.stdout}\n${result.stderr}`,
  );
}
if (paths.length !== 93) {
  throw new Error(`expected 93 compiler-valid sources, found ${paths.length}`);
}
