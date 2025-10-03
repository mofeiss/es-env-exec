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
    console.error('Error: No command provided');
    process.exit(1);
  }

  // Prepare environment variables
  let env;
  let environmentName;
  if (environment === null) {
    // Use default configuration
    const defaultConfig = getDefault();
    if (!defaultConfig) {
      console.error('Error: Default environment variables not set (ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN)');
      console.log('Tip: You can set default environment variables in ~/.zshrc');
      process.exit(1);
    }
    env = defaultConfig.env;
    environmentName = 'default';
  } else {
    // Use selected environment
    env = getEnvironmentEnv(environment);
    environmentName = environment.name;
  }

  // Join command array into string
  const commandStr = userCommand.join(' ');

  // Build runtime environment marker (用于 envs 命令识别临时环境变量)
  const runtimeEnvMarker = {
    name: environmentName,
    env: env
  };
  const runtimeEnvJson = JSON.stringify(runtimeEnvMarker);

  // Build environment variable setup commands
  const envCommands = Object.entries(env)
    .map(([key, value]) => `export ${key}=${JSON.stringify(value)}`)
    .join(' && ');

  // Add runtime environment marker
  const markerCommand = `export ESE_RUNTIME_ENV=${JSON.stringify(runtimeEnvJson)}`;

  // Build full command: explicitly set environment variables before command
  // This ensures that environment variables override any in ~/.zshrc
  const fullCommand = `${envCommands} && ${markerCommand} && ${commandStr}`;

  // Use zsh interactive mode to execute command, supporting aliases and functions
  // -i parameter ensures ~/.zshrc is loaded, making custom functions and aliases available
  const child = spawn('zsh', ['-i', '-c', fullCommand], {
    env: process.env,
    stdio: 'inherit'
  });

  // Handle child process exit
  child.on('exit', (code) => {
    process.exit(code || 0);
  });

  // Handle child process errors
  child.on('error', (err) => {
    console.error(`Failed to launch command: ${err.message}`);
    process.exit(1);
  });
}



