const { EOL: EOLSymbol } = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { stdin: input, stdout: output } = require('node:process');

const promptForTextInput = `Hello! Please, enter lines to add to the file: ${EOLSymbol}`;
const farewellPhrase = 'Thank you. Prompt will be closed. Have a good day!';
const textFileName = 'text.txt';
const pathToTextFile = path.join(__dirname, textFileName);

const rlAddTextToFile = readline.createInterface({ input, output, prompt: '' });

const FIRST_LINE = true;
const closeAddTextPrompt = () => {
  const isClearEntireLine = 0;
  readline.clearLine(output, isClearEntireLine, () => {
    readline.cursorTo(output, 0, () => {
      output.write(farewellPhrase);
      rlAddTextToFile.close();
    });
  });
};

const addLineToFile = (filePath, userInput, isFirstLineInFile) => {
  const lineToAdd = isFirstLineInFile ? userInput : `${EOLSymbol}${userInput}`;
  fs.appendFile(filePath, lineToAdd, (err) => {
    if (err) {
      throw err;
    }
    rlAddTextToFile.prompt();
  });
};

const isExitPrompt = (userInput) => {
  return userInput.trim() === 'exit';
};

const handleUserInput = (userInput, isFirstLineInFile = false) => {
  if (isExitPrompt(userInput)) {
    closeAddTextPrompt();
    return;
  }
  addLineToFile(pathToTextFile, userInput, isFirstLineInFile);
};

fs.writeFile(pathToTextFile, '', (err) => {
  if (err) {
    throw err;
  }
  rlAddTextToFile.question(promptForTextInput, (userInput) =>
    handleUserInput(userInput, FIRST_LINE),
  );
});

rlAddTextToFile.on('line', (userInput) => handleUserInput(userInput));
rlAddTextToFile.on('SIGINT', () => closeAddTextPrompt());
