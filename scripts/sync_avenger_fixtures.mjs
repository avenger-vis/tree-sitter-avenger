import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const argument = process.argv.indexOf("--avenger-root");
if (argument < 0 || !process.argv[argument + 1]) {
  throw new Error("usage: node scripts/sync_avenger_fixtures.mjs --avenger-root PATH [--check]");
}
const avengerRoot = resolve(process.argv[argument + 1]);
const revision = execFileSync("git", ["-C", avengerRoot, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const pinned = "ebe15482494d911366e7737aacfe3c89fce24ec3";
if (revision !== pinned) {
  throw new Error(`Avenger checkout is ${revision}; expected pinned ${pinned}`);
}

const sourceManifestPath = resolve(
  avengerRoot,
  "avenger-lang-core/tests/fixtures/tree_sitter/structural_sources.json",
);
const sourceManifest = readFileSync(sourceManifestPath);
const parsed = JSON.parse(sourceManifest);
const destinationRoot = resolve(root, "test/fixtures/compiler/sources");
const wrapper = Buffer.from(`${JSON.stringify({
  schema_version: 1,
  source_repository: "https://github.com/avenger-vis/avenger",
  source_revision: revision,
  source_manifest: "avenger-lang-core/tests/fixtures/tree_sitter/structural_sources.json",
  source_manifest_sha256: createHash("sha256").update(sourceManifest).digest("hex"),
  source_count: parsed.sources.length,
  sources: parsed.sources,
}, null, 2)}\n`);

const expected = new Map();
for (const source of parsed.sources) {
  expected.set(source.path, readFileSync(resolve(avengerRoot, source.path)));
}

const walk = directory => {
  if (!statSync(directory, { throwIfNoEntry: false })?.isDirectory()) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [relative(destinationRoot, path)];
  });
};

if (process.argv.includes("--check")) {
  const actualManifest = readFileSync(resolve(root, "test/fixtures/avenger-fixtures.json"));
  if (!actualManifest.equals(wrapper)) throw new Error("avenger-fixtures.json is stale");
  const actualPaths = walk(destinationRoot).sort();
  const expectedPaths = [...expected.keys()].sort();
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error("synchronized compiler fixture path set is stale");
  }
  for (const [path, contents] of expected) {
    if (!readFileSync(resolve(destinationRoot, path)).equals(contents)) {
      throw new Error(`synchronized compiler fixture is stale: ${path}`);
    }
  }
} else {
  rmSync(destinationRoot, { recursive: true, force: true });
  for (const [path, contents] of expected) {
    const destination = resolve(destinationRoot, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, contents);
  }
  mkdirSync(resolve(root, "test/fixtures"), { recursive: true });
  writeFileSync(resolve(root, "test/fixtures/avenger-fixtures.json"), wrapper);
}
