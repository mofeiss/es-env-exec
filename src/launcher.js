import { spawn } from 'child_process';
import { getDefault, getEnvironmentEnv } from './config-loader.js';

/**
 * 格式化环境变量值（前5...后5，http开头的URL除外）
 * @param {string} value - 环境变量值
 * @returns {string} 格式化后的值
 */
function formatEnvValue(value) {
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
 * 显示环境变量
 * @param {Object} env - 环境变量对象
 */
function displayEnv(env) {
  console.log('ENV:');
  for (const [key, value] of Object.entries(env)) {
    const formattedValue = formatEnvValue(value);
    console.log(`  ${key}: ${formattedValue}`);
  }
}

/**
 * 启动命令
 * @param {Array} userCommand - 用户传入的命令数组 [command, ...args]
 * @param {Object|null} environment - 环境对象，null 表示使用默认配置
 */
export function launchCommand(userCommand, environment) {
  if (!userCommand || userCommand.length === 0) {
    console.error('错误：未提供命令');
    process.exit(1);
  }

  // 准备环境变量
  let env;
  if (environment === null) {
    // 使用默认配置
    const defaultConfig = getDefault();
    if (!defaultConfig) {
      console.error('错误：未设置默认环境变量 (ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN)');
      console.log('提示：可以在 ~/.zshrc 中设置默认环境变量');
      process.exit(1);
    }
    env = defaultConfig.env;
  } else {
    // 使用选中的环境
    env = getEnvironmentEnv(environment);
  }

  // 将命令数组合并为字符串
  const commandStr = userCommand.join(' ');

  // 构建环境变量设置命令
  const envCommands = Object.entries(env)
    .map(([key, value]) => `export ${key}=${JSON.stringify(value)}`)
    .join(' && ');

  // 构建完整命令：在命令前显式设置环境变量
  // 这样可以确保即使 ~/.zshrc 中有 export 语句也会被覆盖
  const fullCommand = `${envCommands} && ${commandStr}`;

  // 使用 zsh 交互式模式执行命令，支持 alias 和函数
  // -i 参数确保加载 ~/.zshrc，使自定义函数和 alias 可用
  const child = spawn('zsh', ['-i', '-c', fullCommand], {
    env: process.env,
    stdio: 'inherit'
  });

  // 处理子进程退出
  child.on('exit', (code) => {
    process.exit(code || 0);
  });

  // 处理子进程错误
  child.on('error', (err) => {
    console.error(`启动命令失败: ${err.message}`);
    process.exit(1);
  });
}



