#!/usr/bin/env node

/**
 * Apply the kill-ring aware prompt patch to a sandboxed CLI.
 *
 * Usage:
 *   node tools/apply_killring_patch.js --sandbox path/to/sandbox
 *
 * The sandbox directory must contain node_modules/@anthropic-ai/claude-code/cli.js.
 * The script produces:
 *   - cli.pretty.js : readable copy of the CLI for inspection
 *   - cli.js.patched : patched (readable) copy
 *   - cli.js.backup : original CLI backup (created once)
 *   - cli.js        : overwritten with the patched version
 *
 * The script attempts different replacement sets:
 *   1. A stored set for the target version (if present under patches/<version>/replacements.json)
 *   2. Stored sets from the closest known versions (highest similarity)
 *   3. The built-in default replacements
 *
 * When a replacement set succeeds, it writes killring_patch_state.json to help the installer
 * archive the patch artefacts.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const patchesRoot = path.join(repoRoot, 'patches');
const templateRoot = path.join(patchesRoot, '_templates', 'killring');
const templateCache = new Map();

function printUsage() {
  console.log(`Usage: node tools/apply_killring_patch.js --sandbox <path>`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let sandbox = null;
  while (args.length > 0) {
    const token = args.shift();
    switch (token) {
      case '--sandbox':
        sandbox = args.shift();
        if (!sandbox) throw new Error('Missing value for --sandbox');
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }
  if (!sandbox) throw new Error('Sandbox path required (--sandbox <path>)');
  return path.resolve(sandbox);
}

function run(command, options = {}) {
  execSync(command, {
    stdio: 'inherit',
    ...options
  });
}

function main() {
  const sandboxDir = parseArgs(process.argv);
  const cliPath = path.join(sandboxDir, 'node_modules/@anthropic-ai/claude-code/cli.js');
  if (!fs.existsSync(cliPath)) {
    throw new Error(`CLI not found at ${cliPath}. Did you install the package?`);
  }

  const prettyPath = path.join(sandboxDir, 'cli.pretty.js');
  const patchedPath = path.join(sandboxDir, 'node_modules/@anthropic-ai/claude-code/cli.js.patched');
  const backupPath = path.join(sandboxDir, 'node_modules/@anthropic-ai/claude-code/cli.js.backup');

  run(`npx uglify-js "${cliPath}" -b -o "${prettyPath}"`);

  const originalPretty = fs.readFileSync(prettyPath, 'utf8');
  const targetVersion = readInstalledVersion(sandboxDir);

  let appliedPretty = null;
  let replacementsUsed = null;
  let replacementsSource = null;

  const candidateReplacementSets = buildCandidateReplacementSets(targetVersion, patchesRoot);
  for (const candidate of candidateReplacementSets) {
    try {
      appliedPretty = applyReplacements(originalPretty, candidate.replacements);
      replacementsUsed = candidate.replacements;
      replacementsSource = candidate.label;
      break;
    } catch (error) {
      console.log(`⚠️  ${error.message} (candidate ${candidate.label})`);
      appliedPretty = null;
    }
  }

  if (!appliedPretty) {
    throw new Error('Failed to apply kill-ring patch with any known replacement set');
  }

  fs.writeFileSync(prettyPath, appliedPretty);

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(cliPath, backupPath);
  }

  fs.copyFileSync(prettyPath, patchedPath);
  fs.copyFileSync(patchedPath, cliPath);

  const statePath = path.join(sandboxDir, 'killring_patch_state.json');
  const patchState = {
    version: targetVersion,
    replacementsSource,
    replacements: replacementsUsed
  };
  fs.writeFileSync(statePath, JSON.stringify(patchState, null, 2));
  console.log(`🛠 Using replacements: ${replacementsSource}`);
  console.log('✅ Kill ring patch ready');
}

try {
  main();
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}

function readInstalledVersion(sandboxDir) {
  const pkgPath = path.join(sandboxDir, 'node_modules/@anthropic-ai/claude-code/package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
}

function loadTemplate(name) {
  const cached = templateCache.get(name);
  if (cached) {
    return JSON.parse(JSON.stringify(cached));
  }
  const templatePath = path.join(templateRoot, `${name}.json`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found for "${name}" at ${templatePath}`);
  }
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  templateCache.set(name, template);
  return JSON.parse(JSON.stringify(template));
}

function buildCandidateReplacementSets(targetVersion, patchesRoot) {
  const candidates = [];
  const targetPath = path.join(patchesRoot, targetVersion, 'replacements.json');
  if (fs.existsSync(targetPath)) {
    candidates.push({
      label: targetVersion,
      replacements: JSON.parse(fs.readFileSync(targetPath, 'utf8'))
    });
  } else {
    const availableVersions = listPatchVersions(patchesRoot);
    const sorted = availableVersions
      .filter(v => v !== targetVersion)
      .sort((a, b) => semverDistance(a, targetVersion) - semverDistance(b, targetVersion));
    for (const version of sorted) {
      const replacementPath = path.join(patchesRoot, version, 'replacements.json');
      if (fs.existsSync(replacementPath)) {
        candidates.push({
          label: `patch:${version}`,
          replacements: JSON.parse(fs.readFileSync(replacementPath, 'utf8'))
        });
        break;
      }
    }
  }
  return candidates;
}

function listPatchVersions(patchesRoot) {
  if (!fs.existsSync(patchesRoot)) return [];
  return fs.readdirSync(patchesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^\d+\.\d+\.\d+$/.test(entry.name))
    .map(entry => entry.name);
}

function semverDistance(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  const weight = [1_000_000, 1_000, 1];
  const value = arr => arr.reduce((acc, cur, idx) => acc + cur * weight[idx], 0);
  return Math.abs(value(pa) - value(pb));
}

function parseSemver(str) {
  const match = str.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function applyReplacements(source, replacements) {
  let text = source;
  for (const replacement of replacements) {
    if (!text.includes(replacement.search)) {
      throw new Error(`Missing pattern "${replacement.label || replacement.search.slice(0, 30)}"`);
    }
    text = text.replace(replacement.search, replacement.replace);
  }
  return text;
}
