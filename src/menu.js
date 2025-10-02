import inquirer from 'inquirer';
import chalk from 'chalk';
import figures from 'figures';
import { getEnvironments, getDefault } from './config-loader.js';

// ANSI 颜色代码
const DIM = '\x1b[2m';      // 弱化颜色
const CYAN = '\x1b[36m';    // 青色（强调色）
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
 * 自定义的 listRender 函数，只为选中项显示环境变量
 * @param {Array} choices - 选项数组
 * @param {Number} pointer - 当前选中的索引
 * @param {Map} envMap - 环境变量映射
 * @returns {String} 渲染后的字符串
 */
function customListRender(choices, pointer, envMap) {
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

    // 使用 > 而不是 ❯
    let line = (isSelected ? '> ' : '  ') + choice.name;

    if (isSelected) {
      line = chalk.cyan(line);
    }

    output += line + '\n';

    // 只为选中项添加环境变量显示
    if (isSelected && envMap.has(choice.value)) {
      const env = envMap.get(choice.value);
      output += formatEnvDisplay(env) + '\n';
    }
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
      // 使用自定义渲染函数
      const choicesStr = customListRender(this.opt.choices, this.selected, this.envMap);

      // 计算实际索引位置（考虑多行选项）
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

          let l = value.name;
          if (typeof l !== 'string') {
            return acc + 1;
          }

          // 计算行数
          let lines = 1;  // 选项名称占一行

          // 如果是当前选中项，还要加上环境变量的行数
          if (i === indexPosition && this.envMap.has(value.value)) {
            const env = this.envMap.get(value.value);
            lines += Object.keys(env).length;
          }

          return acc + lines;
        }, 0) - 1;

      message +=
        '\n' + this.paginator.paginate(choicesStr, realIndexPosition, this.opt.pageSize);
    }

    this.firstRender = false;
    this.screen.render(message);
  }
}

// 注册自定义 prompt
inquirer.registerPrompt('customList', CustomListPrompt);

/**
 * 显示环境选择菜单
 * @returns {Promise<Object|null>} 选择的环境对象，或 null（选择 default）
 */
export async function showEnvironmentMenu() {
  const environments = getEnvironments();
  const defaultConfig = getDefault();

  // 构建选择列表和环境变量映射
  const choices = [];
  const envMap = new Map();

  // 添加 default 选项到第一位
  if (defaultConfig) {
    const defaultValue = null;  // null 表示使用默认配置
    choices.push({
      name: 'default',
      value: defaultValue
    });
    envMap.set(defaultValue, defaultConfig.env);
  } else {
    choices.push({
      name: 'default',
      value: null
    });
    envMap.set(null, { message: '!!! 未配置' });
  }

  // 添加其他环境
  environments.forEach(environment => {
    choices.push({
      name: environment.name,
      value: environment
    });
    envMap.set(environment, environment.env);
  });

  // 显示交互式菜单
  const answer = await inquirer.prompt([
    {
      type: 'customList',
      name: 'environment',
      message: '请选择环境:',
      prefix: '>',
      choices: choices,
      pageSize: 15,
      envMap: envMap  // 传递环境变量映射
    }
  ]);

  // 获取选中的环境名称和环境变量
  const selectedEnvironment = answer.environment;
  const environmentName = selectedEnvironment === null ? 'default' : selectedEnvironment.name;
  const env = selectedEnvironment === null ? defaultConfig.env : selectedEnvironment.env;

  // 清除 inquirer 的确认输出行（只有一行："> 请选择环境: 选项名"）
  // 向上移动一行并清除
  process.stdout.write('\x1b[1A'); // 向上移动一行
  process.stdout.write('\x1b[2K'); // 清除当前行
  process.stdout.write('\r');      // 回到行首

  // 输出选择确认信息
  const envDisplay = formatEnvDisplay(env);
  console.log(`> ${CYAN}${environmentName}${RESET}\n${envDisplay}`);

  return selectedEnvironment;
}
