#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the CLI file
const cliPath = path.join(__dirname, 'node_modules/@anthropic-ai/claude-code/cli.js');
const content = fs.readFileSync(cliPath, 'utf8');

console.log('Extracting the complete handleInput function...\n');

// Find the start of handleInput function
const handleInputStart = content.indexOf('handleInput=');
if (handleInputStart === -1) {
  console.log('Could not find handleInput function');
  process.exit(1);
}

// Find the end of the function by counting braces
let pos = handleInputStart;
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

const fullFunction = content.substring(handleInputStart, endPos);
console.log('Complete handleInput function:');
console.log(fullFunction);
console.log('\nFunction length:', fullFunction.length);

// Save this for the patch script
fs.writeFileSync(path.join(__dirname, 'handleInput_function.txt'), fullFunction);
console.log('Saved to handleInput_function.txt');