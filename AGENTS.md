# Project Notes

**Goal:** maintain per-version sandboxes of `@anthropic-ai/claude-code` with the custom kill-ring/Emacs keybindings (Ctrl+W/K/U/Y) and capture known-working patches for each release.

## Current Status

- ✅ Kill-ring behaviour works by modifying the prompt helper inside the vendor CLI (see `tools/apply_killring_patch.js`).
- ✅ `patch-claude` installs a requested version, applies the patch, and stores copies of the patch metadata under `patches/<version>/`.
- ✅ `./claude <version>` launches any sandbox created by the installer; `--sandbox-config` remains a maintainer-only flag.
- ⚠️ When Anthropic changes the prompt helper structure, the patch helper needs to be updated with new replacement strings.

## Workflow for Future Agents

1. **Install & patch a version**
   ```bash
   ./patch-claude --version 2.0.25
   ./claude 2.0.25
   ```
   This creates `sandboxes/2.0.25/`, applies the kill-ring patch, and records artefacts in `patches/2.0.25/`.

2. **What to do when the patch no longer applies**
   - The helper already tries replacement sets from the closest patched versions plus a default template. If you still see repeated "Missing pattern ..." messages, format the new CLI and inspect the prompt helper (search for `function uc1` or equivalent).
   - Update or add the relevant replacement entries in `tools/apply_killring_patch.js` so the script can recognise the new structure, then re-run the installer.

3. **Testing the patched sandbox**
   - Launch via `./claude X.Y.Z` and exercise the keybindings (Ctrl+W/K/U/Y).
   - Consider dumping the prompt state directly (if the CLI exposes it) to confirm the kill ring persists.

4. **Archiving the working patch**
   - Confirm `patches/<version>/` contains the updated `replacements.json` and `metadata.json`.
   - Commit those files together with the updated patch helper so the version is reproducible.

5. **Legacy flow**
   - The legacy `claude-sandbox/` tree is kept only for quick experiments; the preferred path is `./patch-claude`.

## Reference One-Liners

```bash
# install + patch latest version
./patch-claude

# install only (no patch)
./patch-claude --skip-patch

# launch a sandbox
./claude 2.0.25

# format the vendor CLI for investigation
npx uglify-js sandboxes/2.0.25/node_modules/@anthropic-ai/claude-code/cli.js -b -o sandboxes/2.0.25/cli.pretty.js
```
