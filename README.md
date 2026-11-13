# Paseo Claude Auth Switch

## Quick start

On the machine running your Paseo daemon, clone and prepare the plugin. 

```bash
gh repo clone ywy50/paseo-claude-auth-switch
cd paseo-claude-auth-switch
npm ci
paseo plugin add .
```

Create the key file on that same machine, then paste only your Anthropic API key into it:

```bash
mkdir -p ~/.secrets
touch ~/.secrets/paseo-claudeapi
chmod 600 ~/.secrets/paseo-claudeapi
nano ~/.secrets/paseo-claudeapi
```

Enable plugins in Paseo's host settings if they are disabled. Both the daemon and every desktop or mobile client must support Paseo plugins; use Paseo 0.15.1 or later.

Open an existing **Claude** session. Above its message composer, open **Claude: regular login** and choose **Use API key**. Choose **Use regular login** to switch back. Wait for the current turn to finish before switching. Choose the model through the session's normal model picker.

## What it does

Switches credentials for the same saved Claude conversation, without requiring a new session. Each session remembers its own choice. The workspace header also offers a **Claude login / API** menu.

The plugin reloads only the selected Claude agent. It does not restart the Paseo daemon. It never sends a follow-up prompt automatically.

It targets Paseo's built-in `claude` provider, including existing sessions. It does not switch Codex sessions, create a separate provider, or require a separate authentication page.

## Configure the key file

Open the plugin’s **Claude Auth Switch** settings page in Paseo. Set **API key file** to an absolute path or a path starting with `~/`, then select **Save path**. The default is `~/.secrets/paseo-claudeapi`.

The path belongs to the daemon machine, even when you edit it from another computer. Settings store only the path, never the key. Changes apply at the next API session launch or authentication switch; already running sessions keep their current credentials until reopened. No daemon restart is needed.

Relative and empty paths are rejected. The file must exist and contain one nonempty line. Changing the path does not copy, create, or move a secret file.

## Credentials and state

By default, the key lives at `~/.secrets/paseo-claudeapi` on the daemon machine. Remote clients receive controls from that daemon; they do not need a separate plugin installation or a copy of the key.

API mode reads the file at each launch and supplies `ANTHROPIC_API_KEY`, clearing inherited OAuth-token and auth-token environment overrides. Regular mode clears the API-key environment override and uses your existing Claude login. Sessions with no saved selection keep their original environment. A global Claude `apiKeyHelper` or API-key settings can override the intended regular-login behavior; configure those separately.

Only per-session authentication choices are saved in `$PASEO_HOME/claude-auth/modes.json` (normally `~/.paseo/claude-auth/modes.json`). The key is never returned to the client or stored in plugin state. Normal API requests authenticate to Anthropic with the key.

If a reload fails, the previous selection is restored. Reload that agent before continuing. A successful switch means the agent reload completed; API billing and later process startup can still fail independently.

## Releases and sharing

Install the latest Git source directly:

```bash
paseo plugin add git:ywy50/paseo-claude-auth-switch
```

To install a particular release, select its tag:

```bash
paseo plugin add git:ywy50/paseo-claude-auth-switch --ref v1.1.0
```

[GitHub releases](https://github.com/ywy50/paseo-claude-auth-switch/releases) include the version's changelog notes, a source archive, its SHA-256 checksum, and a provenance attestation. The plugin is platform-independent; there are no separate operating-system builds. See [CHANGELOG.md](CHANGELOG.md) for changes and [docs/releasing.md](docs/releasing.md) for the release procedure.

The source has an MIT license and includes no personal credentials or session state. Recipients use their own Claude login and API key. The stable plugin ID is `claude-auth`, preserving existing installations and state.

The Paseo registry reviews a pinned commit. Publishing a GitHub release does not automatically update an approved registry listing.

## Development

Install dependencies:

```bash
npm ci
```

Check types and run tests:

```bash
npm run typecheck
npm test
```

Tests use a fake key and a temporary home. They cover switching both ways, retaining session identity, persistence, busy-turn rejection, failed-reload rollback, controls for existing sessions, default and custom key paths, key rotation, and missing files. They do not make model API calls.

After editing an installed directory plugin, reload that plugin:

```bash
paseo plugin reload claude-auth
```
