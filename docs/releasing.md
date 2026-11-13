# Cutting a release

Releases follow the same tag-driven pattern as niimbench. `package.json` is the version source; npm keeps the matching copies in `package-lock.json`. A `vX.Y.Z` tag on a commit contained in `main` runs the release workflow.

1. Choose the next version: patch for fixes, minor for compatible features, major for breaking changes. Update the package and lockfile together without creating a tag yet. This example increments the patch version:

   ```bash
   npm version patch --no-git-tag-version
   ```

2. Move entries from `CHANGELOG.md`'s **Unreleased** section into a dated version section. Leave **Unreleased** in place for future work. Update its compare link. The version section becomes the GitHub release notes.

3. Run the same checks as CI:

   ```bash
   npm run typecheck
   npm test
   ```

4. Commit and push the release changes to `main` using the normal review process, and wait for the Checks workflow to pass.

5. Tag the published main commit. These commands read its version rather than typing it again:

   ```bash
   git fetch origin
   version=$(git show origin/main:package.json | node -e 'let text="";process.stdin.on("data",chunk=>text+=chunk);process.stdin.on("end",()=>console.log(JSON.parse(text).version))')
   git tag -a "v$version" origin/main -m "Claude Auth Switch $version"
   git push origin "v$version"
   ```

6. Watch the release workflow:

   ```bash
   gh run list --workflow release.yml
   ```

The workflow checks main ancestry, matching versions in the package and lockfile, and a nonempty changelog section. It then installs locked dependencies, runs the full checks, archives the exact tagged tree, writes a SHA-256 checksum, attests the archive's provenance, and publishes a GitHub release. There are no platform binaries or npm publication steps.

Download the release's `.tar.gz` and `.sha256` into the same directory. Verify it, replacing the version below with the release you downloaded:

```bash
sha256sum -c paseo-claude-auth-switch-v1.1.0.tar.gz.sha256
```

Extract the archive and install its directory with `paseo plugin add`. Paseo supplies the runtime SDK libraries. `npm ci` is needed when developing or running tests, not for this plugin's Git or archive installation.

GitHub releases and Paseo registry versions are separate. The registry pins the exact reviewed Git commit; a new tag does not automatically update the registry. Submit a registry update referring to the new tag after releasing it.

If a workflow fails transiently before publishing, rerun it. Fix source failures on main and choose a new patch version. Do not move a tag already used by a published release or a registry review.
