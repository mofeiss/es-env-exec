# CCS - Claude Code Switcher

多环境配置管理工具，支持快速切换 Claude/Happy 等服务的 API 环境配置。

## 功能特性

- 🎯 **交互式环境选择** - 清晰的菜单界面，快速选择环境
- 🔐 **环境变量管理** - 自动设置 `ANTHROPIC_BASE_URL` 和 `ANTHROPIC_AUTH_TOKEN`
- 🚀 **命令执行** - 选择环境后自动执行您的命令
- 📝 **简洁配置** - JSON 配置文件，易于管理
- 🔒 **安全显示** - Token 仅显示前后缀，保护敏感信息

## 安装

### 方式 1: 使用 alias（推荐）

在 `~/.zshrc` 中添加：

```bash
alias ccs='node /Users/ofeiss/zshrc/ccs-cli/bin/ccs.js'
```

然后重新加载配置：

```bash
source ~/.zshrc
```

### 方式 2: 添加到 PATH

```bash
ln -s /Users/ofeiss/zshrc/ccs-cli/bin/ccs.js /usr/local/bin/ccs
```

## 配置

### 1. 创建配置文件

复制示例配置文件：

```bash
cd /Users/ofeiss/zshrc/ccs-cli
cp config.json.example config.json
```

### 2. 编辑配置文件

编辑 `config.json`，添加您的环境：

```json
{
  "accounts": [
    {
      "name": "我的环境1",
      "url": "https://api.example.com",
      "token": "your-token-here"
    },
    {
      "name": "我的环境2",
      "url": "https://api.example2.com",
      "token": "another-token-here"
    }
  ]
}
```

### 3. 设置默认环境变量（可选）

在 `~/.zshrc` 中设置默认配置：

```bash
export ANTHROPIC_BASE_URL="https://api.default.com"
export ANTHROPIC_AUTH_TOKEN="default-token"
```

如果设置了默认环境变量，菜单中会显示 "default" 选项。

## 使用方法

### 基本用法

```bash
ccs <command> [args...]
```

### 示例

启动 Claude Code：

```bash
ccs claude -c --dangerously-skip-permissions
```

启动 Happy：

```bash
ccs happy --help
```

执行任意命令：

```bash
ccs node --version
ccs python script.py
```

### 与 zsh 函数集成

您可以在 `~/.zshrc` 中创建快捷函数：

```bash
# 使用 ccs 管理环境的 Claude Code 启动函数
ccx() { ccs claude -c --dangerously-skip-permissions; }
nccx() { ccs claude --dangerously-skip-permissions; }

# 使用 ccs 管理环境的 Happy 启动函数
hpx() { ccs happy -c --dangerously-skip-permissions; }
nhpx() { ccs happy --dangerously-skip-permissions; }
```

## 工作流程

1. 运行 `ccs <command>`
2. 显示环境选择菜单
3. 使用上下键选择环境，回车确认
4. 自动设置环境变量并执行您的命令

## 环境选择菜单

```
? 请选择环境: (Use arrow keys)
❯ 我的环境1
  我的环境2
  我的环境3
  default - 12345678...4321 - https://api.default.com
```

- 普通环境：只显示名称
- default：显示 token 前后缀和 URL（从环境变量读取）

## 注意事项

- `config.json` 包含敏感信息，已添加到 `.gitignore`
- Token 在执行时会显示前 8 位和后 4 位
- 如果未设置默认环境变量，选择 "default" 将提示错误

## 开发

### 项目结构

```
ccs-cli/
├── bin/
│   └── ccs.js              # CLI 入口
├── src/
│   ├── config-loader.js    # 配置加载
│   ├── menu.js            # 交互式菜单
│   └── launcher.js        # 命令启动器
├── config.json            # 环境配置（敏感）
├── config.json.example    # 配置示例
└── package.json
```

### 依赖

- Node.js
- inquirer@^8.2.6 - 交互式命令行界面

## 许可证

MIT
