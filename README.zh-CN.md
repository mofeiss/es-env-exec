# ESE - Environment Switch Execute

**[English](README.md) | 简体中文**

[![npm version](https://img.shields.io/npm/v/es-env-exec.svg)](https://www.npmjs.com/package/es-env-exec)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## ⚠️ 重要声明

**本项目为个人项目，不接受合作开发。**

- ✅ **欢迎 Fork/Clone** - 随意改造和分发
- ✅ **欢迎提 Issue** - 报告 bug 或提需求建议
- ❌ **不接受 Pull Request** - 所有 PR 将被关闭
- ⚠️ **可能随时强制推送** - 本地仓库可能随时 `git push --force` 覆盖远程仓库

**如果你 fork 了本项目并做了改动，建议不要基于原仓库同步更新，避免冲突。**

---

**通用环境变量管理器和命令执行器。**

快速在多个环境配置之间切换，并使用选定的环境变量执行命令。完美适用于管理 API 端点、认证令牌以及任何环境相关的配置。

## ✨ 功能特性

- 🚀 **即时环境切换** - 通过交互式菜单从多个预配置环境中选择
- 🔐 **安全变量管理** - 安全存储和管理环境变量（令牌在显示时会被掩码）
- 🎯 **通用兼容性** - 适用于任何使用环境变量的 CLI 工具或程序
- 📝 **简单 JSON 配置** - 易于编辑的配置文件
- 🎨 **双界面模式**:
  - **快速启动** (`es <command>`) - 一步选择环境并执行
  - **管理模式** (`es`) - 功能完整的环境配置管理器
- 💾 **持久化配置** - 将环境应用到 `.zshrc` 以持久使用

## 📦 安装

### 通过 npm 全局安装

```bash
npm install -g es-env-exec
```

安装后会提供 `es` 全局命令。

### 从源码安装

```bash
git clone https://github.com/mofeiss/es-env-exec.git
cd es-env-exec
npm install
npm link
```

## 🚀 快速开始

### 1. 配置文件

首次运行时，`~/.es.json` 会自动创建，包含空配置。

你可以手动编辑 `~/.es.json`：

```json
{
  "env": [
    {
      "name": "production",
      "env": {
        "API_BASE_URL": "https://api.production.com",
        "API_TOKEN": "prod-token-here"
      }
    },
    {
      "name": "staging",
      "env": {
        "API_BASE_URL": "https://api.staging.com",
        "API_TOKEN": "staging-token-here"
      }
    }
  ]
}
```

或使用管理模式（运行 `es` 不带参数）交互式添加环境。

### 2. 带环境选择启动

```bash
# 选择环境并运行命令
es curl https://api.example.com/data

# 选择环境并运行 Claude Code
es claude -c

# 选择环境并运行任意命令
es node script.js
es python app.py
es your-command --args
```

### 3. 使用管理模式

```bash
# 启动完整管理界面
es
```

管理界面提供：
- 🔄 开关环境启用/停用
- ➕ 添加新环境
- ❌ 删除环境
- ✏️ 编辑配置（终端/GUI）
- 📌 应用环境到 `.zshrc`（持久化）
- 🔃 重新加载配置

## 📖 使用方法

### 快速启动模式

带环境选择执行命令：

```bash
es <command> [args...]
```

**示例：**

```bash
# API 测试
es curl -X GET https://api.example.com/users

# 开发工具
es npm run dev
es yarn build

# 带环境变量的 CLI 工具
es claude -c --dangerously-skip-permissions
es happy --help

# 脚本
es node server.js
es python train_model.py
```

### 管理模式

启动交互式管理界面：

```bash
es
```

**管理界面：**

```
⚙ ENVIRONMENT CONFIGURATION MANAGER ⚙

APPLIED ENVIRONMENT:
 - NAME production
 - API_BASE_URL="https://api.production.com"
 - API_TOKEN="prod-...here"

> AVAILABLE ENVIRONMENTS:
> Select environment: (Use arrow keys)
> [✔] production
  [✔] staging
  [✘] development

PREVIEWED ENVIRONMENT:
 - API_BASE_URL="https://api.production.com"
 - API_TOKEN="prod-...here"

[⎵]TOGGLE  [D]DEL  [A]ADD  [E]EDIT  [G]GUI  [R]RELOAD  [⏎]APPLY  [Q]QUIT
```

**快捷键：**
- `↑/↓` - 浏览环境
- `空格` - 开关环境启用/停用
- `回车` - 应用环境到 `.zshrc`（持久化）
- `A` - 添加新环境
- `D` - 删除选中的环境
- `E` - 在终端编辑器中编辑配置
- `G` - 在 GUI 编辑器中编辑配置
- `R` - 重新加载配置
- `Q` - 退出

### 默认环境（可选）

你可以在 shell 中设置默认环境：

```bash
# 在 ~/.zshrc 中
export API_BASE_URL="https://api.default.com"
export API_TOKEN="default-token"
```

设置后，环境选择菜单中会出现 "default" 选项。

## 🔧 配置

### 配置文件位置

配置文件：`~/.es.json`（在你的用户目录）

此文件在首次运行时自动创建，包含空配置。

### 配置结构

```json
{
  "env": [
    {
      "name": "环境名称",
      "env": {
        "变量名_1": "值1",
        "变量名_2": "值2"
      },
      "disable": 0  // 可选：1 为停用，0 或省略为启用
    }
  ]
}
```

**示例 - Claude Code 环境：**

```json
{
  "env": [
    {
      "name": "claude-official",
      "env": {
        "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
        "ANTHROPIC_AUTH_TOKEN": "sk-ant-xxx"
      }
    },
    {
      "name": "claude-proxy",
      "env": {
        "ANTHROPIC_BASE_URL": "https://proxy.example.com",
        "ANTHROPIC_AUTH_TOKEN": "your-proxy-token"
      }
    }
  ]
}
```

**示例 - 多个 API 服务：**

```json
{
  "env": [
    {
      "name": "aws-production",
      "env": {
        "AWS_ACCESS_KEY_ID": "AKIA...",
        "AWS_SECRET_ACCESS_KEY": "xxx",
        "AWS_REGION": "us-east-1"
      }
    },
    {
      "name": "openai-gpt4",
      "env": {
        "OPENAI_API_KEY": "sk-xxx",
        "OPENAI_MODEL": "gpt-4"
      }
    }
  ]
}
```

## 💡 使用场景

### 1. API 开发与测试

在不同的 API 端点和认证令牌之间切换：

```bash
es curl -X POST https://api.example.com/users -d '{"name":"test"}'
```

### 2. 多账号 CLI 工具

管理 Claude Code、AWS、GCP 等服务的多个账号：

```bash
es claude -c
es aws s3 ls
es gcloud projects list
```

### 3. 开发环境

在 dev/staging/production 配置之间切换：

```bash
es npm run deploy
es docker-compose up
```

### 4. 脚本执行

使用不同环境配置运行脚本：

```bash
es python data_pipeline.py
es node migrate_database.js
```

## 🛠️ 高级用法

### Shell 集成

在 `~/.zshrc` 中添加便捷别名：

```bash
# 超短别名
alias e='es'           # 比 'es' 还短

# 项目特定快捷方式
alias prod='es --env production'
alias stage='es --env staging'

# 工具特定组合
cc() { es claude -c --dangerously-skip-permissions; }
api() { es curl "$@"; }
```

### 持久化环境

将环境应用到 `.zshrc` 以持久使用：

1. 运行 `es` 启动管理模式
2. 选择你想要的环境
3. 按 `回车` 应用
4. 运行 `source ~/.zshrc` 激活

已应用的环境会在管理界面中标记。

## 📁 项目结构

```
es-env-exec/
├── bin/
│   └── es.js              # CLI 入口
├── src/
│   ├── config-loader.js   # 配置管理
│   ├── menu.js            # 交互式环境选择器
│   ├── launcher.js        # 命令执行器
│   └── management.js      # 管理界面
├── .es.json.example       # 配置模板
├── package.json
└── README.md

用户配置：
~/.es.json                 # 你的环境（自动创建）
```

## 🔒 安全性

- **配置文件 (`~/.es.json`) 存储在你的用户目录**
- 令牌和密钥在 UI 中会被掩码（仅显示前 5 位和后 5 位）
- 环境变量仅在命令执行期间设置
- 持久化环境（通过 `.zshrc`）需要手动激活

## 🤝 贡献

**本项目不接受 Pull Request。**

但欢迎：
- 🐛 提交 Issue 报告 bug
- 💡 提交 Issue 提出功能建议
- 🔀 Fork 本项目并自行改造
- 📦 基于本项目创建衍生版本

## 📝 许可证

MIT © [mofeiss](https://github.com/mofeiss)

## 🐛 问题反馈

发现 bug 或有功能需求？请在 [GitHub](https://github.com/mofeiss/es-env-exec/issues) 上提交 Issue。

## 📮 链接

- [npm 包](https://www.npmjs.com/package/es-env-exec)
- [GitHub 仓库](https://github.com/mofeiss/es-env-exec)
- [更新日志](https://github.com/mofeiss/es-env-exec/releases)

---

**Made with ❤️ by [mofeiss](https://github.com/mofeiss)**
