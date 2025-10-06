# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-10-06

### 改进 (Improved)
- 🧠 **智能脱敏逻辑优化**
  - 优化环境变量显示的脱敏策略，现在只对包含 KEY 或 TOKEN 的变量名进行脱敏处理
  - 避免对 URL 和非敏感变量进行不必要的脱敏
  - 处理 undefined/null 值，提高显示稳定性

- 🎨 **环境变量显示改进**
  - 从硬编码显示 ANTHROPIC 相关变量改为动态显示所有环境变量
  - 保持界面格式一致性，提升用户体验

### 技术细节 (Technical)
- 在 `src/management.js` 和 `src/menu.js` 中优化 `formatValue` 函数
- 添加基于变量名的智能脱敏判断逻辑
- 增强环境变量显示的动态性和兼容性

---

### Improved
- 🧠 **Smart masking logic optimization**
  - Optimized environment variable display masking strategy, now only masking variable names containing KEY or TOKEN
  - Avoided unnecessary masking of URLs and non-sensitive variables
  - Handled undefined/null values for improved display stability

- 🎨 **Environment variable display improvements**
  - Changed from hardcoded ANTHROPIC variable display to dynamic display of all environment variables
  - Maintained interface format consistency for better user experience

### Technical Details
- Optimized `formatValue` function in `src/management.js` and `src/menu.js`
- Added smart masking judgment logic based on variable names
- Enhanced dynamic display and compatibility of environment variables

---

## [1.0.2] - 2025-10-06

### 新增功能 (Added)
- 🆕 **`envs` 命令新增显示当前目录命令历史记录**
  - 显示当前目录下所有已执行命令及其对应的环境选择
  - 格式：`命令 → 环境名称`（例如：`ncc → production`）
  - 帮助用户快速查看目录下的命令历史和环境使用情况

- 💡 **界面新增用户提示信息**
  - ES 管理界面底部添加橙色提示：修改 GLOBAL 后需要重启 shell 或执行 `source ~/.zshrc` 生效
  - ES 临时环境选择界面底部添加橙色提示：按下 ENTER 可立即为当前命令应用所选环境

### 界面改进 (Improved)
- 🎨 **重设计两个界面的布局和颜色方案**
  - **ES 管理界面 (`es`)：**
    - 标题简化为 `ENVIRONMENT CONFIGURATION MANAGER`（移除装饰符号）
    - 移除 `APPLIED ENVIRONMENT` 静态显示板块
    - 环境预览信息移至顶部，直接显示环境变量详情
    - 提示文本改为 `SELECT GLOBAL ENVIRONMENTS:`
    - 当前应用的全局环境项显示 `(GLOBAL)` 标记
    - 优化颜色方案：当前选中项蓝色，GLOBAL 环境黄色，其他项灰色
  - **ES CMD 临时环境选择界面 (`es <command>`)：**
    - 标题改为 `TEMPORARY ENVIRONMENT SELECTOR`
    - 移除 `APPLIED ENVIRONMENT` 板块
    - 环境预览信息移至顶部
    - 提示文本改为 `SELECT TEMPORARY ENVIRONMENT:`
    - 移除 "applied environment" 默认选项，直接列出所有环境
    - 显示 `(GLOBAL)` 和 `(HISTORY)` 标记，清晰标识环境状态
    - 优化颜色方案：当前选中项蓝色，GLOBAL 环境黄色，HISTORY 环境橙色，其他项灰色
    - 添加底部快捷键提示：`[⏎]APPLY  [Q]QUIT`
    - 支持 Q 键和 ESC 键快速退出

### 修复 (Fixed)
- 🐛 **修复清屏和命令提示符问题**
  - 优化界面渲染，避免残留输出

### 技术细节 (Technical)
- 在 `src/management.js` 中重构界面渲染逻辑
- 在 `src/menu.js` 中重构界面渲染逻辑和按键处理
- 添加新的颜色常量：`GRAY`（灰色）、`YELLOW`（黄色）、`ORANGE`（橙色）
- 为 `CustomListPrompt` 添加按键监听功能，支持 Q 键退出

---

### Added Features
- 🆕 **`envs` command now shows command history for current directory**
  - Displays all executed commands and their environment selections in current directory
  - Format: `command → environment_name` (e.g., `ncc → production`)
  - Helps users quickly review command history and environment usage

- 💡 **Added user tips to interfaces**
  - ES management interface: Orange tip at bottom reminding to restart shell or run `source ~/.zshrc` after modifying GLOBAL
  - ES temporary environment selector: Orange tip at bottom reminding to press ENTER to apply selected environment to current command

### Improved
- 🎨 **Redesigned layout and color scheme for both interfaces**
  - **ES Management Interface (`es`):**
    - Simplified title to `ENVIRONMENT CONFIGURATION MANAGER` (removed decorative symbols)
    - Removed `APPLIED ENVIRONMENT` static display section
    - Moved environment preview to top, directly showing variable details
    - Changed prompt text to `SELECT GLOBAL ENVIRONMENTS:`
    - Currently applied global environment shows `(GLOBAL)` tag
    - Optimized colors: current selection in cyan, GLOBAL in yellow, others in gray
  - **ES CMD Temporary Environment Selection (`es <command>`):**
    - Changed title to `TEMPORARY ENVIRONMENT SELECTOR`
    - Removed `APPLIED ENVIRONMENT` section
    - Moved environment preview to top
    - Changed prompt text to `SELECT TEMPORARY ENVIRONMENT:`
    - Removed "applied environment" default option, directly listing all environments
    - Shows `(GLOBAL)` and `(HISTORY)` tags for clear environment status
    - Optimized colors: current selection in cyan, GLOBAL in yellow, HISTORY in orange, others in gray
    - Added shortcut hints at bottom: `[⏎]APPLY  [Q]QUIT`
    - Support Q key and ESC key for quick exit

### Fixed
- 🐛 **Fixed screen clearing and prompt issues**
  - Optimized interface rendering to avoid residual output

### Technical Details
- Refactored interface rendering logic in `src/management.js`
- Refactored interface rendering logic and keypress handling in `src/menu.js`
- Added new color constants: `GRAY`, `YELLOW`, `ORANGE`
- Added keypress listener to `CustomListPrompt` for Q key exit support

## [1.0.1] - 2025-10-03

### 新增功能 (Added)
- 🆕 **新增 `envs` 命令用于快速查看环境变量**
  - 区分显示临时环境变量（通过 `es` 启动的）和全局环境变量（写入 `~/.zshrc` 的）
  - 临时环境变量使用青色高亮显示，全局环境变量使用灰色显示
  - 支持同时显示两种环境变量，方便用户对比确认

- 🧠 **新增历史记录功能，自动记忆上次选择的环境**
  - 在相同目录执行相同命令时，光标自动定位到上次选择的环境
  - 历史记录保存在 `~/.config/es/history.json`
  - 选择 `default` 时自动删除历史记录
  - 环境被删除时自动清理对应的历史记录

- 📝 **新增 `-v` / `--version` 命令显示版本号**
  - 快速查看当前安装的版本

- 📝 **在 README 中新增环境检查器章节**
  - 用 Claude Code 作为示例详细说明功能

### 修复 (Fixed)
- 🐛 **修复 `es <command>` 命令界面缺少 APPLIED ENVIRONMENT 显示的问题**
  - 现在主界面和命令界面都会显示当前应用的全局环境变量

### 技术细节 (Technical)
- 在 `launcher.js` 中添加 `ESE_RUNTIME_ENV` 环境变量标记
- `envs` 命令通过读取 `ESE_RUNTIME_ENV` 标记识别临时环境变量
- 新增 `bin/envs.js` 作为独立命令入口
- 新增 `src/history.js` 历史记录管理模块
- 在 `package.json` 中注册 `envs` bin 命令
- 修改 `src/menu.js` 添加光标位置记忆功能

---

### Added Features
- 🆕 **Added `envs` command for quick environment inspection**
  - Distinguishes between runtime (temporary via `es`) and applied (global in `~/.zshrc`) environments
  - Runtime environments shown in cyan, global environments in gray
  - Shows both types simultaneously for easy comparison

- 🧠 **Added history feature to remember last selected environment**
  - Cursor automatically positioned to last selected environment when running same command in same directory
  - History saved in `~/.config/es/history.json`
  - Selecting `default` removes history record
  - Auto-cleanup when environment is deleted

- 📝 **Added `-v` / `--version` command to show version**
  - Quickly check installed version

- 📝 **Added environment inspector section in README**
  - Using Claude Code as example to demonstrate features

### Fixed
- 🐛 **Fixed missing APPLIED ENVIRONMENT display in command mode**
  - Both management and command interfaces now show applied global environment

### Technical Details
- Added `ESE_RUNTIME_ENV` environment variable marker in `launcher.js`
- `envs` command reads `ESE_RUNTIME_ENV` marker to identify runtime environment
- Added `bin/envs.js` as standalone command entry
- Added `src/history.js` history management module
- Registered `envs` bin command in `package.json`
- Modified `src/menu.js` to add cursor position memory

## [1.0.0] - 2025-10-02

### 初始版本 (Initial Release)
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

### Initial Release
- 🚀 Fast environment variable switching
- 🔐 Secure variable management (tokens auto-masked in display)
- 🎯 Universal CLI tool compatibility
- 📝 Simple JSON configuration file
- 🎨 Dual interface modes: Quick launch and management mode
- 💾 Persistent configuration to `.zshrc`
- 🔄 Environment enable/disable toggle
- ➕ Interactive environment addition
- ❌ Delete environment functionality
- ✏️ Terminal/GUI editor support
- 🔃 Configuration hot reload

---

[1.0.3]: https://github.com/mofeiss/es-env-exec/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/mofeiss/es-env-exec/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/mofeiss/es-env-exec/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/mofeiss/es-env-exec/releases/tag/v1.0.0
