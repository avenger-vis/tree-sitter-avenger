import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const executable = process.env.TREE_SITTER ?? resolve(
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
const result = run([
  "query", "--captures", "queries/highlights.scm",
  "test/fixtures/skeleton.avenger",
]);
if (result.status !== 0) {
  throw new Error(`highlight query failed:\n${result.stdout}\n${result.stderr}`);
}
for (const [capture, text] of [
  ["keyword", "`chart`"],
  ["keyword", "`FROM`"],
  ["type", "`vega`"],
  ["variable.parameter", "`m`"],
  ["property", "`x`"],
  ["variable.special", "`width`"],
  ["attribute", "`@start`"],
  ["function", "`coalesce`"],
  ["constant", "`none`"],
]) {
  if (!result.stdout.split("\n").some(line =>
    line.includes(`- ${capture},`) && line.includes(`text: ${text}`)
  )) {
    throw new Error(`missing expected ${capture} capture for ${text}:\n${result.stdout}`);
  }
}

const recovery = run(["parse", "--no-ranges", "test/fixtures/recovery_sql.avenger"]);
if (recovery.status !== 1) {
  throw new Error(`expected SQL recovery status 1, got ${recovery.status}`);
}
for (const expected of [
  "(sql_query",
  "(relation_alias",
  "(sql_property_expression",
  "(temporal_qualifier)",
]) {
  if (!recovery.stdout.includes(expected)) {
    throw new Error(`SQL recovery lost ${expected}:\n${recovery.stdout}`);
  }
}
if ((recovery.stdout.match(/\(sql_aliased_expression/g) ?? []).length !== 2) {
  throw new Error(`incomplete call lost the following output:\n${recovery.stdout}`);
}

const stringRecovery = run([
  "parse", "--no-ranges", "test/fixtures/recovery_string.avenger",
]);
if (stringRecovery.status !== 1) {
  throw new Error(`expected string recovery status 1, got ${stringRecovery.status}`);
}
if (
  (stringRecovery.stdout.match(/\(sql_property_expression/g) ?? []).length !== 2
  || !stringRecovery.stdout.includes("(literal\n            (number))")
) {
  throw new Error(`unterminated string lost the following output:\n${stringRecovery.stdout}`);
}

const valueRecovery = run([
  "parse", "--no-ranges", "test/fixtures/recovery_values.avenger",
]);
if (valueRecovery.status !== 1) {
  throw new Error(`expected value recovery status 1, got ${valueRecovery.status}`);
}
const valueCaptures = run([
  "query", "--captures", "queries/highlights.scm",
  "test/fixtures/recovery_values.avenger",
]);
for (const property of ["after_call", "after_array", "after_query", "final"]) {
  if (!valueCaptures.stdout.split("\n").some(line =>
    line.includes("- property,") && line.includes(`text: \`${property}\``)
  )) {
    throw new Error(`value recovery lost property ${property}:\n${valueRecovery.stdout}`);
  }
}

const structural = run([
  "query", "--captures", "queries/highlights.scm",
  "test/highlight/surface.avenger",
]);
if (structural.status !== 0) {
  throw new Error(`structural highlight query failed:\n${structural.stdout}\n${structural.stderr}`);
}
for (const [capture, text] of [
  ["keyword", "`public`"],
  ["type", "`custom_mark`"],
  ["type.builtin", "`float64`"],
  ["keyword", "`store`"],
  ["type.builtin", "`group`"],
  ["type.builtin", "`row`"],
  ["property", "`id`"],
  ["variable.parameter", "`x`"],
]) {
  if (!structural.stdout.split("\n").some(line =>
    line.includes(`- ${capture},`) && line.includes(`text: ${text}`)
  )) {
    throw new Error(`missing expected ${capture} capture for ${text}:\n${structural.stdout}`);
  }
}
if (!structural.stdout.split("\n").some(line =>
  line.includes("- comment.doc,")
  && line.includes("text: `-- | A chart-level documentation comment.")
)) {
  throw new Error(`missing documentation comment capture:\n${structural.stdout}`);
}
const plotLines = structural.stdout.split("\n").filter(line =>
  line.includes("text: `plot`")
);
if (!plotLines.some(line => line.includes("- function,"))) {
  throw new Error(`DSL-only keyword did not remain an SQL function name:\n${structural.stdout}`);
}
if (plotLines.some(line => line.includes("- keyword,"))) {
  throw new Error(`SQL function plot was incorrectly captured as a keyword:\n${structural.stdout}`);
}
