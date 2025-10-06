#!/usr/bin/env node

import chalk from 'chalk';
import { getAppliedEnvironment } from '../src/config-loader.js';
import { getCurrentDirHistory } from '../src/history.js';

/**
 * 格式化环境变量值显示（前5...后5，http开头的URL除外）
 * @param {string} value - 环境变量值
 * @returns {string} 格式化后的值
 */
function formatValue(value) {
  // http/https 开头的 URL 不处理
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  // 超过 32 个字符的进行脱敏
  if (value.length > 32) {
    const prefix = value.substring(0, 5);
    const suffix = value.substring(value.length - 5);
    return `${prefix}...${suffix}`;
  }

  return value;
}

/**
 * 获取运行时环境变量（从 ESE_RUNTIME_ENV 标记读取）
 * @returns {Object|null} 运行时环境对象 { name, env } 或 null
 */
function getRuntimeEnvironment() {
  const runtimeEnvJson = process.env.ESE_RUNTIME_ENV;
  if (!runtimeEnvJson) {
    return null;
  }

  try {
    const runtimeEnv = JSON.parse(runtimeEnvJson);
    return runtimeEnv;
  } catch (error) {
    return null;
  }
}

/**
 * 显示环境变量信息
 */
function showEnvironments() {
  const runtimeEnv = getRuntimeEnvironment();
  const appliedEnv = getAppliedEnvironment();
  const currentDirHistory = getCurrentDirHistory();

  // 如果有运行时环境变量，说明是通过 es 命令启动的
  if (runtimeEnv) {
    console.log(chalk.bold('RUNTIME ENVIRONMENT (Temporary):'));
    console.log(chalk.cyan(` - NAME ${runtimeEnv.name}`));
    console.log(chalk.cyan(` - ANTHROPIC_BASE_URL="${runtimeEnv.env.ANTHROPIC_BASE_URL}"`));
    const maskedToken = formatValue(runtimeEnv.env.ANTHROPIC_AUTH_TOKEN);
    console.log(chalk.cyan(` - ANTHROPIC_AUTH_TOKEN="${maskedToken}"`));
    console.log('');
  }

  // 显示全局环境变量
  console.log(chalk.bold('APPLIED ENVIRONMENT (Global):'));
  if (appliedEnv) {
    console.log(chalk.dim(` - NAME ${appliedEnv.name}`));
    console.log(chalk.dim(` - ANTHROPIC_BASE_URL="${appliedEnv.env.ANTHROPIC_BASE_URL}"`));
    const maskedToken = formatValue(appliedEnv.env.ANTHROPIC_AUTH_TOKEN);
    console.log(chalk.dim(` - ANTHROPIC_AUTH_TOKEN="${maskedToken}"`));
  } else {
    console.log(chalk.dim(' - None'));
    if (!runtimeEnv) {
      console.log('');
      console.log(chalk.yellow('Tip: Use "es" command to apply an environment'));
    }
  }

  // 显示当前目录下所有命令的历史记录
  if (currentDirHistory.length > 0) {
    console.log('');
    console.log(chalk.bold('COMMAND HISTORY (Current Directory):'));
    currentDirHistory.forEach(record => {
      console.log(chalk.gray(` - ${record.command} → ${record.env_name}`));
    });
  }
}

// 执行主函数
showEnvironments();
