#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { showEnvironmentMenu } from '../src/menu.js';
import { showManagementMenu } from '../src/management.js';
import { launchCommand } from '../src/launcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 获取版本号
 */
function getVersion() {
  const packagePath = join(__dirname, '../package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
  return packageJson.version;
}

/**
 * Main entry point
 */
async function main() {
  try {
    // Get user command arguments (skip node and script path)
    const userCommand = process.argv.slice(2);

    // Check for version flag
    if (userCommand.length === 1 && (userCommand[0] === '-v' || userCommand[0] === '--version')) {
      console.log(`v${getVersion()}`);
      process.exit(0);
    }

    // If no command provided, show management interface
    if (userCommand.length === 0) {
      await showManagementMenu();
      process.exit(0);
    }

    // Show environment selection menu
    const selectedEnvironment = await showEnvironmentMenu(userCommand);

    // Execute user command with selected environment
    launchCommand(userCommand, selectedEnvironment);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

