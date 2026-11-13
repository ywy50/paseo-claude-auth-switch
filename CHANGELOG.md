# Changelog

## [Unreleased]

## [1.1.0] - 2026-11-13

### Added

- Switch existing Claude conversations between regular login and an API key from the session composer or workspace header.
- Remember the authentication choice separately for each session.
- Configure the API key file in the plugin settings, with `~/.secrets/paseo-claudeapi` as the default and support for absolute paths and `~/`.
- Reject switches during running turns and restore the previous selection if reopening the agent fails.
- Installation instructions, a registry overview, MIT license, and automated checks.
- Tag-driven GitHub releases with changelog notes, a source archive, checksum, and provenance attestation.

[Unreleased]: https://github.com/ywy50/paseo-claude-auth-switch/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/ywy50/paseo-claude-auth-switch/releases/tag/v1.1.0
