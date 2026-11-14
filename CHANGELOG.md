# Changelog

## [Unreleased]

## [1.1.1] - 2026-11-14

### Added

- Registry card icon and labeled interface previews for the authentication picker and API key file settings.
- Reproducible browser capture with demo host data, including checks for switching both ways and saving the configured path.


## [1.1.0] - 2026-11-13

### Added

- Switch existing Claude conversations between regular login and an API key from the session composer or workspace header.
- Remember the authentication choice separately for each session.
- Configure the API key file in the plugin settings, with `~/.secrets/paseo-claudeapi` as the default and support for absolute paths and `~/`.
- Reject switches during running turns and restore the previous selection if reopening the agent fails.
- Installation instructions, a registry overview, MIT license, and automated checks.
- Tag-driven GitHub releases with changelog notes, a source archive, checksum, and provenance attestation.

[Unreleased]: https://github.com/ywy50/paseo-claude-auth-switch/compare/v1.1.1...HEAD
[1.1.0]: https://github.com/ywy50/paseo-claude-auth-switch/releases/tag/v1.1.0

[1.1.1]: https://github.com/ywy50/paseo-claude-auth-switch/compare/v1.1.0...v1.1.1
