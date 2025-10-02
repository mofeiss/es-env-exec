#!/usr/bin/env node

import { showEnvironmentMenu } from '../src/menu.js';
import { showManagementMenu } from '../src/management.js';
import { launchCommand } from '../src/launcher.js';

/**
 * Main entry point
 */
async function main() {
  try {
    // Get user command arguments (skip node and script path)
    const userCommand = process.argv.slice(2);

    // If no command provided, show management interface
    if (userCommand.length === 0) {
      await showManagementMenu();
      process.exit(0);
    }

    // Show environment selection menu
    const selectedEnvironment = await showEnvironmentMenu();

    // Execute user command with selected environment
    launchCommand(userCommand, selectedEnvironment);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

