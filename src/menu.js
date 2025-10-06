import inquirer from 'inquirer';
import chalk from 'chalk';
import figures from 'figures';
import readline from 'readline';
import { getEnvironments, getDefault, getAppliedEnvironment } from './config-loader.js';
import { getLastEnv, recordEnv } from './history.js';

// ANSI 颜色代码
const DIM = '\x1b[2m';      // 弱化颜色
const GRAY = '\x1b[90m';    // 灰色（弱化）
const CYAN = '\x1b[36m';    // 青色（强调色）
const YELLOW = '\x1b[33m';  // 黄色（GLOBAL）
const ORANGE = '\x1b[38;5;214m'; // 橙色（HISTORY）
const RESET = '\x1b[0m';

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
 * 格式化环境变量对象为显示字符串（用于选中项）
 * @param {Object} env - 环境变量对象
 * @returns {string} 格式化后的环境变量字符串
 */
function formatEnvDisplay(env) {
  const lines = [];
  for (const [key, value] of Object.entries(env)) {
    const formattedValue = formatValue(value);
    lines.push(`  - ${key}="${formattedValue}"`);
  }
  return `${DIM}${lines.join('\n')}${RESET}`;
}

/**
 * 自定义的 listRender 函数，只显示环境名称列表
 * @param {Array} choices - 选项数组
 * @param {Number} pointer - 当前选中的索引
 * @param {String|null} appliedEnvName - APPLIED ENVIRONMENT 名称
 * @param {String|null} historyEnvName - 历史记录的环境名称
 * @returns {String} 渲染后的字符串
 */
function customListRender(choices, pointer, appliedEnvName, historyEnvName) {
  let output = '';
  let separatorOffset = 0;

  choices.forEach((choice, i) => {
    if (choice.type === 'separator') {
      separatorOffset++;
      output += '  ' + choice + '\n';
      return;
    }

    if (choice.disabled) {
      separatorOffset++;
      output += '  - ' + choice.name;
      output += ` (${
        typeof choice.disabled === 'string' ? choice.disabled : 'Disabled'
      })`;
      output += '\n';
      return;
    }

    const isSelected = i - separatorOffset === pointer;
    const envName = choice.name;
    const isGlobal = envName === appliedEnvName;
    const isHistory = envName === historyEnvName;

    // 构建显示名称，添加标记
    let displayName = envName;
    if (isGlobal) {
      displayName += ' (GLOBAL)';
    } else if (isHistory) {
      displayName += ' (HISTORY)';
    }

    // 前缀
    const prefix = isSelected ? '> ' : '  ';

    // 应用颜色
    let coloredName;
    if (isSelected) {
      coloredName = `${CYAN}${displayName}${RESET}`;
    } else if (isGlobal) {
      coloredName = `${YELLOW}${displayName}${RESET}`;
    } else if (isHistory) {
      coloredName = `${ORANGE}${displayName}${RESET}`;
    } else {
      coloredName = `${GRAY}${displayName}${RESET}`;
    }

    output += prefix + coloredName + '\n';
  });

  return output.replace(/\n$/, '');
}

/**
 * 创建自定义 ListPrompt 类
 */
class CustomListPrompt extends inquirer.prompt.prompts.list {
  constructor(questions, rl, answers) {
    super(questions, rl, answers);
    // 保存环境变量映射
    this.envMap = questions.envMap || new Map();
    // 保存 APPLIED ENVIRONMENT 名称
    this.appliedEnvName = questions.appliedEnvName || null;
    // 保存历史记录的环境名称
    this.historyEnvName = questions.historyEnvName || null;
  }

  /**
   * 启动 prompt,添加自定义按键监听
   */
  _run(cb) {
    const result = super._run(cb);

    // 如果已经添加过监听器，先移除
    if (this.keypressHandler) {
      this.rl.input.removeListener('keypress', this.keypressHandler);
    }

    // 添加 keypress 事件监听
    if (!this.rl.input._keypressEnabled) {
      readline.emitKeypressEvents(this.rl.input);
      this.rl.input._keypressEnabled = true;
    }

    if (this.rl.input.isTTY && !this.rl.input.isRaw) {
      this.rl.input.setRawMode(true);
    }

    this.keypressHandler = (str, key) => {
      this.handleKeypress(str, key);
    };

    this.rl.input.on('keypress', this.keypressHandler);

    return result;
  }

  /**
   * 处理按键事件
   */
  handleKeypress(str, key) {
    if (!key) return;

    const keyName = key.name;

    // 忽略上下左右等导航键，让 inquirer 默认处理
    if (['up', 'down', 'left', 'right', 'return', 'enter'].includes(keyName)) {
      return;
    }

    // Q - 退出
    if (str && str.toLowerCase() === 'q') {
      this.rl.input.removeListener('keypress', this.keypressHandler);
      this.screen.clean();
      process.exit(0);
      return;
    }

    // ESC - 退出
    if (keyName === 'escape') {
      this.rl.input.removeListener('keypress', this.keypressHandler);
      this.screen.clean();
      process.exit(0);
      return;
    }
  }

  render() {
    // 获取问题文本
    let message = this.getQuestion();

    if (this.firstRender) {
      message += chalk.dim('(Use arrow keys)');
    }

    // 根据状态渲染
    if (this.status === 'answered') {
      message += chalk.cyan(this.opt.choices.getChoice(this.selected).short);
    } else {
      // 添加 PREVIEWED ENVIRONMENT 区域（移到顶部）
      const selectedChoice = this.opt.choices.getChoice(this.selected);
      const selectedValue = selectedChoice.value;

      message += '\n';
      if (this.envMap.has(selectedValue)) {
        const env = this.envMap.get(selectedValue);
        const environmentName = selectedValue.name;

        message += '\n' + chalk.dim(` - NAME ${environmentName}`);
        message += '\n' + chalk.dim(` - ANTHROPIC_BASE_URL="${env.ANTHROPIC_BASE_URL}"`);
        const maskedToken = formatValue(env.ANTHROPIC_AUTH_TOKEN);
        message += '\n' + chalk.dim(` - ANTHROPIC_AUTH_TOKEN="${maskedToken}"`);
      }

      message += '\n';

      // 使用自定义渲染函数
      const choicesStr = customListRender(this.opt.choices, this.selected, this.appliedEnvName, this.historyEnvName);

      // 计算实际索引位置（简化版，每个选项只占一行）
      const indexPosition = this.opt.choices.indexOf(
        this.opt.choices.getChoice(this.selected)
      );
      const realIndexPosition =
        this.opt.choices.reduce((acc, value, i) => {
          if (i > indexPosition) {
            return acc;
          }
          if (value.type === 'separator') {
            return acc + 1;
          }
          return acc + 1;
        }, 0) - 1;

      message +=
        '\n' + this.paginator.paginate(choicesStr, realIndexPosition, this.opt.pageSize);

      // 添加底部操作提示
      message += '\n\n' +
        chalk.cyan('[⏎]') + 'APPLY  ' +
        chalk.cyan('[Q]') + 'QUIT';
    }

    this.firstRender = false;
    this.screen.render(message);
  }
}

// 注册自定义 prompt
inquirer.registerPrompt('customList', CustomListPrompt);

/**
 * 显示环境选择菜单
 * @param {Array} userCommand - 用户命令数组
 * @returns {Promise<Object|null>} 选择的环境对象，或 null（选择 default）
 */
export async function showEnvironmentMenu(userCommand = []) {
  // 清屏并重置光标到顶部
  process.stdout.write('\x1b[2J'); // 清除整个屏幕
  process.stdout.write('\x1b[H');  // 重置光标到左上角
  if (process.stdout.isTTY) {
    process.stdout.cursorTo(0, 0);
    process.stdout.clearScreenDown();
  }

  const environments = getEnvironments();

  // 获取 APPLIED ENVIRONMENT（用于标记显示）
  const appliedEnv = getAppliedEnvironment();

  // 构建选择列表和环境变量映射
  const choices = [];
  const envMap = new Map();

  // 直接添加所有环境
  environments.forEach(environment => {
    choices.push({
      name: environment.name,
      value: environment
    });
    envMap.set(environment, environment.env);
  });

  // 获取历史记录
  const commandName = userCommand[0]; // 取第一个参数作为命令
  const lastEnvName = commandName ? getLastEnv(commandName) : null;

  // 计算初始光标位置
  // 优先级：历史记录 > 第一项
  let defaultIndex = 0; // 默认选中第一项

  if (lastEnvName) {
    // 查找历史记录的环境是否存在
    const envIndex = choices.findIndex(c =>
      c.value && c.value.name === lastEnvName
    );

    if (envIndex !== -1) {
      // 找到了，设置光标位置
      defaultIndex = envIndex;
    } else {
      // 环境不存在，删除历史记录
      recordEnv(commandName, 'default');
    }
  }

  console.log(chalk.cyan.bold('\nTEMPORARY ENVIRONMENT SELECTOR\n'));

  // 显示交互式菜单
  const answer = await inquirer.prompt([
    {
      type: 'customList',
      name: 'environment',
      message: 'SELECT TEMPORARY ENVIRONMENT:',
      prefix: '>',
      choices: choices,
      default: defaultIndex,  // 设置初始光标位置
      pageSize: 15,
      envMap: envMap,  // 传递环境变量映射
      appliedEnvName: appliedEnv ? appliedEnv.name : null,  // 传递 APPLIED ENVIRONMENT 名称
      historyEnvName: lastEnvName  // 传递历史记录的环境名称
    }
  ]);

  // 获取选中的环境
  const selectedEnvironment = answer.environment;
  const environmentName = selectedEnvironment.name;
  const env = selectedEnvironment.env;

  // 记录用户选择到历史
  if (commandName) {
    recordEnv(commandName, environmentName);
  }

  // 清除 inquirer 的确认输出行（只有一行："> 请选择环境: 选项名"）
  // 向上移动一行并清除
  process.stdout.write('\x1b[1A'); // 向上移动一行
  process.stdout.write('\x1b[2K'); // 清除当前行
  process.stdout.write('\r');      // 回到行首

  // 输出选择确认信息
  const envDisplay = formatEnvDisplay(env);
  console.log(`> ${CYAN}${environmentName}${RESET}\n${envDisplay}`);

  // 返回选择的环境对象供launcher使用
  return selectedEnvironment;
}
