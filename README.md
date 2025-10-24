# Claude Code Sandbox

Local workspace for experimenting with kill-ring/Emacs keybindings for the closed-source `@anthropic-ai/claude-code` CLI. The modern workflow centres on **versioned sandboxes** so we can patch and validate multiple CLI releases side-by-side.

## Layout

- `claude` -- wrapper that launches a sandbox (`./claude X.Y.Z`)
- `sandboxes/` -- per-version installations created via `tools/patch-claude.js`
- `patches/` -- saved, tested patch metadata per version (auto-populated by `patch-claude`)
- `patch-claude` -- shell wrapper for installing/patching a sandbox
- `tools/patch-claude.js` -- underlying script that installs and patches any `@anthropic-ai/claude-code` release
- `tools/apply_killring_patch.js` -- low-level helper used by `patch-claude.js`
- `tools/analysis/` -- exploratory scripts and reverse-engineering notes

## Usage

```bash
# create a fresh sandbox for a specific version (installs + patches)
./patch-claude 2.0.25

# install the latest version (also patches automatically if it can)
./patch-claude

# (advanced) install without patching
# ./patch-claude --skip-patch

# launch the CLI for a sandbox you installed (omit the version to use the most recent sandbox)
./claude 2.0.25
```

To work inside a sandbox interactively, run `npm --prefix sandboxes/2.0.25 <command>` (swap the version as needed). 

## Maintenance Strategy

- Versioned installs live under `sandboxes/`, so we can diff behaviour across releases without destroying existing work.
- `tools/patch-claude.js` calls `tools/apply_killring_patch.js`, which creates `cli.js.backup`, `cli.js.patched`, and `cli.pretty.js` next to the vendor CLI for easy restoration.
- Once a sandbox is validated, `tools/patch-claude.js` records the patch metadata under `patches/<version>/`; commit these when the patch is known-good. Future installs reuse the closest stored replacements automatically.
- Reverse engineering artefacts remain quarantined in `tools/analysis/` to keep sandboxes clean.

## Next Steps

1. Extend the per-version patch tooling to cover more CLI releases.
2. Strengthen automated verification beyond string matching (e.g., integration tests with a pseudo TTY).
3. Harden the update workflow so we can diff the CLI across releases and flag breakages early.
```
