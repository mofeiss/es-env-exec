#!/usr/bin/env node

import { showEnvironmentMenu } from '../src/menu.js';
import { showManagementMenu } from '../src/management.js';
import { launchCommand } from '../src/launcher.js';

/**
 * 主函数
 */
async function main() {
  try {
    // 获取用户传入的命令参数（跳过 node 和脚本路径）
    const userCommand = process.argv.slice(2);

    // 如果没有传入命令，显示管理界面
    if (userCommand.length === 0) {
      await showManagementMenu();
      process.exit(0);
    }

    // 显示环境选择菜单
    const selectedEnvironment = await showEnvironmentMenu();

    // 执行用户命令
    launchCommand(userCommand, selectedEnvironment);
  } catch (error) {
    console.error(`执行出错: ${error.message}`);
    process.exit(1);
  }
}

main();

