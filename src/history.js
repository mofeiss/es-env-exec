import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

/**
 * 获取历史记录文件路径
 * @returns {string} 历史记录文件路径
 */
function getHistoryPath() {
  return join(homedir(), '.config', 'es', 'history.json');
}

/**
 * 加载历史记录
 * @returns {Object} 历史记录对象
 */
function loadHistory() {
  const historyPath = getHistoryPath();

  if (!existsSync(historyPath)) {
    return { history: [] };
  }

  try {
    const data = readFileSync(historyPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // 文件损坏或格式错误，返回空历史
    return { history: [] };
  }
}

/**
 * 保存历史记录
 * @param {Object} history - 历史记录对象
 */
function saveHistory(history) {
  const historyPath = getHistoryPath();
  const historyDir = dirname(historyPath);

  // 确保目录存在
  if (!existsSync(historyDir)) {
    mkdirSync(historyDir, { recursive: true });
  }

  writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
}

/**
 * 获取当前目录+命令的上次使用的环境名
 * @param {string} command - 命令名称
 * @returns {string|null} 环境名称，如果没有记录则返回 null
 */
export function getLastEnv(command) {
  if (!command) {
    return null;
  }

  const history = loadHistory();
  const currentPath = process.cwd();

  // 查找当前目录的记录
  const pathRecord = history.history.find(record => record.path === currentPath);

  if (!pathRecord) {
    return null;
  }

  // 查找命令记录
  const commandRecord = pathRecord.commands.find(cmd => cmd.command === command);

  if (!commandRecord) {
    return null;
  }

  return commandRecord.env_name;
}

/**
 * 获取当前目录下所有命令的历史记录
 * @returns {Array} 命令记录数组 [{command, env_name}, ...]
 */
export function getCurrentDirHistory() {
  const history = loadHistory();
  const currentPath = process.cwd();

  // 查找当前目录的记录
  const pathRecord = history.history.find(record => record.path === currentPath);

  if (!pathRecord || !pathRecord.commands || pathRecord.commands.length === 0) {
    return [];
  }

  return pathRecord.commands;
}

/**
 * 记录命令+环境
 * @param {string} command - 命令名称
 * @param {string} envName - 环境名称，如果是 'default' 则删除记录
 */
export function recordEnv(command, envName) {
  if (!command) {
    return;
  }

  const history = loadHistory();
  const currentPath = process.cwd();

  // 查找或创建当前目录的记录
  let pathRecord = history.history.find(record => record.path === currentPath);

  if (!pathRecord) {
    pathRecord = {
      path: currentPath,
      commands: []
    };
    history.history.push(pathRecord);
  }

  // 查找命令记录
  const commandIndex = pathRecord.commands.findIndex(cmd => cmd.command === command);

  if (envName === 'default') {
    // 删除记录
    if (commandIndex !== -1) {
      pathRecord.commands.splice(commandIndex, 1);

      // 如果该目录下没有其他命令记录，删除整个目录记录
      if (pathRecord.commands.length === 0) {
        const pathIndex = history.history.indexOf(pathRecord);
        history.history.splice(pathIndex, 1);
      }
    }
  } else {
    // 更新或新增记录
    if (commandIndex !== -1) {
      // 更新现有记录
      pathRecord.commands[commandIndex].env_name = envName;
    } else {
      // 新增记录
      pathRecord.commands.push({
        command: command,
        env_name: envName
      });
    }
  }

  saveHistory(history);
}
