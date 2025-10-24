#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the CLI file
const cliPath = path.join(__dirname, 'node_modules/@anthropic-ai/claude-code/cli.js');
const content = fs.readFileSync(cliPath, 'utf8');

console.log('Looking for handleInput function...\n');

// Find the handleInput function
const handleInputPattern = /handleInput\s*=\s*\([^)]*\)\s*=>\s*{[^}]*}/gi;
const matches = content.match(handleInputPattern);

if (matches && matches.length > 0) {
  console.log(`Found ${matches.length} handleInput function(s):`);
  matches.forEach((match, i) => {
    console.log(`\nFunction ${i + 1}:`);
    console.log(match.substring(0, 500) + '...');
  });
} else {
  console.log('No handleInput function found with that pattern.');
}

// Look for a broader pattern around the context we found
console.log('\nLooking for the specific context around handleInput...');

const contextPattern = /if\(A==="\x03"[^}]*}/gi;
const ctrlCHandlers = content.match(contextPattern);

if (ctrlCHandlers && ctrlCHandlers.length > 0) {
  console.log(`Found ${ctrlCHandlers.length} Ctrl+C handlers:`);
  ctrlCHandlers.forEach((handler, i) => {
    console.log(`\nHandler ${i + 1}:`);
    console.log(handler);

    // Get more context around this handler
    const index = content.indexOf(handler);
    const start = Math.max(0, index - 200);
    const end = Math.min(content.length, index + handler.length + 200);
    const fullContext = content.substring(start, end);
    console.log('\nFull context:');
    console.log(fullContext);
  });
}

// Also search for the function that contains "this.props.exitOnCtrlC"
const exitOnCtrlCPattern = /exitOnCtrlC[^}]{1,500}/gi;
const exitContext = content.match(exitOnCtrlCPattern);

if (exitContext && exitContext.length > 0) {
  console.log('\n\nFound exitOnCtrlC context:');
  exitContext.forEach((context, i) => {
    console.log(`Context ${i + 1}:`);
    console.log(context);
  });
}