#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the patched CLI file
const cliPath = path.join(__dirname, 'node_modules/@anthropic-ai/claude-code/cli.js');
const content = fs.readFileSync(cliPath, 'utf8');

// Find the handleInput function
const handleInputIndex = content.indexOf('handleInput=');
let pos = handleInputIndex;
let braceCount = 0;
let foundStart = false;
let endPos = pos;

while (pos < content.length) {
  const char = content[pos];
  if (char === '{') {
    if (!foundStart) {
      foundStart = true;
    }
    braceCount++;
  } else if (char === '}') {
    braceCount--;
    if (foundStart && braceCount === 0) {
      endPos = pos + 1;
      break;
    }
  }
  pos++;
}

const handleInputFunction = content.substring(handleInputIndex, endPos);
console.log('Current handleInput function:');
console.log(handleInputFunction);

// Check for the specific key codes
console.log('\nChecking for control character codes:');
const ctrlCodes = ['\\x17', '\\x0b', '\\x15', '\\x19'];
ctrlCodes.forEach(code => {
  const found = handleInputFunction.includes(code);
  console.log(`${code}: ${found ? 'Found ✅' : 'Not found ❌'}`);
});

// Also check the actual characters
console.log('\nChecking for actual control characters:');
const actualChars = ['\x17', '\x0b', '\x15', '\x19'];
actualChars.forEach((char, i) => {
  const found = handleInputFunction.includes(char);
  const names = ['Ctrl+W', 'Ctrl+K', 'Ctrl+U', 'Ctrl+Y'];
  console.log(`${names[i]} (${char.charCodeAt(0).toString(16)}): ${found ? 'Found ✅' : 'Not found ❌'}`);
});