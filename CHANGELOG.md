# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-10-03

### Added
- 🆕 **新增 `envs` 命令用于快速查看环境变量**
  - **Added `envs` command for quick environment inspection**
  - 区分显示临时环境变量（通过 `es` 启动的）和全局环境变量（写入 `~/.zshrc` 的）
  - 临时环境变量使用青色高亮显示，全局环境变量使用灰色显示
  - 支持同时显示两种环境变量，方便用户对比确认
  - Distinguishes between runtime (temporary via `es`) and applied (global in `~/.zshrc`) environments
  - Runtime environments shown in cyan, global environments in gray
  - Shows both types simultaneously for easy comparison

- 🧠 **新增历史记录功能，自动记忆上次选择的环境**
  - **Added history feature to remember last selected environment**
  - 在相同目录执行相同命令时，光标自动定位到上次选择的环境
  - 历史记录保存在 `~/.config/es/history.json`
  - 选择 `default` 时自动删除历史记录
  - 环境被删除时自动清理对应的历史记录
  - Cursor automatically positioned to last selected environment when running same command in same directory
  - History saved in `~/.config/es/history.json`
  - Selecting `default` removes history record
  - Auto-cleanup when environment is deleted

- 📝 **新增 `-v` / `--version` 命令显示版本号**
  - **Added `-v` / `--version` command to show version**
  - 快速查看当前安装的版本
  - Quickly check installed version

- 📝 **在 README 中新增环境检查器章节**
  - **Added environment inspector section in README**
  - 用 Claude Code 作为示例详细说明功能
  - Using Claude Code as example to demonstrate features

### Fixed
- 🐛 **修复 `es <command>` 命令界面缺少 APPLIED ENVIRONMENT 显示的问题**
  - **Fixed missing APPLIED ENVIRONMENT display in command mode**
  - 现在主界面和命令界面都会显示当前应用的全局环境变量
  - Both management and command interfaces now show applied global environment

### Technical
- 在 `launcher.js` 中添加 `ESE_RUNTIME_ENV` 环境变量标记
- `envs` 命令通过读取 `ESE_RUNTIME_ENV` 标记识别临时环境变量
- 新增 `bin/envs.js` 作为独立命令入口
- 新增 `src/history.js` 历史记录管理模块
- 在 `package.json` 中注册 `envs` bin 命令
- 修改 `src/menu.js` 添加光标位置记忆功能

## [1.0.0] - 2025-10-02

### Initial Release
- 🚀 环境变量快速切换功能
- 🔐 安全的环境变量管理（令牌自动脱敏显示）
- 🎯 通用 CLI 工具兼容性
- 📝 简单的 JSON 配置文件
- 🎨 双界面模式：快速启动和管理模式
- 💾 持久化配置到 `.zshrc`
- 🔄 环境启用/停用切换
- ➕ 交互式添加环境
- ❌ 删除环境功能
- ✏️ 终端/GUI 编辑器支持
- 🔃 配置热重载

---

[1.0.1]: https://github.com/mofeiss/es-env-exec/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/mofeiss/es-env-exec/releases/tag/v1.0.0
