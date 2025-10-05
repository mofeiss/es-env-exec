import inquirer from 'inquirer';
import chalk from 'chalk';
import { spawn } from 'child_process';
import readline from 'readline';
import {
  getAllEnvironments,
  addEnvironment,
  deleteEnvironment,
  toggleEnvironmentStatus,
  getConfigPath,
  getAppliedEnvironment,
  applyEnvironment
} from './config-loader.js';

// ANSI 颜色代码
const DIM = '\x1b[2m';      // 弱化颜色
const CYAN = '\x1b[36m';    // 青色（强调色）
const GREEN = '\x1b[32m';   // 绿色
const RED = '\x1b[31m';     // 红色
const RESET = '\x1b[0m';

/**
 * 强力清屏函数 - 清除所有终端内容并重置光标
 */
function forceClearScreen() {
  // 1. 清除整个屏幕
  process.stdout.write('\x1b[2J');
  // 2. 重置光标到左上角
  process.stdout.write('\x1b[H');
  // 3. 确保刷新输出
  if (process.stdout.isTTY) {
    process.stdout.cursorTo(0, 0);
    process.stdout.clearScreenDown();
  }
}

/**
 * 清理 process 上的 inquirer 相关的 exit 监听器
 * 防止多个 inquirer baseUI 实例的监听器累积导致 CTRL+C 时出错
 */
function cleanupInquirerExitListeners() {
  const exitListeners = process.listeners('exit');
  exitListeners.forEach(listener => {
    const funcName = listener.name || '';
    // 识别 inquirer 的 onForceClose 监听器（可能是 'onForceClose' 或 'bound onForceClose'）
    if (funcName.includes('onForceClose') || funcName === 'bound onForceClose') {
      process.removeListener('exit', listener);
    }
  });
}

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
 * 格式化环境变量对象为显示字符串
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
 * 自定义的管理列表渲染函数
 * @param {Array} choices - 选项数组
 * @param {Number} pointer - 当前选中的索引
 * @param {Map} envMap - 环境变量映射
 * @param {String|null} appliedEnvName - APPLIED ENVIRONMENT 名称
 * @returns {String} 渲染后的字符串
 */
function customManagementRender(choices, pointer, envMap, appliedEnvName) {
  let output = '';
  let separatorOffset = 0;

  choices.forEach((choice, i) => {
    if (choice.type === 'separator') {
      separatorOffset++;
      output += '  ' + choice + '\n';
      return;
    }

    const isSelected = i - separatorOffset === pointer;
    const environment = choice.value;
    const isEnabled = !environment.disable || environment.disable === 0;
    const isApplied = choice.name === appliedEnvName;

    // 状态图标：[✔] 或 [✘]
    const statusIcon = isEnabled ? `${GREEN}[✔]${RESET}` : `${RED}[✘]${RESET}`;

    // 前缀
    const prefix = isSelected ? '> ' : '  ';

    // 环境名称（应用颜色）
    let envName = choice.name;
    if (isSelected) {
      envName = chalk.cyan(envName);
    } else if (isApplied) {
      envName = chalk.yellow(envName);
    }

    // 组合成最终的行
    let line = prefix + statusIcon + ' ' + envName;

    output += line + '\n';
  });

  return output.replace(/\n$/, '');
}

/**
 * 创建自定义管理列表 Prompt 类
 */
class ManagementListPrompt extends inquirer.prompt.prompts.list {
  constructor(questions, rl, answers) {
    super(questions, rl, answers);
    this.envMap = questions.envMap || new Map();
    this.appliedEnvName = questions.appliedEnvName || null; // 保存 APPLIED ENVIRONMENT 名称
    this.applyInProgress = false; // 标记 APPLY 操作是否正在进行
  }

  /**
   * 重写 onSubmit 来处理 APPLY 功能
   */
  onSubmit(value) {
    // 如果是 APPLY 操作，不调用父类的 onSubmit
    if (this.applyInProgress) {
      return;
    }
    // 否则正常处理
    return super.onSubmit(value);
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

    // 添加 keypress 事件监听（防止重复调用导致监听器累积）
    // readline.emitKeypressEvents() 会添加内部监听器，多次调用会导致内存泄漏
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
    if (['up', 'down', 'left', 'right'].includes(keyName)) {
      return;
    }

    // ENTER/RETURN - 应用环境变量
    if (keyName === 'return' || keyName === 'enter') {
      const selectedChoice = this.opt.choices.getChoice(this.selected);
      const environment = selectedChoice.value;

      // 标记 APPLY 操作正在进行，阻止 onSubmit
      this.applyInProgress = true;

      // 先移除我们的 keypress 监听器，防止干扰后续清理
      this.rl.input.removeListener('keypress', this.keypressHandler);

      try {
        applyEnvironment(environment);

        // 清理所有监听器
        this.rl.input.removeAllListeners('keypress');
        delete this.rl.input._keypressEnabled;
        this.rl.removeAllListeners('SIGINT');
        cleanupInquirerExitListeners();

        // 恢复输入模式
        if (this.rl.input.isTTY && this.rl.input.isRaw) {
          this.rl.input.setRawMode(false);
        }

        // 清屏并关闭
        this.screen.clean();
        this.rl.close();

        // 立即强力清屏
        forceClearScreen();

        // 清理监听器
        const cleanupOutputListeners = () => {
          if (!this.rl.output || !this.rl.output.listenerCount) return;
          const output = this.rl.output;
          if (output.listenerCount('drain') > 0) output.removeAllListeners('drain');
          if (output.listenerCount('close') > 0) output.removeAllListeners('close');
          const errorCount = output.listenerCount('error');
          if (errorCount > 1) {
            const errorListeners = output.listeners('error');
            output.removeAllListeners('error');
            if (errorListeners.length > 0 && errorListeners[0]) {
              output.on('error', errorListeners[0]);
            }
          }
        };

        const cleanupExitListeners = () => {
          const exitCount = process.listenerCount('exit');
          if (exitCount <= 1) return;
          const exitListeners = process.listeners('exit');
          process.removeAllListeners('exit');
          if (exitListeners.length > 0 && exitListeners[0]) {
            process.on('exit', exitListeners[0]);
          }
        };

        cleanupOutputListeners();
        cleanupExitListeners();

        // 显示成功消息并重新加载界面
        console.log(chalk.green(`✓ Environment "${environment.name}" applied successfully`));
        console.log(chalk.yellow('Note: Please restart your shell or run "source ~/.zshrc" to take effect\n'));

        setTimeout(async () => {
          await showManagementMenu();
        }, 1000);

        return;
      } catch (error) {
        console.error(chalk.red(`Failed to apply environment: ${error.message}`));
        // 重置标记
        this.applyInProgress = false;
        // 重新添加监听器以便继续使用
        this.rl.input.on('keypress', this.keypressHandler);
        return;
      }
    }

    // SPACE - 启用/停用
    if (keyName === 'space') {
      const selectedChoice = this.opt.choices.getChoice(this.selected);
      const environment = selectedChoice.value;
      const newStatus = toggleEnvironmentStatus(environment.name);

      // 更新本地环境对象的状态
      if (newStatus) {
        delete environment.disable;
      } else {
        environment.disable = 1;
      }

      // 重新渲染
      this.render();
      return;
    }

    // 字母键处理
    if (str) {
      const char = str.toLowerCase();

      // D - 删除
      if (char === 'd') {
        const selectedChoice = this.opt.choices.getChoice(this.selected);
        const environment = selectedChoice.value;
        const environmentName = environment.name;

        // 删除配置文件中的项
        const success = deleteEnvironment(environmentName);

        if (!success) {
          return;
        }

        // 【关键修复1】先移除当前自定义的 keypress 监听器
        this.rl.input.removeListener('keypress', this.keypressHandler);

        // 【关键修复2】移除所有 keypress 监听器（包括 inquirer 内部的）
        this.rl.input.removeAllListeners('keypress');

        // 【关键修复3】清除 _keypressEnabled 标志，允许下次重新初始化
        delete this.rl.input._keypressEnabled;

        // 【关键修复4】移除 readline 上的 SIGINT 监听器（防止多个 inquirer 实例的监听器累积）
        this.rl.removeAllListeners('SIGINT');

        // 【关键修复5】清理 process 上的 inquirer exit 监听器
        cleanupInquirerExitListeners();

        // 检查是否还有配置项（在关闭 readline 前检查）
        const remainingEnvironments = getAllEnvironments();
        const isLastEnvironment = remainingEnvironments.length === 0;

        // 恢复输入模式
        if (this.rl.input.isTTY && this.rl.input.isRaw) {
          this.rl.input.setRawMode(false);
        }

        // 【关键修复4】关闭 readline 接口，而不仅仅是 screen
        this.rl.close();
        this.screen.done();

        // 立即强力清屏（在 done 之后）
        forceClearScreen();

        // 【关键修复5】清理 stdout 上的监听器（防止 WriteStream 内存泄漏）
        // inquirer/readline 会在 stdout 上注册 drain、error、close 监听器
        // 虽然 rl.close() 应该清理，但快速重建时可能来不及，需要手动清理
        // 采用保守策略：移除所有 readline 添加的监听器，保留系统级监听器
        const cleanupOutputListeners = () => {
          if (!this.rl.output || !this.rl.output.listenerCount) return;

          const output = this.rl.output;

          // 清理 drain 监听器（readline 专用，无系统级监听器）
          if (output.listenerCount('drain') > 0) {
            output.removeAllListeners('drain');
          }

          // 清理 close 监听器（readline 专用，无系统级监听器）
          if (output.listenerCount('close') > 0) {
            output.removeAllListeners('close');
          }

          // 谨慎清理 error 监听器（可能有系统级监听器）
          const errorCount = output.listenerCount('error');
          if (errorCount > 1) {
            const errorListeners = output.listeners('error');
            output.removeAllListeners('error');
            // 只保留第一个系统级监听器
            if (errorListeners.length > 0 && errorListeners[0]) {
              output.on('error', errorListeners[0]);
            }
          }
        };

        // 【关键修复6】清理 process 上的 exit 监听器（防止 process 内存泄漏）
        // inquirer/ScreenManager 会在 process 上注册 exit 监听器用于清理屏幕
        // 采用保守策略：保留最早的 1-2 个系统级监听器，移除后续的
        const cleanupExitListeners = () => {
          const exitCount = process.listenerCount('exit');
          if (exitCount <= 1) return; // 只有 0-1 个监听器，无需清理

          const exitListeners = process.listeners('exit');
          process.removeAllListeners('exit');

          // 保留第一个监听器（通常是系统级的）
          if (exitListeners.length > 0 && exitListeners[0]) {
            process.on('exit', exitListeners[0]);
          }
        };

        // 执行清理
        cleanupOutputListeners();
        cleanupExitListeners();

        // 如果是最后一个配置项，直接退出
        if (isLastEnvironment) {
          console.log(chalk.yellow('All configurations deleted'));
          // 移除所有 exit 监听器，防止 process.exit 触发已关闭的 readline 清理
          process.removeAllListeners('exit');
          process.exit(0);
          return;
        }

        // 重新加载管理界面（使用 setImmediate 确保异步调用）
        setImmediate(async () => {
          await showManagementMenu();
        });

        return;
      }

      // A - 新增
      if (char === 'a') {
        // 【关键修复】清理监听器
        this.rl.input.removeListener('keypress', this.keypressHandler);
        this.rl.input.removeAllListeners('keypress');
        delete this.rl.input._keypressEnabled;
        this.rl.removeAllListeners('SIGINT');
        cleanupInquirerExitListeners();

        // 恢复输入模式
        if (this.rl.input.isTTY && this.rl.input.isRaw) {
          this.rl.input.setRawMode(false);
        }

        // 关闭 readline 接口并清屏
        this.rl.close();
        this.screen.done();

        // 立即强力清屏（在 done 之后）
        forceClearScreen();

        // 清理输出流监听器
        const cleanupOutputListeners = () => {
          if (!this.rl.output || !this.rl.output.listenerCount) return;
          const output = this.rl.output;
          if (output.listenerCount('drain') > 0) output.removeAllListeners('drain');
          if (output.listenerCount('close') > 0) output.removeAllListeners('close');
          const errorCount = output.listenerCount('error');
          if (errorCount > 1) {
            const errorListeners = output.listeners('error');
            output.removeAllListeners('error');
            if (errorListeners.length > 0 && errorListeners[0]) {
              output.on('error', errorListeners[0]);
            }
          }
        };

        // 清理 process exit 监听器
        const cleanupExitListeners = () => {
          const exitCount = process.listenerCount('exit');
          if (exitCount <= 1) return;
          const exitListeners = process.listeners('exit');
          process.removeAllListeners('exit');
          if (exitListeners.length > 0 && exitListeners[0]) {
            process.on('exit', exitListeners[0]);
          }
        };

        cleanupOutputListeners();
        cleanupExitListeners();

        // 调用添加环境函数
        setImmediate(async () => {
          await handleAddEnvironment();
          // 添加完成后返回到管理界面
          await showManagementMenu();
        });

        return;
      }

      // E - 终端编辑器
      if (char === 'e') {
        // 【关键修复】清理监听器
        this.rl.input.removeListener('keypress', this.keypressHandler);
        this.rl.input.removeAllListeners('keypress');
        delete this.rl.input._keypressEnabled;
        this.rl.removeAllListeners('SIGINT');
        cleanupInquirerExitListeners();

        // 恢复输入模式
        if (this.rl.input.isTTY && this.rl.input.isRaw) {
          this.rl.input.setRawMode(false);
        }

        // 关闭 readline 接口并清屏
        this.rl.close();
        this.screen.done();

        // 立即强力清屏（在 done 之后）
        forceClearScreen();

        // 清理监听器
        const cleanupOutputListeners = () => {
          if (!this.rl.output || !this.rl.output.listenerCount) return;
          const output = this.rl.output;
          if (output.listenerCount('drain') > 0) output.removeAllListeners('drain');
          if (output.listenerCount('close') > 0) output.removeAllListeners('close');
          const errorCount = output.listenerCount('error');
          if (errorCount > 1) {
            const errorListeners = output.listeners('error');
            output.removeAllListeners('error');
            if (errorListeners.length > 0 && errorListeners[0]) {
              output.on('error', errorListeners[0]);
            }
          }
        };

        const cleanupExitListeners = () => {
          const exitCount = process.listenerCount('exit');
          if (exitCount <= 1) return;
          const exitListeners = process.listeners('exit');
          process.removeAllListeners('exit');
          if (exitListeners.length > 0 && exitListeners[0]) {
            process.on('exit', exitListeners[0]);
          }
        };

        cleanupOutputListeners();
        cleanupExitListeners();

        // 调用终端编辑器
        setImmediate(async () => {
          await handleEditTerminal();
        });

        return;
      }

      // G - GUI 编辑器
      if (char === 'g') {
        // 【关键修复】清理监听器
        this.rl.input.removeListener('keypress', this.keypressHandler);
        this.rl.input.removeAllListeners('keypress');
        delete this.rl.input._keypressEnabled;
        this.rl.removeAllListeners('SIGINT');
        cleanupInquirerExitListeners();

        // 恢复输入模式
        if (this.rl.input.isTTY && this.rl.input.isRaw) {
          this.rl.input.setRawMode(false);
        }

        // 关闭 readline 接口并清屏
        this.rl.close();
        this.screen.done();

        // 立即强力清屏（在 done 之后）
        forceClearScreen();

        // 清理监听器
        const cleanupOutputListeners = () => {
          if (!this.rl.output || !this.rl.output.listenerCount) return;
          const output = this.rl.output;
          if (output.listenerCount('drain') > 0) output.removeAllListeners('drain');
          if (output.listenerCount('close') > 0) output.removeAllListeners('close');
          const errorCount = output.listenerCount('error');
          if (errorCount > 1) {
            const errorListeners = output.listeners('error');
            output.removeAllListeners('error');
            if (errorListeners.length > 0 && errorListeners[0]) {
              output.on('error', errorListeners[0]);
            }
          }
        };

        const cleanupExitListeners = () => {
          const exitCount = process.listenerCount('exit');
          if (exitCount <= 1) return;
          const exitListeners = process.listeners('exit');
          process.removeAllListeners('exit');
          if (exitListeners.length > 0 && exitListeners[0]) {
            process.on('exit', exitListeners[0]);
          }
        };

        cleanupOutputListeners();
        cleanupExitListeners();

        // 调用 GUI 编辑器
        setImmediate(async () => {
          await handleEditGUI();
        });

        return;
      }

      // R - 重载配置
      if (char === 'r') {
        // 【关键修复】先移除当前自定义的 keypress 监听器
        this.rl.input.removeListener('keypress', this.keypressHandler);

        // 【关键修复】移除所有 keypress 监听器（包括 inquirer 内部的）
        this.rl.input.removeAllListeners('keypress');

        // 【关键修复】清除 _keypressEnabled 标志，允许下次重新初始化
        delete this.rl.input._keypressEnabled;

        // 【关键修复】移除 readline 上的 SIGINT 监听器
        this.rl.removeAllListeners('SIGINT');

        // 【关键修复】清理 process 上的 inquirer exit 监听器
        cleanupInquirerExitListeners();

        // 恢复输入模式
        if (this.rl.input.isTTY && this.rl.input.isRaw) {
          this.rl.input.setRawMode(false);
        }

        // 【关键修复】关闭 readline 接口并清屏
        this.rl.close();
        this.screen.done();

        // 立即强力清屏（在 done 之后）
        forceClearScreen();

        // 清理输出流监听器（参考删除操作的清理逻辑）
        const cleanupOutputListeners = () => {
          if (!this.rl.output || !this.rl.output.listenerCount) return;

          const output = this.rl.output;

          if (output.listenerCount('drain') > 0) {
            output.removeAllListeners('drain');
          }

          if (output.listenerCount('close') > 0) {
            output.removeAllListeners('close');
          }

          const errorCount = output.listenerCount('error');
          if (errorCount > 1) {
            const errorListeners = output.listeners('error');
            output.removeAllListeners('error');
            if (errorListeners.length > 0 && errorListeners[0]) {
              output.on('error', errorListeners[0]);
            }
          }
        };

        // 清理 process exit 监听器
        const cleanupExitListeners = () => {
          const exitCount = process.listenerCount('exit');
          if (exitCount <= 1) return;

          const exitListeners = process.listeners('exit');
          process.removeAllListeners('exit');

          if (exitListeners.length > 0 && exitListeners[0]) {
            process.on('exit', exitListeners[0]);
          }
        };

        // 执行清理
        cleanupOutputListeners();
        cleanupExitListeners();

        // 重新加载管理界面
        console.log(chalk.green('Configuration reloaded\n'));
        setImmediate(async () => {
          await showManagementMenu();
        });

        return;
      }

      // Q - 退出
      if (char === 'q') {
        this.rl.input.removeListener('keypress', this.keypressHandler);
        this.rl.removeAllListeners('SIGINT');
        cleanupInquirerExitListeners();
        this.screen.clean();
        process.exit(0);
        return;
      }
    }

    // ESC - 退出
    if (keyName === 'escape') {
      this.rl.input.removeListener('keypress', this.keypressHandler);
      this.rl.removeAllListeners('SIGINT');
      cleanupInquirerExitListeners();
      this.screen.clean();
      process.exit(0);
      return;
    }
  }

  render() {
    let message = this.getQuestion();

    if (this.firstRender) {
      message += chalk.dim('(Use arrow keys)');
    }

    if (this.status === 'answered') {
      message += chalk.cyan(this.opt.choices.getChoice(this.selected).short);
    } else {
      const choicesStr = customManagementRender(this.opt.choices, this.selected, this.envMap, this.appliedEnvName);

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

      // 添加 PREVIEWED ENVIRONMENT 区域
      const selectedChoice = this.opt.choices.getChoice(this.selected);
      const environment = selectedChoice.value;

      message += '\n\n' + chalk.bold('PREVIEWED ENVIRONMENT:');
      if (this.envMap.has(environment)) {
        const env = this.envMap.get(environment);
        message += '\n' + chalk.dim(` - NAME ${environment.name}`);
        message += '\n' + chalk.dim(` - ANTHROPIC_BASE_URL="${env.ANTHROPIC_BASE_URL}"`);
        const maskedToken = formatValue(env.ANTHROPIC_AUTH_TOKEN);
        message += '\n' + chalk.dim(` - ANTHROPIC_AUTH_TOKEN="${maskedToken}"`);
      }

      // 添加底部操作提示
      const isEnabled = !environment.disable || environment.disable === 0;
      const toggleText = isEnabled ? 'TOGGLE' : 'TOGGLE';

      message += '\n\n' +
        chalk.cyan('[⎵]') + toggleText + '  ' +
        chalk.cyan('[D]') + 'DEL  ' +
        chalk.cyan('[A]') + 'ADD  ' +
        chalk.cyan('[E]') + 'EDIT  ' +
        chalk.cyan('[G]') + 'GUI  ' +
        chalk.cyan('[R]') + 'RELOAD  ' +
        chalk.cyan('[⏎]') + 'APPLY  ' +
        chalk.cyan('[Q]') + 'QUIT';
    }

    this.firstRender = false;
    this.screen.render(message);
  }
}

/**
 * 创建自定义输入 Prompt 类
 * 用于在验证错误前添加空行
 */
class CustomInputPrompt extends inquirer.prompt.prompts.input {
  /**
   * 重写错误处理方法，在错误前添加空行
   */
  onError(state) {
    // 如果有错误消息，在前面添加空行
    if (state.isValid === false && this.opt.validate) {
      // 保存原始错误消息
      const originalError = state.error;
      // 在错误消息前添加换行
      state.error = '\n' + originalError;
    }
    return super.onError(state);
  }

  /**
   * 重写渲染方法，确保错误正确显示
   */
  render(error) {
    let message = this.getQuestion();
    let bottomContent = '';

    if (this.status === 'answered') {
      message += chalk.cyan(this.answer);
    } else {
      message += this.rl.line;
    }

    if (error) {
      // 错误消息已经包含前置换行符
      bottomContent = '\n' + chalk.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  }
}

// 注册自定义 prompt
inquirer.registerPrompt('managementList', ManagementListPrompt);
inquirer.registerPrompt('customInput', CustomInputPrompt);

/**
 * 显示管理界面
 */
export async function showManagementMenu() {
  // 先清屏，清除所有历史输出
  forceClearScreen();

  // 【防御性修复】确保 stdin 处于干净状态
  if (process.stdin._keypressEnabled) {
    process.stdin.removeAllListeners('keypress');
    delete process.stdin._keypressEnabled;
  }

  // 【防御性修复】清理 stdin 上可能残留的 SIGINT 监听器
  // 防止多个 inquirer 实例的 SIGINT 监听器累积导致 CTRL+C 时出错
  if (process.stdin.listenerCount && process.stdin.listenerCount('SIGINT') > 0) {
    process.stdin.removeAllListeners('SIGINT');
  }

  // 【防御性修复】清理 process 上所有 inquirer 遗留的 exit 监听器
  // 这是最关键的修复，防止多个 baseUI 实例的监听器残留
  cleanupInquirerExitListeners();

  // 确保 stdin 处于正常模式
  if (process.stdin.isTTY && process.stdin.isRaw) {
    process.stdin.setRawMode(false);
  }

  // 【防御性修复】清理 stdout 上可能残留的监听器
  // 防止上一次操作的监听器未完全清理导致累积
  if (process.stdout && process.stdout.listenerCount) {
    const drainCount = process.stdout.listenerCount('drain');
    const errorCount = process.stdout.listenerCount('error');
    const closeCount = process.stdout.listenerCount('close');

    // 如果监听器数量异常（>1），进行清理
    if (drainCount > 1) {
      process.stdout.removeAllListeners('drain');
    }
    if (errorCount > 2) { // error 可能有 2 个系统级监听器
      const listeners = process.stdout.listeners('error');
      process.stdout.removeAllListeners('error');
      // 保留前 2 个系统级监听器
      if (listeners.length > 0) {
        listeners.slice(0, 2).forEach(listener => {
          process.stdout.on('error', listener);
        });
      }
    }
    if (closeCount > 1) {
      process.stdout.removeAllListeners('close');
    }
  }

  // 【防御性修复】清理 process 上可能残留的 exit 监听器
  const exitCount = process.listenerCount('exit');
  if (exitCount > 2) { // 系统可能有 1-2 个基础 exit 监听器
    const listeners = process.listeners('exit');
    process.removeAllListeners('exit');
    // 保留前 2 个系统级监听器
    if (listeners.length > 0) {
      listeners.slice(0, 2).forEach(listener => {
        process.on('exit', listener);
      });
    }
  }

  const environments = getAllEnvironments();

  // 检查是否有配置项
  if (environments.length === 0) {
    console.log(chalk.cyan.bold('\n⚙ ENVIRONMENT CONFIGURATION MANAGER ⚙\n'));
    console.log(chalk.yellow('No configurations found. Please add one first.'));
    console.log(chalk.gray('\nPress A to add new environment, Q to quit\n'));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select action:',
        choices: [
          { name: '[A] Add new environment', value: 'add' },
          { name: '[Q] Quit', value: 'quit' }
        ]
      }
    ]);

    if (action === 'add') {
      await handleAddEnvironment();
      // 添加完成后返回到管理界面
      await showManagementMenu();
    } else {
      process.exit(0);
    }
    return;
  }

  // 构建选择列表和环境变量映射
  const choices = [];
  const envMap = new Map();

  environments.forEach(environment => {
    choices.push({
      name: environment.name,
      value: environment
    });
    envMap.set(environment, environment.env);
  });

  console.log(chalk.cyan.bold('\n⚙ ENVIRONMENT CONFIGURATION MANAGER ⚙\n'));

  // 显示 APPLIED ENVIRONMENT
  const appliedEnv = getAppliedEnvironment();

  // 计算初始光标位置
  let defaultIndex = 0; // 默认选中第一项

  if (appliedEnv) {
    // 如果有 APPLIED ENVIRONMENT，定位到该环境
    const envIndex = choices.findIndex(c =>
      c.value && c.value.name === appliedEnv.name
    );
    if (envIndex !== -1) {
      defaultIndex = envIndex;
    }
  }

  if (appliedEnv) {
    console.log(chalk.bold('APPLIED ENVIRONMENT:'));
    console.log(chalk.dim(` - NAME ${appliedEnv.name}`));
    console.log(chalk.dim(` - ANTHROPIC_BASE_URL="${appliedEnv.env.ANTHROPIC_BASE_URL}"`));
    const maskedToken = formatValue(appliedEnv.env.ANTHROPIC_AUTH_TOKEN);
    console.log(chalk.dim(` - ANTHROPIC_AUTH_TOKEN="${maskedToken}"`));
    console.log('');
  } else {
    console.log(chalk.bold('APPLIED ENVIRONMENT:'));
    console.log(chalk.dim(' - None'));
    console.log('');
  }

  console.log(chalk.bold('> AVAILABLE ENVIRONMENTS:'));

  // 显示交互式菜单
  const answer = await inquirer.prompt([
    {
      type: 'managementList',
      name: 'result',
      message: 'SELECT ENVIRONMENTS:',
      prefix: '>',
      choices: choices,
      default: defaultIndex,  // 设置初始光标位置
      pageSize: 15,
      envMap: envMap,
      appliedEnvName: appliedEnv ? appliedEnv.name : null  // 传递 APPLIED ENVIRONMENT 名称
    }
  ]);

  // 处理操作结果
  const result = answer.result;

  if (result && result.action) {
    switch (result.action) {
      case 'add':
        await handleAddAccount();
        break;
      case 'edit-terminal':
        await handleEditTerminal();
        break;
      case 'edit-gui':
        await handleEditGUI();
        break;
    }
  }
}

/**
 * 处理新增环境
 */
async function handleAddEnvironment() {
  // 在显示添加界面前先清屏
  forceClearScreen();
  console.log(chalk.cyan.bold('\nAdd New Environment\n'));

  let answers;
  try {
    answers = await inquirer.prompt([
      {
        type: 'customInput',
        name: 'name',
        message: 'Environment name:',
        validate: (input) => {
          if (!input.trim()) {
            return 'Environment name cannot be empty';
          }
          const environments = getAllEnvironments();
          if (environments.find(env => env.name === input.trim())) {
            return 'Environment name already exists, please delete and re-enter';
          }
          return true;
        }
      },
      {
        type: 'customInput',
        name: 'baseUrl',
        message: 'ANTHROPIC_BASE_URL:',
        validate: (input) => {
          if (!input.trim()) {
            return 'BASE_URL cannot be empty';
          }
          return true;
        }
      },
      {
        type: 'customInput',
        name: 'authToken',
        message: 'ANTHROPIC_AUTH_TOKEN:',
        validate: (input) => {
          if (!input.trim()) {
            return 'AUTH_TOKEN cannot be empty';
          }
          return true;
        }
      }
    ]);
  } catch (error) {
    // 【关键修复】捕获用户按 CTRL+C 时的 readline 错误
    // 当验证失败后按 CTRL+C，可能会触发 ERR_USE_AFTER_CLOSE 错误
    // 这是因为多个 inquirer baseUI 实例的监听器残留导致的
    if (error.code === 'ERR_USE_AFTER_CLOSE' ||
        error.message?.includes('readline was closed')) {
      // 干净退出，不显示错误信息
      process.exit(0);
    }
    // 其他类型的错误继续抛出
    throw error;
  }

  const newEnvironment = {
    name: answers.name.trim(),
    env: {
      ANTHROPIC_BASE_URL: answers.baseUrl.trim(),
      ANTHROPIC_AUTH_TOKEN: answers.authToken.trim()
    }
  };

  addEnvironment(newEnvironment);
  console.log(chalk.green(`\n✓ Environment added: ${newEnvironment.name}`));

  // 短暂延迟，让用户看到成功消息
  await new Promise(resolve => setTimeout(resolve, 800));
}

/**
 * 处理终端编辑器打开
 */
async function handleEditTerminal() {
  const editor = process.env.EDITOR || process.env.VISUAL || 'nano';
  const configPath = getConfigPath();

  console.log(chalk.cyan(`Opening config file with ${editor}...\n`));

  const child = spawn(editor, [configPath], {
    stdio: 'inherit'
  });

  child.on('exit', async (code) => {
    if (code === 0) {
      console.log(chalk.green('\nConfig file saved\n'));
      // 重新加载管理界面
      await showManagementMenu();
    } else {
      console.error(chalk.red(`\nEditor exited abnormally with code: ${code}\n`));
      process.exit(code);
    }
  });

  child.on('error', (err) => {
    console.error(chalk.red(`Failed to open editor: ${err.message}`));
    process.exit(1);
  });
}

/**
 * 处理 GUI 编辑器打开
 */
async function handleEditGUI() {
  const configPath = getConfigPath();
  const platform = process.platform;

  let command, args;

  if (platform === 'darwin') {
    // macOS
    command = 'open';
    args = [configPath];
  } else if (platform === 'win32') {
    // Windows
    command = 'start';
    args = [configPath];
  } else {
    // Linux
    command = 'xdg-open';
    args = [configPath];
  }

  console.log(chalk.cyan(`Opening config file with default GUI editor...\n`));

  const child = spawn(command, args, {
    stdio: 'ignore',
    detached: true
  });

  child.unref();

  console.log(chalk.green('Config file opened in GUI editor\n'));
  console.log(chalk.cyan('Tip: After editing, return to terminal and press R to reload\n'));

  // 返回管理界面
  setTimeout(async () => {
    await showManagementMenu();
  }, 800);
}
