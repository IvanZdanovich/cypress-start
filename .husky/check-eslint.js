const { spawnSync } = require('child_process');
const { ESLint } = require('eslint');
const fs = require('fs');
const path = require('path');

const gitPath = '/usr/bin/git';
const wcPath = '/usr/bin/wc';
const thresholdsFilePath = path.join(__dirname, '../.eslint-thresholds.json');

function getJsFilesFromGit() {
  try {
    const command = [gitPath, 'ls-files', '--', '*.js', '*.jsx', '*.ts', '*.tsx', ':!:node_modules/**', ':!:cypress/reports/**', ':!:dist/**', ':!:build/**'];
    const result = spawnSync(command[0], command.slice(1), { encoding: 'utf8' });
    if (result.error) {
      throw result.error;
    }
    const files = result.stdout.trim().split('\n');
    return files.filter((file) => file.length > 0);
  } catch (error) {
    console.error(`Git command failed: ${error.message}`);
    return [];
  }
}

function countLinesOfCode(files) {
  try {
    if (files.length === 0) return 0;

    const gitCommand = [gitPath, 'ls-files', '--', '*.js', '*.jsx', '*.ts', '*.tsx', ':!:node_modules/**', ':!:cypress/reports/**'];
    const gitResult = spawnSync(gitCommand[0], gitCommand.slice(1), { encoding: 'utf8' });
    if (gitResult.error) {
      throw gitResult.error;
    }
    const fileList = gitResult.stdout
      .trim()
      .split('\n')
      .filter((file) => file.length > 0);

    if (fileList.length === 0) return 0;

    const wcCommand = [wcPath, '-l'];
    const wcResult = spawnSync(wcCommand[0], wcCommand.slice(1), { input: fileList.join('\n'), encoding: 'utf8' });
    if (wcResult.error) {
      throw wcResult.error;
    }
    const output = wcResult.stdout.trim();
    const match = output.match(/^(\d+)\s+total$/);
    return match ? parseInt(match[1]) : 0;
  } catch (error) {
    console.error(`Error counting lines: ${error.message}`);
    return 0;
  }
}

function readThresholds() {
  try {
    const data = fs.readFileSync(thresholdsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading thresholds file: ${error.message}`);
    return { warningThresholdInPercents: 0.01, errorThresholdInPercents: 0.01 };
  }
}

function updateThresholds(newWarningThreshold, newErrorThreshold) {
  try {
    const thresholds = {
      warningThresholdInPercents: newWarningThreshold,
      errorThresholdInPercents: newErrorThreshold,
    };
    fs.writeFileSync(thresholdsFilePath, JSON.stringify(thresholds, null, 2), 'utf8');
    console.log('Thresholds updated successfully.');
  } catch (error) {
    console.error(`Error updating thresholds file: ${error.message}`);
  }
}

async function checkEslintRatios(files) {
  try {
    const filesToCheck = files.length > 0 ? files : getJsFilesFromGit();

    if (filesToCheck.length === 0) {
      console.log('No files found to lint.');
      return process.exit(0);
    }

    console.log(`Linting ${filesToCheck.length} files...`);

    const totalLines = countLinesOfCode(filesToCheck);
    console.log(`Total lines of code: ${totalLines}`);

    if (totalLines === 0) {
      console.log('No code to lint.');
      return process.exit(0);
    }

    const eslint = new ESLint();
    const results = await eslint.lintFiles(filesToCheck);

    let totalWarnings = 0;
    let totalErrors = 0;

    for (const result of results) {
      totalWarnings += result.warningCount;
      totalErrors += result.errorCount;
    }

    const warningRatioInPercents = ((totalWarnings / totalLines) * 100).toFixed(3);
    const errorRatioInPercents = ((totalErrors / totalLines) * 100).toFixed(3);

    const { warningThresholdInPercents, errorThresholdInPercents } = readThresholds();

    console.log(`ESLint found ${totalWarnings} warnings and ${totalErrors} errors.`);
    console.log(`Warning ratio: ${warningRatioInPercents}% (threshold: ${warningThresholdInPercents}%)`);
    console.log(`Error ratio: ${errorRatioInPercents}% (threshold: ${errorThresholdInPercents}%)`);

    if (warningRatioInPercents > warningThresholdInPercents || errorRatioInPercents > errorThresholdInPercents) {
      console.log('\nLint ratios exceed thresholds:');
      if (warningRatioInPercents > warningThresholdInPercents) {
        console.log(`- Warning ratio too high: ${warningRatioInPercents}% > ${warningThresholdInPercents}%`);
      } else {
        updateThresholds(warningRatioInPercents, errorThresholdInPercents);
      }
      if (errorRatioInPercents > errorThresholdInPercents) {
        console.log(`- Error ratio too high: ${errorRatioInPercents}% > ${errorThresholdInPercents}%`);
      } else {
        updateThresholds(warningRatioInPercents, errorRatioInPercents);
      }
      process.exit(1);
    } else {
      console.log('\nLint ratios are within acceptable thresholds.');
      process.exit(0);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

const filesToLint = process.argv.slice(2);
checkEslintRatios(filesToLint);
