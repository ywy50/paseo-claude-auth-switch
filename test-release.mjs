import { test } from "node:test";
import assert from "node:assert/strict";
import { releaseNotes } from "./tools/release.mjs";
const pkg = { version: "1.1.0" };
const lock = { version: "1.1.0", packages: { "": { version: "1.1.0" } } };
const changelog = "# Changelog\n\n## [Unreleased]\n\nFuture work.\n\n## [1.1.0] - 2026-11-13\n\n### Added\n\n- Configurable key file.\n\n## [1.0.0] - 2026-11-09\n\nOlder notes.\n";
test("release notes contain only the tagged version section", () => {
  assert.equal(releaseNotes("v1.1.0", pkg, lock, changelog), "### Added\n\n- Configurable key file.\n");
});
test("release rejects mismatched versions, non-release tags, and missing or empty notes", () => {
  assert.throws(() => releaseNotes("v1.2.0", pkg, lock, changelog), /must match/);
  assert.throws(() => releaseNotes("v1.1.0", pkg, {...lock, packages:{"":{version:"1.0.0"}}}, changelog), /must match/);
  assert.throws(() => releaseNotes("v1.1.0-rc.1", pkg, lock, changelog), /stable/);
  assert.throws(() => releaseNotes("v1.1.0", pkg, lock, "## [Unreleased]\n"), /nonempty/);
  assert.throws(() => releaseNotes("v1.1.0", pkg, lock, "## [1.1.0] - 2026-11-13\n\n## [1.0.0] - earlier\nold"), /nonempty/);
});
