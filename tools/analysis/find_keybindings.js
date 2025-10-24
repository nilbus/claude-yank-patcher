#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the CLI file
const cliPath = path.join(__dirname, 'node_modules/@anthropic-ai/claude-code/cli.js');
const content = fs.readFileSync(cliPath, 'utf8');

console.log('File size:', content.length, 'characters');
console.log('Looking for keybinding patterns...\n');

// Search for patterns that might indicate key handling
const patterns = [
  { name: 'process.stdin', pattern: /process\.stdin/g },
  { name: 'stdin.on', pattern: /stdin\.on/g },
  { name: 'raw mode', pattern: /setRawMode/g },
  { name: 'key event', pattern: /key|keydown|keyup/gi },
  { name: 'ctrl+c', pattern: /ctrl.*c|control.*c|\x03/gi },
  { name: 'character codes', pattern: /\\x[0-9a-fA-F]{2}/g },
  { name: 'input handling', pattern: /input|keypress|readline/gi },
  { name: 'terminal', pattern: /terminal|tty/gi }
];

patterns.forEach(({ name, pattern }) => {
  const matches = content.match(pattern);
  console.log(`${name}: ${matches ? matches.length : 0} matches`);
  if (matches && matches.length > 0 && matches.length <= 10) {
    matches.slice(0, 5).forEach((match, i) => {
      const index = content.indexOf(match);
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + match.length + 50);
      const context = content.substring(start, end);
      console.log(`  ${i + 1}: ...${context}...`);
    });
  }
});

// Look for specific control character codes
console.log('\nLooking for specific control character codes:');
const controlCodes = [
  { name: 'Ctrl+W (0x17)', code: '\\x17', char: String.fromCharCode(0x17) },
  { name: 'Ctrl+K (0x0b)', code: '\\x0b', char: String.fromCharCode(0x0b) },
  { name: 'Ctrl+U (0x15)', code: '\\x15', char: String.fromCharCode(0x15) },
  { name: 'Ctrl+Y (0x19)', code: '\\x19', char: String.fromCharCode(0x19) },
  { name: 'Ctrl+C (0x03)', code: '\\x03', char: String.fromCharCode(0x03) }
];

controlCodes.forEach(({ name, code, char }) => {
  const codeCount = (content.match(new RegExp(code.replace(/\\/g, '\\\\'), 'g')) || []).length;
  const charCount = (content.match(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  console.log(`${name}: ${codeCount} code matches, ${charCount} char matches`);
});

// Try to find where key processing might happen
console.log('\nLooking for key processing functions...');
const functionPatterns = [
  /function\s+\w*[^}]*key[^}]*}/gi,
  /\w+\.on\(['"`]data['"`]\s*,\s*function[^}]*}/gi,
  /case\s+['"`]\x['"`][^:}]*:/gi
];

functionPatterns.forEach((pattern, i) => {
  const matches = content.match(pattern);
  console.log(`Function pattern ${i + 1}: ${matches ? matches.length : 0} matches`);
});