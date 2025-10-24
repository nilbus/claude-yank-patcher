#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the CLI file
const cliPath = path.join(__dirname, 'node_modules/@anthropic-ai/claude-code/cli.js');
const content = fs.readFileSync(cliPath, 'utf8');

console.log('Looking for stdin.on("data", ...) handlers...\n');

// Find all stdin.on('data', ...) patterns
const dataHandlerPattern = /\.stdin\.on\s*\(\s*['"`]data['"`]\s*,\s*([^}]+})/gi;
let match;
let handlerCount = 0;

while ((match = dataHandlerPattern.exec(content)) !== null) {
  handlerCount++;
  const handler = match[1];
  const startIndex = match.index;
  const endIndex = startIndex + match[0].length + 500; // Get some context after

  console.log(`Handler ${handlerCount}:`);
  console.log(`Position: ${startIndex}`);
  console.log(`Handler start: ${handler.substring(0, 200)}...`);

  // Look for control character handling in this handler
  const controlCharPattern = /\\x[0-9a-fA-F]{2}|String\.fromCharCode\([^)]+\)|0x[0-9a-fA-F]+/g;
  const controlChars = handler.match(controlCharPattern);
  if (controlChars) {
    console.log(`Control characters found: ${controlChars.slice(0, 5).join(', ')}`);
  }

  // Look for switch/case statements
  const switchPattern = /switch\s*\([^)]+\)[^}]*{[^}]*}/gi;
  const switches = handler.match(switchPattern);
  if (switches) {
    console.log(`Switch statements found: ${switches.length}`);
  }

  // Look for if statements checking character codes
  const charCodePattern = /if\s*\([^)]*\x[0-9a-fA-F]{2}[^)]*\)/gi;
  const charChecks = handler.match(charCodePattern);
  if (charChecks) {
    console.log(`Character code checks found: ${charChecks.length}`);
  }

  console.log('---');
}

console.log(`\nTotal data handlers found: ${handlerCount}`);

// Also look for any existing control character handling
console.log('\nLooking for any existing control character handling patterns...');

const existingPatterns = [
  { name: 'Ctrl+C handling', pattern: /\x03|\\x03/gi },
  { name: 'Ctrl+D handling', pattern: /\x04|\\x04/gi },
  { name: 'Escape handling', pattern: /\x1b|\\x1b/gi },
  { name: 'Enter handling', pattern: /\x0d|\\x0d|\\r/gi },
  { name: 'Backspace handling', pattern: /\x08|\\x08|\\x7f/gi },
  { name: 'Tab handling', pattern: /\x09|\\x09/gi }
];

existingPatterns.forEach(({ name, pattern }) => {
  const matches = content.match(pattern);
  console.log(`${name}: ${matches ? matches.length : 0} matches`);
  if (matches && matches.length > 0) {
    // Show context around first match
    const firstMatch = matches[0];
    const index = content.indexOf(firstMatch);
    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + 100);
    const context = content.substring(start, end);
    console.log(`  Context: ...${context}...`);
  }
});