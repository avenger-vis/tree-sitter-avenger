import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const argument = process.argv.indexOf("--sql-root");
if (argument < 0 || !process.argv[argument + 1]) {
  throw new Error("usage: node scripts/sync_sql_base.mjs --sql-root PATH [--check]");
}
const sqlRoot = resolve(process.argv[argument + 1]);
const revision = execFileSync("git", ["-C", sqlRoot, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const pinned = "9ed9a6d5badfd34ec03e69c8cc5b3ec67c9d1553";
if (revision !== pinned) {
  throw new Error(`SQL checkout is ${revision}; expected pinned ${pinned}`);
}

const scanner = readFileSync(resolve(sqlRoot, "src/scanner.c"));
const highlights = readFileSync(resolve(sqlRoot, "queries/highlights.scm"));
const structuralHighlights = readFileSync(
  resolve(root, "composition-smoke/queries/structural-highlights.scm"),
);
const combinedHighlights = Buffer.concat([
  highlights,
  Buffer.from("\n; Derived composition-smoke captures.\n"),
  structuralHighlights,
]);
const metadata = Buffer.from(`${JSON.stringify({
  source_repository: "https://github.com/avenger-vis/tree-sitter-avenger-sql",
  source_revision: revision,
  scanner_sha256: createHash("sha256").update(scanner).digest("hex"),
  highlights_sha256: createHash("sha256").update(highlights).digest("hex"),
}, null, 2)}\n`);

const outputs = [
  ["composition-smoke/vendor/avenger_sql_scanner.c", scanner],
  ["composition-smoke/queries/highlights.scm", combinedHighlights],
  ["composition-smoke/vendor/sync.json", metadata],
];
for (const [relative, expected] of outputs) {
  const destination = resolve(root, relative);
  mkdirSync(resolve(destination, ".."), { recursive: true });
  if (process.argv.includes("--check")) {
    const actual = readFileSync(destination);
    if (!actual.equals(expected)) {
      throw new Error(`${relative} is stale`);
    }
  } else {
    writeFileSync(destination, expected);
  }
}
