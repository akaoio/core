# @akaoio/core

> Workspace orchestrator for the AKAO.io ecosystem

[![Version](https://img.shields.io/npm/v/@akaoio/core.svg)](https://npmjs.org/package/@akaoio/core)
[![License](https://img.shields.io/npm/l/@akaoio/core.svg)](https://github.com/akaoio/core/blob/main/LICENSE)

## Overview

**@akaoio/core** is a workspace orchestrator that manages multiple independent repositories 
as a unified development environment. It does NOT contain source code - it clones and 
orchestrates other repositories.


## 🚀 Core Technologies


### @akaoio/manager
- **Purpose**: Standardized patterns for installer, updater, service, and system management across all AKAO technologies
- **Description**: Universal POSIX shell framework for system management

### @akaoio/access
- **Purpose**: Pure shell DNS synchronization - when everything fails, Access survives
- **Description**: Foundational network access layer - eternal infrastructure

### @akaoio/gun
- **Purpose**: Powers the Living Agent System communication and real-time coordination with enterprise-grade security
- **Description**: Security-hardened real-time P2P database engine

### @akaoio/composer
- **Purpose**: Generate all documentation from atomic pieces
- **Description**: Atomic documentation engine

### @akaoio/battle
- **Purpose**: Test all projects with real PTY
- **Description**: Universal terminal testing framework

### @akaoio/builder
- **Purpose**: Build all TypeScript projects
- **Description**: TypeScript build framework

### @akaoio/air
- **Purpose**: P2P networking and data distribution
- **Description**: Distributed P2P database

### @akaoio/dashboard
- **Purpose**: Visual interface for monitoring and managing distributed agent systems
- **Description**: Real-time Living Agent Network Dashboard


## 📦 Installation

```bash
# Clone the orchestrator
git clone https://github.com/akaoio/core.git
cd core

# Setup all projects
npm run setup
```

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Clone and setup all repositories |
| `npm run update` | Update all repositories to latest |
| `npm run build` | Build all projects in dependency order |
| `npm test` | Run all test suites |
| `npm run status` | Check status of all repositories |
| `npm run clean` | Clean build artifacts |

### Project Structure

```
core/
├── projects/          # Managed repositories (gitignored)
│   ├── composer/     # Documentation engine
│   ├── battle/       # Testing framework
│   ├── builder/      # Build system
│   └── air/          # P2P database
├── scripts/          # Orchestration scripts
├── config/           # Configuration files
├── .claude/          # AI assistant configuration
│   ├── agents/       # Team agents
│   └── team.config.yaml
└── tmp/              # Temporary files
    └── teams/        # Team workspaces
```

## 🤖 AI Team System

The workspace includes an advanced multi-team agent system for coordinated development and issue resolution. Teams are configured via `.claude/agents/` and activated based on user needs.

## 🔧 Working with Projects

Each project in `projects/` is an independent repository:

1. **Navigate to project**: `cd projects/composer`
2. **Make changes**: Edit files normally
3. **Build**: `npm run build`
4. **Test**: `npm test`
5. **Commit**: Use git in the project directory

Changes are immediately available to other projects via workspace linking.

## 📚 Documentation

All documentation is auto-generated using @akaoio/composer:

- **CLAUDE.md**: AI assistant guidance
- **README.md**: This file
- **Agent definitions**: `.claude/agents/*.md`

To regenerate documentation:
```bash
npx composer build
```

## 🧪 Testing

All projects use @akaoio/battle for testing:

```bash
# Test all projects
npm test

# Test specific project
cd projects/composer && npm test
```

## 🏗️ Building

Projects are built using @akaoio/builder:

```bash
# Build all projects
npm run build

# Build specific project
cd projects/builder && npm run build
```

## 🔐 Security

- All sensitive data in `.env` files (gitignored)
- No credentials in code
- Repository URLs use HTTPS/SSH keys
- Workspace isolation for team agents

## 📄 License

MIT © AKAO Team

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Test changes across all projects
4. Submit a pull request

---

*Generated:  using @akaoio/composer*
*Version: 1.0.0*