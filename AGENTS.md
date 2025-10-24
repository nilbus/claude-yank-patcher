# Claude Yank Patcher – Agent Guide

**Purpose:** keep `@anthropic-ai/claude-code` sandboxes patched with Emacs kill-ring behaviour (`Ctrl+W/K/U` write to a kill ring, `Ctrl+Y` yanks) and archive the exact replacements that worked for each release.

## What you should always know

- `./patch-claude --version <semver>` installs that CLI version, applies replacements, and snapshots the metadata into `patches/<version>/`.
- `./claude <version>` launches the matching sandbox; the `claude` script simply finds the sandbox and runs its vendor CLI.
- Sandboxes live under `sandboxes/<version>/` and are **never** committed. The repo only tracks metadata and tooling.

## Standard workflow

1. Install & patch: `./patch-claude --version X.Y.Z` (omit the flag to grab the latest from npm).
2. Verify the keybindings inside the sandbox: `./claude X.Y.Z`, then exercise `Ctrl+W/K/U/Y`.
3. Commit the generated `patches/X.Y.Z/` folder plus any updates in `tools/apply_killring_patch.js`.

## If the patch stops applying

- The installer already tries the target version, the nearest recorded version, then the template fallback. Repeated `Missing pattern` messages mean the vendor prompt changed—when that happens:
  - Ask Claude Code, Codex, or another assistant to diff the bundle and suggest new replacements.
  - Once the replacements succeed, record them under `patches/<version>/`, rerun the installer, and commit the artefacts.
  - A direct prompt like `run ./patch-claude latest and build an updated patch` usually kicks off the workflow.
- Reformat the vendor CLI for inspection:
  ```bash
  npx uglify-js sandboxes/X.Y.Z/node_modules/@anthropic-ai/claude-code/cli.js -b -o sandboxes/X.Y.Z/cli.pretty.js
  ```
- Update or add the replacement entries (usually in `patches/X.Y.Z/replacements.json`; fall back to the templates under `patches/_templates/killring/` when starting fresh).
- Re-run the installer until it reports `✅ Kill ring patch ready`.

## Testing checklist

- Launch via `./claude X.Y.Z` and confirm:
  - `Ctrl+W` deletes the previous word and `Ctrl+Y` re-inserts it.
  - `Ctrl+K` / `Ctrl+U` capture the expected portions of the line.
  - `Meta+D` (Option+D on macOS) still works and populates the kill ring.
- If the CLI exposes a prompt dump, it’s worth validating the kill buffer directly, but keyboard smoke tests are the minimum.

## Archiving & housekeeping

- Ensure `patches/<version>/metadata.json` references the replacements you just validated.
- Keep the helper scripts (`patch-claude.js`, `apply_killring_patch.js`) aligned with any structural discoveries.
- Leave exploratory scripts in `tools/analysis/`; they are ignored by the automated workflow but help future debugging.
