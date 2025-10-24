#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the CLI file
const cliPath = path.join(__dirname, 'node_modules/@anthropic-ai/claude-code/cli.js');
const content = fs.readFileSync(cliPath, 'utf8');

// The exact handleInput function we found
const currentHandleInput = 'handleInput=(A)=>{if(A==="\x03"&&this.props.exitOnCtrlC)this.handleExit();if(A==="\x1A"&&aR9)this.handleSuspend();if(A===nR9&&this.state.activeFocusId)this.setState({activeFocusId:void 0});if(this.state.isFocusEnabled&&this.state.focusables.length>0){if(A===lR9)this.focusNext();if(A===iR9)this.focusPrevious()}}';

console.log('Looking for exact match in the file...');
console.log('Target function length:', currentHandleInput.length);

// Check if the function exists
const index = content.indexOf(currentHandleInput);
if (index === -1) {
  console.log('Function not found with exact match. Looking for variations...');

  // Try to find handleInput in the file
  const handleInputIndex = content.indexOf('handleInput=');
  if (handleInputIndex !== -1) {
    console.log('Found handleInput at index:', handleInputIndex);

    // Extract the function from the file
    const extracted = content.substring(handleInputIndex, handleInputIndex + 350);
    console.log('Extracted function:', extracted);

    // Find the end by counting braces
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

    const actualFunction = content.substring(handleInputIndex, endPos);
    console.log('\nActual function from file:');
    console.log(actualFunction);
    console.log('\nActual function length:', actualFunction.length);

    // Save the actual function
    fs.writeFileSync(path.join(__dirname, 'actual_handleInput.txt'), actualFunction);
    console.log('Saved to actual_handleInput.txt');

  } else {
    console.log('Could not find any handleInput function');
  }
} else {
  console.log('Found exact match at index:', index);
}