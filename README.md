# @akaoio/core

**AKAO.IO Core Technologies Workspace**

A workspace orchestrator for all @akaoio core technologies. This repository doesn't contain source code - it clones and manages the individual technology repositories as a unified development environment.

## Quick Start

```bash
# Clone the workspace orchestrator
git clone https://github.com/akaoio/core.git
cd core

# Setup: Clone all core tech repos and build them
npm run setup

# That's it! You now have a complete development environment.
```

## What This Gives You

After running `npm run setup`, you'll have:

```
core/
├── projects/
│   ├── composer/    # Atomic documentation engine
│   ├── battle/      # Universal terminal testing framework  
│   ├── builder/     # TypeScript build framework
│   ├── air/         # Distributed P2P database
│   ├── tui/         # Terminal UI framework
│   └── ui/          # Web Components framework
└── [workspace configuration files]
```

- **Full workspace development** with `workspace:*` dependencies
- **Instant cross-project testing** without publishing
- **Unified build and test commands**
- **Coordinated version management**

## Core Technologies

| Technology | Description | Repository |
|------------|-------------|------------|
| **composer** | Atomic document composition engine | [akaoio/composer](https://github.com/akaoio/composer) |
| **battle** | Universal terminal testing framework | [akaoio/battle](https://github.com/akaoio/battle) |
| **builder** | TypeScript build framework | [akaoio/builder](https://github.com/akaoio/builder) |
| **air** | Distributed P2P database | [akaoio/air](https://github.com/akaoio/air) |

## Commands

### Setup & Management
```bash
npm run setup     # Clone all repos, install deps, build everything
npm run update    # Pull latest changes from all repos
npm run clean     # Clean all build artifacts
npm run status    # Show status of all repositories
npm run sync      # Sync with ~/Projects directory (auto-detect changes)
npm run sync:watch # Start continuous sync with file system watcher
```

### Development
```bash
npm run build     # Build all projects in dependency order
npm run test      # Run all test suites
npm run dev       # Setup + build (development mode)
```

### Publishing
```bash
npm run publish   # Coordinate publishing of all updated packages
```

## Development Workflow

### Initial Setup
1. Clone this workspace: `git clone https://github.com/akaoio/core.git`
2. Run setup: `npm run setup`
3. Start developing!

### Daily Development
```bash
# Update all repositories to latest
npm run update

# Make changes in any project
cd projects/battle/
# edit files...
npm run build

# Test changes in another project immediately
cd ../composer/
npm test  # Uses latest battle via workspace:*

# Build and test everything
cd ../..
npm run build
npm test
```

### Cross-Project Fixes
1. Edit source in `projects/{tech}/`
2. Build that project: `npm run build` (in project dir)
3. Test immediately in other projects - no publishing needed!
4. Commit when ready: git workflows work normally

### Publishing Updates
```bash
# When ready to publish to npm
npm run publish   # Coordinates version bumps and publishing
```

## Architecture

### Repository Management
- Individual repositories remain independent
- Each can be developed/published separately  
- Workspace provides unified development environment
- No source code duplication

### Dependency Management
- `workspace:*` dependencies for cross-project references
- Automatic resolution to local versions during development
- Proper version resolution when published to npm

### Build Order
Projects build in dependency order:
1. **builder** (no dependencies)
2. **battle** (uses builder)
3. **composer** (uses battle + builder) 
4. **air** (uses battle)

### Security
- Sensitive files are git-ignored
- No API keys or secrets in this repository
- Each project manages its own secrets
- `.env` files are excluded

## Configuration

### Repository Configuration (`config/repos.json`)
Defines which repositories to clone, their dependencies, and build order.

### Workspace Configuration  
Standard npm workspaces in `package.json`:
```json
{
  "workspaces": [
    "projects/*"
  ]
}
```

## Benefits

### For Development
- **Instant feedback**: Cross-project changes work immediately
- **No publish cycle**: Test fixes without npm publish
- **Unified commands**: Build/test everything with single commands
- **Dependency clarity**: See exact dependency relationships

### For CI/CD
- **Reproducible builds**: Exact version control
- **Coordinated releases**: Publish related changes together
- **Full test coverage**: Test all integrations before release

### For Users
- **Individual packages**: Users still get clean, focused packages
- **Stable releases**: Coordinated testing ensures compatibility
- **Clear dependencies**: Published packages have proper version constraints

## Comparison to Monorepo

| Aspect | @akaoio/core (Multi-repo + Workspace) | Traditional Monorepo |
|--------|---------------------------------------|---------------------|
| **Source control** | Individual repositories | Single repository |
| **Independence** | Full independence | Coupled |
| **Publishing** | Individual or coordinated | Usually coordinated |
| **Discovery** | Each repo discoverable | Single repo only |
| **Development** | Unified via workspace | Unified |
| **CI/CD** | Per-repo + coordinated | Single pipeline |

## Troubleshooting

### Setup Issues
```bash
# If setup fails, try manual steps:
rm -rf projects/
npm run setup

# For specific project:
git clone https://github.com/akaoio/composer.git projects/composer
```

### Build Issues
```bash
# Clean rebuild everything:
npm run clean
npm run build

# Build specific project:
cd projects/composer/
npm run build
```

### Dependency Issues
```bash
# Reinstall all dependencies:
rm -rf node_modules/ projects/*/node_modules/
npm install
```

## Contributing

1. **Individual repositories**: Contribute to specific technologies in their repos
2. **Workspace improvements**: Contribute workspace orchestration improvements here
3. **Issues**: Report integration issues here, specific issues in individual repos

## License

MIT - Individual projects may have different licenses, check their repositories.

---

**Ready to build the future of development tools?**

```bash
git clone https://github.com/akaoio/core.git
cd core
npm run setup
```

*You'll have the complete AKAO.IO development environment in minutes.*