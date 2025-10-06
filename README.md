# ESE - Environment Switch Execute

**English | [简体中文](README.zh-CN.md)**

[![npm version](https://img.shields.io/npm/v/es-env-exec.svg)](https://www.npmjs.com/package/es-env-exec)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## ⚠️ Important Notice

**This is a personal project and does NOT accept collaborative development.**

- ✅ **Feel free to Fork/Clone** - Modify and distribute as you wish
- ✅ **Feel free to submit Issues** - Report bugs or suggest features
- ❌ **NO Pull Requests accepted** - All PRs will be closed
- ⚠️ **May force push anytime** - Local repository may `git push --force` to overwrite remote at any time

**If you fork this project and make changes, DO NOT sync with the original repository to avoid conflicts.**

---

**Universal environment variable manager and command executor.**

Quickly switch between multiple environment configurations and execute commands with the selected environment variables. Perfect for managing API endpoints, authentication tokens, and any environment-specific settings.

## ✨ Features

- 🚀 **Instant Environment Switching** - Select from multiple pre-configured environments with an interactive menu
- 🔐 **Secure Variable Management** - Store and manage environment variables safely (tokens are masked in display)
- 🎯 **Universal Compatibility** - Works with any CLI tool or program that uses environment variables
- 📝 **Simple JSON Configuration** - Easy-to-edit configuration file
- 🎨 **Two Interface Modes**:
  - **Quick Launch** (`es <command>`) - Select environment and execute in one step
  - **Management Mode** (`es`) - Full-featured environment configuration manager
- 💾 **Persistent Configuration** - Apply environment to `.zshrc` for persistent use
- 🔍 **Environment Inspector** - `envs` command to quickly check both runtime (temporary) and applied (global) environments
- 🧠 **Smart History** - Automatically remembers your last environment choice per directory/command

## 📦 Installation

### Install globally via npm

```bash
npm install -g es-env-exec
```

After installation, the `es` and `envs` commands will be available globally.

### Install from source

```bash
git clone https://github.com/mofeiss/es-env-exec.git
cd es-env-exec
npm install
npm link
```

## 🔎 Quick Environment Check

Use the `envs` command to quickly check your current environment variables:

```bash
envs
```

**What you'll see depends on how you launched your application:**

### Scenario 1: Direct execution (using global environment)

When you run a command directly, `envs` shows only the global environment from `~/.zshrc`:

```bash
$ claude
# Inside Claude Code:
> envs
APPLIED ENVIRONMENT (Global):
 - NAME production
 - ANTHROPIC_BASE_URL="https://api.anthropic.com"
 - ANTHROPIC_AUTH_TOKEN="sk-an...xxx"
```

### Scenario 2: Launched via `es` command (temporary environment)

When you use `es` to launch with a specific environment, `envs` shows both:

```bash
$ es claude
# Select "staging" environment
# Inside Claude Code:
> envs
RUNTIME ENVIRONMENT (Temporary):
 - NAME staging
 - ANTHROPIC_BASE_URL="https://api.staging.com"
 - ANTHROPIC_AUTH_TOKEN="sk-st...yyy"

APPLIED ENVIRONMENT (Global):
 - NAME production
 - ANTHROPIC_BASE_URL="https://api.anthropic.com"
 - ANTHROPIC_AUTH_TOKEN="sk-an...xxx"

COMMAND HISTORY (Current Directory):
 - claude → staging
 - ncc → production
 - npm → development
```

**This helps you:**
- ✅ Verify which environment is currently active
- ✅ Confirm temporary environment overrides
- ✅ Compare runtime vs global settings
- ✅ View command history for the current directory
- ✅ Debug environment variable issues

## 🧠 Smart History

ESE automatically remembers which environment you used for each command in each directory.

**How it works:**

When you run `es <command>` and select an environment, ESE saves this choice to `~/.config/es/history.json`. The next time you run the same command in the same directory, the cursor will automatically position to your last selection.

**Example workflow:**

```bash
# First time in ~/myproject
$ es claude
> Select environment: (cursor on 'default')
  > default
    production
    staging

# You select 'staging'
# ESE remembers: ~/myproject + claude → staging

# Next time in ~/myproject
$ es claude
> Select environment: (cursor automatically on 'staging')
    default
  > staging    # ← Cursor here!
    production
```

**Smart behavior:**
- ✅ Remembers per directory + command combination
- ✅ Selecting `default` clears the history for that command
- ✅ Auto-cleanup when environment is deleted
- ✅ No history tracking for management mode (`es` without arguments)

## 🚀 Quick Start

### 1. Configuration file

On first run, `~/.es.json` will be automatically created with an empty configuration.

You can manually edit `~/.es.json`:

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

Or use the management mode (`es` without arguments) to add environments interactively.

### 2. Launch with environment selection

```bash
# Select environment and run your command
es curl https://api.example.com/data

# Select environment and run Claude Code
es claude -c

# Select environment and run any command
es node script.js
es python app.py
es your-command --args
```

### 3. Use Management Mode

```bash
# Launch full management interface
es
```

The management interface provides:
- 🔄 Toggle environments on/off
- ➕ Add new environments
- ❌ Delete environments
- ✏️ Edit configuration (terminal/GUI)
- 📌 Apply environment to `.zshrc` (persistent)
- 🔃 Reload configuration

## 📖 Usage

### Quick Launch Mode

Execute commands with environment selection:

```bash
es <command> [args...]
```

**Examples:**

```bash
# API testing
es curl -X GET https://api.example.com/users

# Development tools
es npm run dev
es yarn build

# CLI tools with environment variables
es claude -c --dangerously-skip-permissions
es happy --help

# Scripts
es node server.js
es python train_model.py
```

### Management Mode

Launch the interactive management interface:

```bash
es
```

**Management Interface:**

```
ENVIRONMENT CONFIGURATION MANAGER

> SELECT GLOBAL ENVIRONMENTS: (Use arrow keys)

 - NAME production
 - API_BASE_URL="https://api.production.com"
 - API_TOKEN="prod-...here"

> [✔] production (GLOBAL)
  [✔] staging
  [✘] development

[⎵]TOGGLE  [D]DEL  [A]ADD  [E]EDIT  [G]GUI  [R]RELOAD  [⏎]APPLY  [Q]QUIT
```

**Keyboard Shortcuts:**
- `↑/↓` - Navigate environments
- `Space` - Toggle environment on/off
- `Enter` - Apply environment to `.zshrc` (persistent)
- `A` - Add new environment
- `D` - Delete selected environment
- `E` - Edit config in terminal editor
- `G` - Edit config in GUI editor
- `R` - Reload configuration
- `Q` - Quit

### Default Environment (Optional)

You can set a default environment in your shell:

```bash
# In ~/.zshrc
export API_BASE_URL="https://api.default.com"
export API_TOKEN="default-token"
```

When set, a "default" option will appear in the environment selection menu.

## 🔧 Configuration

### Configuration File Location

Configuration file: `~/.es.json` (in your home directory)

This file is automatically created on first run with an empty configuration.

### Configuration Structure

```json
{
  "env": [
    {
      "name": "environment-name",
      "env": {
        "VARIABLE_NAME_1": "value1",
        "VARIABLE_NAME_2": "value2"
      },
      "disable": 0  // Optional: 1 to disable, 0 or omit to enable
    }
  ]
}
```

**Example - Claude Code environments:**

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

**Example - Multiple API services:**

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

## 💡 Use Cases

### 1. API Development & Testing

Switch between different API endpoints and authentication tokens:

```bash
es curl -X POST https://api.example.com/users -d '{"name":"test"}'
```

### 2. Multi-Account CLI Tools

Manage multiple accounts for services like Claude Code, AWS, GCP, etc:

```bash
es claude -c
es aws s3 ls
es gcloud projects list
```

### 3. Development Environments

Switch between dev/staging/production configurations:

```bash
es npm run deploy
es docker-compose up
```

### 4. Script Execution

Run scripts with different environment configurations:

```bash
es python data_pipeline.py
es node migrate_database.js
```

## 🛠️ Advanced Usage

### Shell Integration

Add convenient aliases in your `~/.zshrc`:

```bash
# Ultra-short aliases
alias e='es'           # Even shorter than 'es'

# Project-specific shortcuts
alias prod='es --env production'
alias stage='es --env staging'

# Tool-specific combinations
cc() { es claude -c --dangerously-skip-permissions; }
api() { es curl "$@"; }
```

### Persistent Environment

Apply an environment to your `.zshrc` for persistent use:

1. Run `es` to launch management mode
2. Select the environment you want
3. Press `Enter` to apply
4. Run `source ~/.zshrc` to activate

The applied environment will be marked in the management interface.

## 📁 Project Structure

```
es-env-exec/
├── bin/
│   ├── es.js              # CLI entry point
│   └── envs.js            # Environment inspector
├── src/
│   ├── config-loader.js   # Configuration management
│   ├── menu.js            # Interactive environment selector
│   ├── launcher.js        # Command executor
│   ├── management.js      # Management interface
│   └── history.js         # History tracking
├── .es.json.example       # Configuration template
├── package.json
└── README.md

User configuration:
~/.es.json                 # Your environments (auto-created)
~/.config/es/history.json  # Command history (auto-created)
```

## 🔒 Security

- **Configuration file (`~/.es.json`) is stored in your home directory**
- Tokens and secrets are masked in the UI (showing only first 5 and last 5 characters)
- Environment variables are only set for the duration of command execution
- Persistent environments (via `.zshrc`) require manual activation

## 🤝 Contributing

**This project does NOT accept Pull Requests.**

However, you are welcome to:
- 🐛 Submit Issues to report bugs
- 💡 Submit Issues to suggest features
- 🔀 Fork this project and modify it yourself
- 📦 Create derivative works based on this project

## 📝 License

MIT © [mofeiss](https://github.com/mofeiss)

## 🐛 Issues

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/mofeiss/es-env-exec/issues).

## 📮 Links

- [npm package](https://www.npmjs.com/package/es-env-exec)
- [GitHub repository](https://github.com/mofeiss/es-env-exec)
- [Changelog](https://github.com/mofeiss/es-env-exec/blob/main/CHANGELOG.md)

---

**Made with ❤️ by [mofeiss](https://github.com/mofeiss)**
