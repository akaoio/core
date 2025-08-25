# Development Guide - @akaoio/core

This guide covers the development workflow for the @akaoio/core workspace.

## Quick Start

```bash
# Clone and setup
git clone https://github.com/akaoio/core.git
cd core
npm run setup

# Daily development
npm run update    # Pull latest changes
npm run build     # Build all projects
npm test         # Run all tests
```

## Understanding the Architecture

### Multi-Repository Workspace
- **Individual repositories** remain independent on GitHub
- **Workspace orchestration** via this repository
- **Local development** uses `workspace:*` dependencies
- **Publishing** remains independent per project

### Directory Structure After Setup
```
core/
├── projects/
│   ├── composer/    # git clone akaoio/composer
│   ├── battle/      # git clone akaoio/battle  
│   ├── builder/     # git clone akaoio/builder
│   └── air/         # git clone akaoio/air
├── scripts/         # Orchestration scripts
├── config/          # Repository configuration
└── docs/           # Workspace documentation
```

## Development Workflows

### 1. Working on a Single Project

```bash
# Make changes to any project
cd projects/battle/
vim src/Battle/expect.ts

# Build just that project
npm run build

# Test changes in other projects immediately
cd ../composer/
npm test  # Uses local battle via workspace:*

# Changes work? Commit in the project
cd ../battle/
git add . && git commit -m "fix: pattern matching"
git push
```

### 2. Cross-Project Feature Development

```bash
# Scenario: Adding a feature that spans multiple projects

# 1. Work in dependency order (builder → battle → composer)
cd projects/builder/
# Add new build feature
npm run build

cd ../battle/  
# Use new builder feature
npm run build

cd ../composer/
# Use enhanced battle/builder
npm test

# 2. Commit all changes
cd ../builder/
git commit -m "feat: add new build feature"

cd ../battle/
git commit -m "feat: use enhanced builder"

cd ../composer/
git commit -m "feat: leverage battle improvements"
```

### 3. Bug Fixes Across Projects

```bash
# 1. Identify which project has the bug
npm run status  # Shows status of all projects
npm test        # Run all tests to see failures

# 2. Fix in the core project
cd projects/battle/
# Fix the bug
npm run build

# 3. Verify fix in dependent projects
cd ../composer/
npm test  # Should now pass

# 4. Commit fix
cd ../battle/
git commit -m "fix: resolve pattern matching issue"
```

## Available Commands

### Setup & Management
- `npm run setup` - Clone all repos, install dependencies, build everything
- `npm run update` - Pull latest changes from all repositories
- `npm run clean` - Clean build artifacts (add `--deep` for node_modules)
- `npm run status` - Show detailed status of all repositories

### Development
- `npm run build` - Build all projects in dependency order
- `npm run build composer` - Build specific project
- `npm test` - Run all test suites  
- `npm test battle` - Test specific project
- `npm run dev` - Setup + build (for new environments)

### Project-Level Commands
```bash
# Run commands in specific projects
cd projects/composer/
npm run build
npm test
npm run docs:build

# Or from root with filtering
npm run build composer
npm test battle
```

## Configuration Management

### Repository Configuration (`config/repos.json`)

Controls which repositories are cloned and how they're built:

```json
{
  "repositories": {
    "composer": {
      "url": "https://github.com/akaoio/composer.git",
      "branch": "main",
      "directory": "projects/composer", 
      "core": true,
      "dependencies": ["battle", "builder"]
    }
  },
  "build_order": ["builder", "battle", "composer", "air"]
}
```

### Environment Configuration (`.env`)

Copy `.env.example` to `.env` for local customization:

```bash
cp .env.example .env
# Edit .env with your settings
```

## Testing Strategy

### Test Levels
1. **Unit tests** - Within each project
2. **Integration tests** - Cross-project functionality  
3. **Workspace tests** - Full workflow validation

### Running Tests
```bash
npm test              # All projects
npm test composer     # Specific project
npm test --verbose    # Detailed output
npm test --fail-fast  # Stop on first failure
```

### Test Dependencies
Tests use the local versions via `workspace:*`:
- Composer tests use local Battle
- Builder tests use local Battle  
- Air tests use local Battle

## Troubleshooting

### Common Issues

#### 1. Setup Failures
```bash
# Clean setup
rm -rf projects/
npm run setup
```

#### 2. Build Failures  
```bash
# Clean rebuild
npm run clean
npm run build

# Or deep clean
npm run clean --deep
npm run setup
```

#### 3. Dependency Issues
```bash
# Reinstall dependencies
rm -rf node_modules/ projects/*/node_modules/
npm install
```

#### 4. Git Issues in Projects
```bash
# Check status of all repos
npm run status

# Manual git operations
cd projects/composer/
git status
git pull
```

### Getting Help

1. **Check status**: `npm run status`
2. **Clean state**: `npm run clean && npm run setup`
3. **Individual repos**: Each has its own issues/docs
4. **Workspace issues**: Report in this repository

## Best Practices

### Code Changes
1. **Build before testing** - Always build changed projects first
2. **Test cross-project impact** - Changes can affect dependents
3. **Commit atomically** - Each project separately
4. **Follow project conventions** - Each project has its own style

### Git Workflow  
1. **Work in feature branches** - In individual project repos
2. **Pull before push** - Use `npm run update` regularly
3. **Commit message conventions** - Follow individual project styles
4. **PR to individual repos** - Not to this workspace

### Dependency Management
1. **Use workspace:\*** - For cross-project development
2. **Proper versions for publishing** - When releasing to npm
3. **Keep dependencies updated** - Regular `npm run update`
4. **Test before committing** - Ensure nothing breaks

## Advanced Usage

### Custom Build Orders
```bash
# Build specific projects in custom order
npm run build builder battle
```

### Selective Operations
```bash
# Update only core technologies
npm run update composer battle builder air

# Test only specific projects  
npm test composer battle
```

### Integration with IDEs

#### VS Code
1. Open workspace root in VS Code
2. Use multi-root workspaces for better project separation
3. Configure workspace settings for unified experience

#### Other IDEs
1. Most IDEs support multi-project workspaces
2. Configure TypeScript/ESLint to work across projects
3. Set up debugging for cross-project development

## Publishing Workflow

### Individual Project Publishing
Projects can still be published independently:

```bash
cd projects/composer/
npm version patch
npm publish
```

### Coordinated Publishing
For coordinated releases across projects:

```bash
# TODO: Implement coordinated publishing script
npm run publish  
```

## Contributing

### To Individual Projects
1. Fork the individual project repository
2. Make changes in your fork
3. Submit PR to the individual project
4. Maintainers will coordinate workspace updates

### To Workspace Infrastructure
1. Fork this repository
2. Improve scripts, documentation, configuration
3. Submit PR with workspace improvements
4. Focus on developer experience enhancements

---

**Happy developing with @akaoio/core!** 🚀

The workspace gives you the power of a monorepo with the flexibility of independent repositories.