import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 加载配置文件
 * @returns {Object} 配置对象
 */
export function loadConfig() {
  const configPath = join(__dirname, '..', 'env.json');
  const configData = readFileSync(configPath, 'utf-8');
  return JSON.parse(configData);
}

/**
 * 获取所有环境列表(过滤已停用的环境)
 * @returns {Array} 环境数组
 */
export function getEnvironments() {
  const config = loadConfig();
  return config.env.filter(acc => !acc.disable || acc.disable === 0);
}

/**
 * 获取所有环境(包括已停用的,用于管理界面)
 * @returns {Array} 环境数组
 */
export function getAllEnvironments() {
  const config = loadConfig();
  return config.env;
}

/**
 * 获取默认配置（从环境变量读取）
 * @returns {Object|null} 默认配置对象，如果未设置则返回 null
 */
export function getDefault() {
  const url = process.env.ANTHROPIC_BASE_URL;
  const token = process.env.ANTHROPIC_AUTH_TOKEN;

  if (!url || !token) {
    return null;
  }

  return {
    env: {
      ANTHROPIC_BASE_URL: url,
      ANTHROPIC_AUTH_TOKEN: token
    }
  };
}

/**
 * 获取环境的所有环境变量
 * @param {Object} environment - 环境对象
 * @returns {Object} 环境变量对象
 */
export function getEnvironmentEnv(environment) {
  return environment.env || {};
}

/**
 * 获取配置文件路径
 * @returns {string} 配置文件路径
 */
export function getConfigPath() {
  return join(__dirname, '..', 'env.json');
}

/**
 * 保存配置到文件
 * @param {Object} config - 配置对象
 */
export function saveConfig(config) {
  const configPath = getConfigPath();
  const configData = JSON.stringify(config, null, 2);
  writeFileSync(configPath, configData, 'utf-8');
}

/**
 * 添加新环境
 * @param {Object} environment - 环境对象 { name, env }
 */
export function addEnvironment(environment) {
  const config = loadConfig();
  config.env.push(environment);
  saveConfig(config);
}

/**
 * 删除指定环境
 * @param {string} name - 环境名称
 * @returns {boolean} 是否删除成功
 */
export function deleteEnvironment(name) {
  const config = loadConfig();
  const index = config.env.findIndex(acc => acc.name === name);
  if (index === -1) {
    return false;
  }
  config.env.splice(index, 1);
  saveConfig(config);
  return true;
}

/**
 * 切换环境启用/停用状态
 * @param {string} name - 环境名称
 * @returns {boolean} 切换后的状态 (true=启用, false=停用)
 */
export function toggleEnvironmentStatus(name) {
  const config = loadConfig();
  const environment = config.env.find(acc => acc.name === name);
  if (!environment) {
    return false;
  }

  // 如果当前是启用状态(disable为0或不存在),则停用
  if (!environment.disable || environment.disable === 0) {
    environment.disable = 1;
    saveConfig(config);
    return false; // 返回停用状态
  } else {
    // 如果当前是停用状态,则启用(删除disable字段)
    delete environment.disable;
    saveConfig(config);
    return true; // 返回启用状态
  }
}

/**
 * 获取 .zshrc 文件路径
 * @returns {string} .zshrc 文件路径
 */
function getZshrcPath() {
  return join(homedir(), '.zshrc');
}

/**
 * 获取已应用到 .zshrc 的环境变量
 * @returns {Object|null} 环境对象 { name, env } 或 null
 */
export function getAppliedEnvironment() {
  try {
    const zshrcPath = getZshrcPath();
    const content = readFileSync(zshrcPath, 'utf-8');

    // 查找标记区域
    const markerRegex = /# === CCS MANAGED ENVIRONMENT - DO NOT EDIT MANUALLY ===\n([\s\S]*?)# === END CCS MANAGED ENVIRONMENT ===/;
    const match = markerRegex.exec(content);

    if (!match) {
      return null;
    }

    const markedContent = match[1];

    // 提取环境名称
    const nameMatch = /# Environment: (.+)/.exec(markedContent);
    // 提取 ANTHROPIC_BASE_URL
    const urlMatch = /export ANTHROPIC_BASE_URL="(.+)"/.exec(markedContent);
    // 提取 ANTHROPIC_AUTH_TOKEN
    const tokenMatch = /export ANTHROPIC_AUTH_TOKEN="(.+)"/.exec(markedContent);

    if (!nameMatch || !urlMatch || !tokenMatch) {
      return null;
    }

    return {
      name: nameMatch[1],
      env: {
        ANTHROPIC_BASE_URL: urlMatch[1],
        ANTHROPIC_AUTH_TOKEN: tokenMatch[1]
      }
    };
  } catch (error) {
    // 文件不存在或读取错误
    return null;
  }
}

/**
 * 应用环境变量到 .zshrc
 * @param {Object} environment - 环境对象 { name, env }
 * @throws {Error} 文件写入错误
 */
export function applyEnvironment(environment) {
  const zshrcPath = getZshrcPath();
  let content = readFileSync(zshrcPath, 'utf-8');

  // 删除旧的标记区域
  const markerRegex = /# === CCS MANAGED ENVIRONMENT - DO NOT EDIT MANUALLY ===\n[\s\S]*?# === END CCS MANAGED ENVIRONMENT ===\n?/g;
  content = content.replace(markerRegex, '');

  // 确保文件以换行符结束
  if (!content.endsWith('\n')) {
    content += '\n';
  }

  // 添加新的标记区域
  const newSection = `# === CCS MANAGED ENVIRONMENT - DO NOT EDIT MANUALLY ===
# Environment: ${environment.name}
export ANTHROPIC_BASE_URL="${environment.env.ANTHROPIC_BASE_URL}"
export ANTHROPIC_AUTH_TOKEN="${environment.env.ANTHROPIC_AUTH_TOKEN}"
# === END CCS MANAGED ENVIRONMENT ===
`;

  content += newSection;

  // 写入文件
  writeFileSync(zshrcPath, content, 'utf-8');
}

