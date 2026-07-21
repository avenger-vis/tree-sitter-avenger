import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const target = resolve(root, "target");
mkdirSync(target, { recursive: true });
const executable = resolve(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tree-sitter.cmd" : "tree-sitter",
);
const result = spawnSync(executable, [
  "build",
  "--wasm",
  "--output",
  resolve(target, "tree-sitter-avenger.wasm"),
], {
  cwd: root,
  encoding: "utf8",
  shell: process.platform === "win32",
});
if (result.status !== 0) {
  process.stderr.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? result.error?.message ?? "");
  process.exit(result.status ?? 1);
}
