#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the CLI file
const cliPath = path.join(__dirname, 'node_modules/@anthropic-ai/claude-code/cli.js');
const content = fs.readFileSync(cliPath, 'utf8');

console.log('Looking for focus key definitions...\n');

// Find the definitions of lR9 and iR9
const lR9Pattern = /lR9\s*=\s*[^,;}]*/g;
const iR9Pattern = /iR9\s*=\s*[^,;}]*/g;

const lR9Matches = content.match(lR9Pattern);
const iR9Matches = content.match(iR9Pattern);

console.log('lR9 definitions:');
if (lR9Matches) {
  lR9Matches.slice(0, 3).forEach((match, i) => {
    console.log(`  ${i + 1}: ${match}`);
  });
}

console.log('\niR9 definitions:');
if (iR9Matches) {
  iR9Matches.slice(0, 3).forEach((match, i) => {
    console.log(`  ${i + 1}: ${match}`);
  });
}

// Also look for common control key patterns
console.log('\nLooking for common control key patterns...');
const controlKeys = [
  { name: 'Tab', pattern: /\\x09|\\t/gi },
  { name: 'Enter', pattern: /\\x0d|\\r/gi },
  { name: 'Backspace', pattern: /\\x08|\\x7f/gi },
  { name: 'Delete', pattern: /\\x1b\\x5b5~|\\x1b\\x5b3~/gi },
  { name: 'Arrow keys', pattern: /\\x1b\\x5b[ABCD]/gi },
  { name: 'Ctrl+W', pattern: /\\x17/gi },
  { name: 'Ctrl+K', pattern: /\\x0b/gi },
  { name: 'Ctrl+U', pattern: /\\x15/gi },
  { name: 'Ctrl+Y', pattern: /\\x19/gi }
];

controlKeys.forEach(({ name, pattern }) => {
  const matches = content.match(pattern);
  console.log(`${name}: ${matches ? matches.length : 0} matches`);
});

// Let's also search for where text editing happens
console.log('\nLooking for text editing functions...');
const editFunctions = [
  'delete', 'backspace', 'insert', 'replace', 'slice', 'substring'
];

editFunctions.forEach(func => {
  const regex = new RegExp(`\\b${func}\\s*\\(`, 'gi');
  const matches = content.match(regex);
  if (matches && matches.length > 0 && matches.length < 20) {
    console.log(`${func}(): ${matches.length} matches`);
  }
});