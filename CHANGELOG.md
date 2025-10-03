# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-10-03

### Added
- 🆕 新增 `envs` 命令用于快速查看环境变量
  - 区分显示临时环境变量（通过 `es` 启动的）和全局环境变量（写入 `~/.zshrc` 的）
  - 临时环境变量使用青色高亮显示，全局环境变量使用灰色显示
  - 支持同时显示两种环境变量，方便用户对比确认
- 📝 在 README 中新增环境检查器章节，用 Claude Code 作为示例详细说明功能

### Fixed
- 🐛 修复 `es <command>` 命令界面缺少 APPLIED ENVIRONMENT 显示的问题
  - 现在主界面和命令界面都会显示当前应用的全局环境变量

### Technical
- 在 `launcher.js` 中添加 `ESE_RUNTIME_ENV` 环境变量标记
- `envs` 命令通过读取 `ESE_RUNTIME_ENV` 标记识别临时环境变量
- 新增 `bin/envs.js` 作为独立命令入口
- 在 `package.json` 中注册 `envs` bin 命令

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
