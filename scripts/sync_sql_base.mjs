import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SQL_KEYWORDS } from "../grammar/helpers.js";

const root = resolve(import.meta.dirname, "..");
const argument = process.argv.indexOf("--sql-root");
if (argument < 0 || !process.argv[argument + 1]) {
  throw new Error("usage: node scripts/sync_sql_base.mjs --sql-root PATH [--check]");
}
const sqlRoot = resolve(process.argv[argument + 1]);
const revision = execFileSync("git", ["-C", sqlRoot, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const pinned = "eb90082c73ada5aa8ef0f66ed73b1444ce4501db";
if (revision !== pinned) {
  throw new Error(`SQL checkout is ${revision}; expected pinned ${pinned}`);
}

const scanner = readFileSync(resolve(sqlRoot, "src/scanner.c"));
const highlights = readFileSync(resolve(sqlRoot, "queries/highlights.scm"));
const keywordSource = readFileSync(resolve(sqlRoot, "grammar/keywords.js"), "utf8");
const keywordArray = keywordSource.match(/const KEYWORDS = \[([\s\S]*?)\];/);
if (!keywordArray) throw new Error("cannot read SQL base keyword inventory");
const baseKeywords = [...keywordArray[1].matchAll(/"([^"]+)"/g)].map(match => match[1]);
if (JSON.stringify(baseKeywords) !== JSON.stringify(SQL_KEYWORDS)) {
  throw new Error("grammar/helpers.js SQL_KEYWORDS is stale relative to SQL base");
}
const scannerHarnessSource = readFileSync(resolve(sqlRoot, "tests/scanner_harness.c"), "utf8");
const scannerHarness = Buffer.from(scannerHarnessSource.replaceAll(
  "tree_sitter_avenger_sql_external_scanner_",
  "tree_sitter_avenger_external_scanner_",
));
const structuralHighlights = readFileSync(resolve(root, "queries/structural-highlights.scm"));
const combinedHighlights = Buffer.concat([
  highlights,
  Buffer.from("\n; Combined Avenger structural captures.\n"),
  structuralHighlights,
]);
const metadata = Buffer.from(`${JSON.stringify({
  schema_version: 1,
  source_repository: "https://github.com/avenger-vis/tree-sitter-avenger-sql",
  source_revision: revision,
  package: "@avenger-vis/tree-sitter-avenger-sql@0.1.0",
  scanner_sha256: createHash("sha256").update(scanner).digest("hex"),
  highlights_sha256: createHash("sha256").update(highlights).digest("hex"),
  keywords_sha256: createHash("sha256").update(keywordSource).digest("hex"),
  scanner_harness_sha256: createHash("sha256").update(scannerHarnessSource).digest("hex"),
}, null, 2)}\n`);

const outputs = [
  ["vendor/avenger_sql_scanner.c", scanner],
  ["queries/sql-highlights.scm", highlights],
  ["queries/highlights.scm", combinedHighlights],
  ["tests/scanner_harness.c", scannerHarness],
  ["vendor/sql-base.json", metadata],
];
for (const [relative, expected] of outputs) {
  const destination = resolve(root, relative);
  mkdirSync(dirname(destination), { recursive: true });
  if (process.argv.includes("--check")) {
    const actual = readFileSync(destination);
    if (!actual.equals(expected)) {
      throw new Error(`${relative} is stale`);
    }
  } else {
    writeFileSync(destination, expected);
  }
}
