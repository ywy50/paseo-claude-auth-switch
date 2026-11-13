import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function releaseNotes(tag, pkg, lock, changelog) {
  if (!/^v\d+\.\d+\.\d+$/.test(tag)) throw new Error("Use a stable vX.Y.Z tag.");
  const version = tag.slice(1);
  if (pkg.version !== version || lock.version !== version || lock.packages?.[""]?.version !== version)
    throw new Error("Tag, package.json, and package-lock.json versions must match.");
  const sections = changelog.split(/^## /m).slice(1);
  const section = sections.find(part => part.startsWith(`[${version}] - `));
  const notes = section?.slice(section.indexOf("\n") + 1).trim();
  if (!notes) throw new Error(`CHANGELOG.md needs a nonempty ## [${version}] section.`);
  return notes + "\n";
}

async function main() {
  const [tag, output] = process.argv.slice(2);
  if (!tag || !output) throw new Error("Usage: node tools/release.mjs vX.Y.Z output-file");
  const [pkg, lock, changelog] = await Promise.all([
    readFile("package.json", "utf8").then(JSON.parse),
    readFile("package-lock.json", "utf8").then(JSON.parse),
    readFile("CHANGELOG.md", "utf8"),
  ]);
  const notes = releaseNotes(tag, pkg, lock, changelog);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, notes);
  console.log(`Release ${tag}: versions and changelog match.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
