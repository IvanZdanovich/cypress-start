const { spawnSync } = require('child_process');
const { ESLint } = require('eslint');
const fs = require('fs');
const path = require('path');

const gitPath = '/usr/bin/git';
const wcPath = '/usr/bin/wc';
const thresholdsFilePath = path.join(__dirname, 'thresholds.json');

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

    // Use the files passed to the function instead of querying git again
    const wcCommand = [wcPath, '-l'].concat(files);
    const wcResult = spawnSync(wcCommand[0], wcCommand.slice(1), { encoding: 'utf8' });
    if (wcResult.error) {
      throw wcResult.error;
    }

    const output = wcResult.stdout.trim();
    const lines = output.split('\n');
    if (lines.length > 1) {
      const lastLine = lines[lines.length - 1];
      const match = lastLine.match(/^\s*(\d+)\s+total$/);
      return match ? parseInt(match[1]) : 0;
    } else {
      const match = output.match(/^\s*(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }
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

    // Filter out files that no longer exist (renamed or deleted)
    const existingFiles = filesToCheck.filter((file) => {
      const exists = fs.existsSync(file);
      if (!exists) {
        console.log(`Skipping non-existent file: ${file}`);
      }
      return exists;
    });

    if (existingFiles.length === 0) {
      console.log('No existing files to lint (all files were deleted or renamed).');
      return process.exit(0);
    }

    console.log(`Linting ${existingFiles.length} files...`);

    const totalLines = countLinesOfCode(existingFiles);
    console.log(`Total lines of code: ${totalLines}`);

    if (totalLines === 0) {
      console.log('No code to lint.');
      return process.exit(0);
    }

    const eslint = new ESLint();
    const results = await eslint.lintFiles(existingFiles);

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
      }
      if (errorRatioInPercents > errorThresholdInPercents) {
        console.log(`- Error ratio too high: ${errorRatioInPercents}% > ${errorThresholdInPercents}%`);
      }
      process.exit(1);
    } else {
      console.log('\nLint ratios are within acceptable thresholds.');
      if (parseFloat(warningRatioInPercents) < parseFloat(warningThresholdInPercents) || parseFloat(errorRatioInPercents) < parseFloat(errorThresholdInPercents)) {
        const newWarningThreshold = Math.min(parseFloat(warningRatioInPercents), parseFloat(warningThresholdInPercents));
        const newErrorThreshold = Math.min(parseFloat(errorRatioInPercents), parseFloat(errorThresholdInPercents));
        console.log(`Updating thresholds to stricter values: warnings ${newWarningThreshold}%, errors ${newErrorThreshold}%`);
        updateThresholds(newWarningThreshold, newErrorThreshold);
      }
      process.exit(0);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

const filesToLint = process.argv.slice(2);
checkEslintRatios(filesToLint);
