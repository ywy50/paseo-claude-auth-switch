# Paseo Claude Auth Switch

## Quick start

On the machine running your Paseo daemon, clone and prepare the plugin. Private-repository access requires GitHub authentication and collaborator access.

```bash
gh repo clone ywy50/paseo-claude-auth-switch
cd paseo-claude-auth-switch
npm ci
paseo plugin add .
```

Create the key file on that same machine, then paste only your Anthropic API key into it:

```bash
mkdir -p ~/.secrets
touch ~/.secrets/claudeapi
chmod 600 ~/.secrets/claudeapi
nano ~/.secrets/claudeapi
```

Enable plugins in Paseo's host settings if they are disabled. Both the daemon and every desktop or mobile client must support Paseo plugins; use Paseo 0.15.1 or later.

Open an existing **Claude** session. Above its message composer, open **Claude: regular login** and choose **Use API key**. Choose **Use regular login** to switch back. Wait for the current turn to finish before switching. Choose the model through the session's normal model picker.

## What it does

Switches credentials for the same saved Claude conversation, without requiring a new session. Each session remembers its own choice. The workspace header also offers a **Claude login / API** menu.

The plugin reloads only the selected Claude agent. It does not restart the Paseo daemon. It never sends a follow-up prompt automatically.

It targets Paseo's built-in `claude` provider, including existing sessions. It does not switch Codex sessions, create a separate provider, or require a separate authentication page.

## Credentials and state

The key lives at `~/.secrets/claudeapi` on the daemon machine. Remote clients receive controls from that daemon; they do not need a separate plugin installation or a copy of the key.

API mode reads the file at each launch and supplies `ANTHROPIC_API_KEY`, clearing inherited OAuth-token and auth-token environment overrides. Regular mode clears the API-key environment override and uses your existing Claude login. Sessions with no saved selection keep their original environment. A global Claude `apiKeyHelper` or API-key settings can override the intended regular-login behavior; configure those separately.

Only per-session authentication choices are saved in `$PASEO_HOME/claude-auth/modes.json` (normally `~/.paseo/claude-auth/modes.json`). The key is never returned to the client or stored in plugin state. Normal API requests authenticate to Anthropic with the key.

If a reload fails, the previous selection is restored. Reload that agent before continuing. A successful switch means the agent reload completed; API billing and later process startup can still fail independently.

## Sharing

This repository is private. Give collaborators access on GitHub; they can follow the quick start with their own Claude login and API key. Alternatively, share a source archive that excludes `node_modules` and have the recipient run `npm ci` and install the extracted directory.

The source has an MIT license. It includes no personal credentials or session state. You can make the repository public later without changing the plugin code. The stable plugin ID is `claude-auth`, preserving existing installations and state.

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

Tests use a fake key and a temporary home. They cover switching both ways, retaining session identity, persistence, busy-turn rejection, failed-reload rollback, and controls for existing sessions. They do not make model API calls.

After editing an installed directory plugin, reload that plugin:

```bash
paseo plugin reload claude-auth
```
