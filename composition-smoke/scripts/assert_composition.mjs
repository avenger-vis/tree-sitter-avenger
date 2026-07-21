import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const executable = resolve(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tree-sitter.cmd" : "tree-sitter",
);
const run = args => spawnSync(executable, args, {
  cwd: root,
  encoding: "utf8",
  shell: process.platform === "win32",
});

const valid = run(["parse", "--quiet", "test/fixtures/contexts.avenger-composition"]);
if (valid.status !== 0) {
  throw new Error(`valid composition fixture failed:\n${valid.stdout}\n${valid.stderr}`);
}

const captures = run([
  "query",
  "--captures",
  "queries/highlights.scm",
  "test/fixtures/contexts.avenger-composition",
]);
if (captures.status !== 0) {
  throw new Error(`combined highlight query failed:\n${captures.stdout}\n${captures.stderr}`);
}
for (const expected of [
  "capture: 0 - keyword, start: (0, 0), end: (0, 3), text: `sql`",
  "capture: 0 - keyword, start: (0, 5), end: (0, 9), text: `FROM`",
  "capture: 8 - type, start: (0, 10), end: (0, 14), text: `vega`",
  "capture: 11 - variable.special",
  "capture: 13 - attribute",
  "capture: 7 - function",
  "capture: 3 - string",
  "capture: 14 - operator",
  "capture: 12 - property",
]) {
  if (!captures.stdout.includes(expected)) {
    throw new Error(`combined captures missing ${expected}`);
  }
}

const recovery = run([
  "parse",
  "--no-ranges",
  "test/fixtures/recovery-string.avenger-composition",
]);
if (recovery.status !== 1) {
  throw new Error(`expected recovery parse status 1, got ${recovery.status}`);
}
const siblings = recovery.stdout.match(/\(sql_terminated_expression/g) ?? [];
if (siblings.length !== 2 || !recovery.stdout.includes("(literal\n      (number))")) {
  throw new Error(`unterminated string lost its following sibling:\n${recovery.stdout}`);
}

const structuralRecovery = run([
  "parse",
  "--no-ranges",
  "test/fixtures/recovery.avenger-composition",
]);
if (structuralRecovery.status !== 1) {
  throw new Error(`expected structural recovery status 1, got ${structuralRecovery.status}`);
}
for (const expected of [
  "(sql_query",
  "alias: (relation_alias",
  "(sql_property_expression",
  "temporal: (temporal_qualifier)",
]) {
  if (!structuralRecovery.stdout.includes(expected)) {
    throw new Error(`structural recovery lost ${expected}:\n${structuralRecovery.stdout}`);
  }
}
if ((structuralRecovery.stdout.match(/\(sql_terminated_expression/g) ?? []).length !== 2) {
  throw new Error(`incomplete call lost a following output:\n${structuralRecovery.stdout}`);
}
