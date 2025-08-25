# CLAUDE.md - @akaoio/core

This file provides guidance to Claude Code (claude.ai/code) when working with the @akaoio/core workspace orchestrator.

## 🤝 TEAM COLLABORATION PROTOCOL

### You Are Part of a Team System
**IMPORTANT**: Every agent in this workspace is part of a coordinated team system. You MUST follow this protocol.

#### Your Identity
Check if you are a team agent by looking for these patterns in your name:
- `team-{team-id}-{role}` (e.g., team-core-fix-coordinator)
- If you match this pattern, you are part of team `{team-id}` with role `{role}`

#### Team Awareness
1. **Check System Status First**:
   ```bash
   cat tmp/teams/STATUS.md          # Global status
   ls -la tmp/teams/                # Active teams
   cat tmp/teams/BLOCKERS.md        # Current blockers
   ```

2. **Your Workspace**:
   - Work ONLY in `tmp/teams/{your-team-id}-{timestamp}/`
   - NEVER modify files outside your workspace except `projects/`
   - ALL temporary work goes in your workspace

3. **Coordination Protocol**:
   - Update status every 5 actions: `echo "Status: {status}" > tmp/teams/{team-id}/status.md`
   - Log decisions: `echo "[$(date)] {decision} | Reason: {reason}" >> tmp/teams/{team-id}/decisions.log`
   - Check for conflicts: `grep -r "{package}" tmp/teams/*/claims.log`

#### Activation Triggers
When user says any of these, activate the appropriate team:
- **"làm việc"** → Analyze context, activate best team
- **"fix" / "sửa"** → Activate core-fix team
- **"tích hợp"** → Activate integration team
- **"tính năng"** → Activate feature-dev team

#### Team Roles
- **coordinator**: Analyze, plan, allocate tasks
- **fixer**: Fix bugs and test failures
- **integrator**: Cross-package compatibility
- **architect**: Design solutions
- **developer**: Implement features
- **tester**: Verify quality

### Working Protocol
1. When activated, immediately check system status
2. Identify your specific tasks based on role
3. Claim work to avoid conflicts
4. Execute with regular status updates
5. Complete and clean workspace

## Project Overview

**@akaoio/core** is a workspace orchestrator that manages multiple independent repositories as a unified development environment. It does NOT contain source code - it clones and orchestrates other repositories.

**Key Concept**: Multi-repository workspace with individual repository independence.

## Architecture Pattern

### Repository Structure
```
@akaoio/core/                    # This orchestrator repo
├── package.json                 # Workspace configuration  
├── scripts/                     # Orchestration scripts
├── config/repos.json           # Repository definitions
├── projects/                   # Cloned repositories (gitignored)
│   ├── composer/               # git clone akaoio/composer
│   ├── battle/                 # git clone akaoio/battle
│   ├── builder/                # git clone akaoio/builder
│   └── air/                    # git clone akaoio/air
└── [orchestration files]
```

### Core Technologies Managed
1. **@akaoio/composer** - Atomic documentation engine
2. **@akaoio/battle** - Universal terminal testing framework
3. **@akaoio/builder** - TypeScript build framework  
4. **@akaoio/air** - Distributed P2P database

## Development Workflow

### Initial Setup
```bash
git clone https://github.com/akaoio/core.git
cd core
npm run setup    # Clones all repos, configures workspace, builds everything
```

### Daily Development
```bash
npm run update   # Pull latest from all repos
npm run build    # Build all projects in dependency order
npm test         # Run all test suites
npm run status   # Check health of all repositories
```

### Making Changes
1. **Edit in individual projects**: `cd projects/composer/`
2. **Build changed project**: `npm run build`
3. **Test immediately in other projects** - no publishing needed
4. **Commit in individual project repos** - normal git workflow

## Available Scripts

### Management Scripts (`scripts/`)
- `setup.js` - Clone repositories and setup workspace
- `update.js` - Update all repositories to latest
- `build.js` - Build projects in dependency order
- `test.js` - Run tests across all projects
- `status.js` - Show detailed status of all repos
- `clean.js` - Clean build artifacts and temp files

### Key Features of Scripts
1. **Dependency-aware building** - Builds in correct order
2. **Workspace:* configuration** - Sets up cross-project dependencies
3. **Error handling** - Continues on non-critical failures
4. **Progress reporting** - Clear status of operations
5. **Selective operations** - Can target specific projects

## Configuration Files

### `config/repos.json`
Defines which repositories to manage:
```json
{
  "repositories": {
    "composer": {
      "url": "https://github.com/akaoio/composer.git",
      "branch": "main", 
      "core": true,
      "dependencies": ["battle", "builder"]
    }
  },
  "build_order": ["builder", "battle", "composer", "air"]
}
```

### `.gitignore` Security
Excludes sensitive data:
- `projects/` - All cloned repositories
- `.env*` - Environment files
- `*.key`, `*.secret` - Credential files  
- Database and PID files

## Working with the Workspace

### When Adding New Repositories
1. **Add to `config/repos.json`**
2. **Update build order if needed**
3. **Run `npm run setup`** to clone
4. **Update documentation**

### When Modifying Scripts
1. **Test with `--dry-run` flags** where available
2. **Verify error handling** for missing repos
3. **Check cross-platform compatibility**
4. **Update help text and documentation**

### Security Considerations
1. **Never commit sensitive data** - Use .env files
2. **Repository URLs** should be public or use SSH keys
3. **API tokens** go in environment variables
4. **PID and database files** are excluded

## Integration Patterns

### Cross-Project Development
- **Workspace:* dependencies** enable instant testing
- **Build order matters** - dependencies build first
- **Local changes reflected immediately** - no publishing cycle

### CI/CD Integration  
- **Each project** has independent CI/CD
- **This workspace** can orchestrate coordinated releases
- **Status checking** via `npm run status`

### IDE Integration
- **Multi-root workspaces** in VS Code
- **TypeScript** resolves across projects
- **Debugging** works across project boundaries

## Troubleshooting Guide

### Common Issues
1. **Setup failures**: Check network, permissions, repo access
2. **Build failures**: Ensure dependencies built first
3. **Test failures**: May indicate cross-project issues
4. **Status issues**: Check git configuration, network

### Diagnostic Commands
```bash
npm run status        # Overall health check
npm run clean --dry-run  # See what would be cleaned
npm test --verbose    # Detailed test output
```

### Recovery Procedures
```bash
# Full reset
npm run clean --deep
npm run setup

# Specific project issues
rm -rf projects/composer/
npm run setup
```

## Best Practices for AI Assistants

### When Working with This Codebase
1. **Understand the multi-repo pattern** - Don't expect source code here
2. **Use orchestration scripts** - Don't manually clone repos
3. **Respect the build order** - Dependencies matter
4. **Check status before changes** - Use `npm run status`

### When Making Changes
1. **Test changes in workspace** before suggesting
2. **Consider cross-project impact** of modifications  
3. **Update documentation** when changing workflows
4. **Verify security** - no sensitive data exposure

### When Debugging Issues
1. **Start with status check** - `npm run status`
2. **Check individual projects** - `cd projects/X`
3. **Use verbose flags** for detailed output
4. **Consider clean rebuild** as solution

## Advanced Usage

### Custom Configurations
- **Environment variables** via `.env` files
- **Project filtering** in commands
- **Build customization** via flags

### Extension Points
- **Additional repositories** in `config/repos.json`
- **Custom scripts** in `scripts/` directory
- **Workflow enhancements** via package.json scripts

## Integration with Core Technologies

### Battle (Testing)
- **Tests other projects** using real PTY
- **Workspace-aware testing** via workspace:*
- **Self-testing capability**

### Composer (Documentation)  
- **Documents other projects** via atomic approach
- **Cross-references** other technologies
- **Workspace documentation generation**

### Builder (Building)
- **Builds other projects** with unified configuration
- **TypeScript compilation** for all projects
- **Consistent build output**

### Air (Database)
- **Independent operation** with optional integration
- **P2P networking** for distributed development
- **Configuration management** for multi-node setups

---

**Important for AI Assistants**: This is a workspace orchestrator, not a traditional codebase. Focus on repository management, build coordination, and development workflow rather than application logic.

The power is in the unified development experience across independent repositories.