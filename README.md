# Claude Yank Patcher

This repo patches Anthropic's closed-source `@anthropic-ai/claude-code` CLI so it behaves like Emacs in the prompt: `Ctrl+W/K/U/Y` manipulate a kill ring and `Ctrl+Y` yanks the last kill. The tooling keeps every patched release in its own sandbox, making it easy to install, verify, and archive working replacements when Anthropic updates the CLI.

## Why it exists

The stock CLI forgets text removed by the Emacs shortcuts. By injecting a tiny helper into the vendor prompt component we:
- track the last killed text in a sandbox-local `killBufferRef`
- write back the buffer on yank
- keep per-version metadata so future installs reuse known-good replacements

### Updating to new releases

1. Ask Claude Code, Codex, or whichever assistant you use to 
  ```
  run ./patch-claude latest and build an updated patch
  ```
  That single request installs the newest CLI, formats the bundle, and tries the nearest recorded replacement sets.  The LLM will see it fail, and then build an new patch.
2. If the patch lands, sanity-check the sandbox with `./claude <version>` and commit the new `patches/<version>/` artefacts so the release stays reproducible.



## Quick start

```bash
# Install and patch a specific CLI version
./patch-claude 2.0.26

# Launch the patched sandbox
./claude 2.0.26

# Install whatever version npm reports as "latest"
./patch-claude
```

Each run creates `sandboxes/<version>/` with the vendor package plus:
- `cli.js.backup` --- original bundle (first run only)
- `cli.pretty.js` --- formatted source for inspection
- `cli.js` --- patched, kill-ring-aware bundle
- `killring_patch_state.json` --- replacements that succeeded

After a successful patch the script mirrors those replacements into `patches/<version>/`. Commit that folder so the version can be reproduced later.

## When a patch fails

1. Reformat the CLI to see the new structure:
   ```bash
   npx uglify-js sandboxes/<version>/node_modules/@anthropic-ai/claude-code/cli.js -b -o sandboxes/<version>/cli.pretty.js
   ```
2. Open `cli.pretty.js`, locate the prompt helper (search for the control-key map), and update or add the replacement entries in `patches/<version>/replacements.json` (or the fallback templates under `patches/_templates/killring/`).
3. Rerun `./patch-claude --version <version>` until it reports `✅ Kill ring patch ready`.

## Repo layout

- `patch-claude` / `tools/patch-claude.js` -- installer + patch orchestrator
- `tools/apply_killring_patch.js` -- applies replacement sets and records metadata
- `patches/<version>/` -- checked-in replacements known to work for that release
- `patches/_templates/` -- defaults the helper falls back to when no exact match exists
- `claude` -- helper that launches a patched sandbox (`./claude 2.0.26`)
- `tools/analysis/` -- one-off scripts for diffing and spelunking the vendor bundle

## Maintenance checklist

- Keep `patch-claude` and `apply_killring_patch.js` in sync with the latest prompt structure.
- Commit the generated `patches/<version>/` folder whenever a new release is verified.
- Use `./claude <version>` to sanity-check `Ctrl+W/K/U/Y` before archiving the patch.
- Avoid committing the sandboxes themselves---`.gitignore` excludes them by default.

Questions, bugs, or a new CLI shape? Update the replacements, rerun the installer, and capture the new patch state so the next upgrade is painless.
