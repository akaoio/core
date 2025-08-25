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
   
   cat tmp/teams/STATUS.md
   
   ls -la tmp/teams/
   
   cat tmp/teams/BLOCKERS.md
   
   ```

2. **Your Workspace**:
   
   - Work ONLY in tmp/teams/{your-team-id}-{timestamp}/
   
   - NEVER modify files outside your workspace except projects/
   
   - ALL temporary work goes in your workspace
   

3. **Coordination Protocol**:
   
   - Update status every 5 actions
   
   - Log all decisions with reasons
   
   - Check for conflicts before claiming work
   

#### Activation Triggers
When user says any of these, activate the appropriate team:

- **"làm việc"** → Analyze context, activate best team

- **"fix / sửa"** → Activate core-fix team

- **"tích hợp"** → Activate integration team

- **"tính năng"** → Activate feature-dev team


#### Standardized "work" Command
When the user says "work" or "làm việc", ALL agents follow this protocol:
1. **Auto-detect context** and activate the best-matching team
2. **Initialize agent session** with conflict resolution
3. **Generate dashboard** immediately 
4. **Check SYSTEM-DASHBOARD.md** before starting work
5. **Update every 3 actions** with dedicated agent files

```bash
# Standard work command protocol
echo "🚀 Activating agent based on context..."
cat SYSTEM-DASHBOARD.md 2>/dev/null || node teams/generate-dashboard.cjs
echo "📊 Dashboard checked - beginning work session"
```

#### Team Roles

- **coordinator**: Analyze, plan, allocate tasks

- **fixer**: Fix bugs and test failures

- **integrator**: Cross-package compatibility

- **architect**: Design solutions

- **developer**: Implement features

- **tester**: Verify quality


## Project Overview

**@akaoio/core** is a workspace orchestrator that manages multiple independent repositories 
as a unified development environment. It does NOT contain source code - it clones and 
orchestrates other repositories.


**Key Concept**: Multi-repository workspace with individual repository independence

## Architecture Pattern

### Repository Structure
```
@akaoio/core/                    # Workspace Orchestrator
├── package.json                 # Workspace configuration  
├── scripts/                     # Orchestration scripts
├── config/repos.json           # Repository definitions
├── projects/                   # Cloned repositories (gitignored)
│   ├── composer/               # Atomic documentation engine
│   ├── battle/                 # Universal terminal testing framework
│   ├── builder/                # TypeScript build framework
│   └── air/                    # Distributed P2P database
└── [orchestration files]
```

### Core Technologies Managed

0. **@akaoio/composer** - Atomic documentation engine

1. **@akaoio/battle** - Universal terminal testing framework

2. **@akaoio/builder** - TypeScript build framework

3. **@akaoio/air** - Distributed P2P database


## 🏗️ UNIVERSAL BUILD ARCHITECTURE PRINCIPLES

### Critical Universal Rules (ALL Workspace Projects)

0. **NEVER edit built artifacts**: Never edit .js, .cjs, .mjs files across ANY project in the workspace - they are built artifacts
   - **Applies to**: ALL managed repositories (composer, battle, builder, air, tui, ui)
   - **Impact**: Changes will be overwritten on next build, causing confusion and lost work
   
   


1. **Source-first development**: Always edit .ts, .tsx, .jsx files (source files) in ALL managed repositories
   - **Applies to**: ALL TypeScript/JavaScript projects in the workspace
   
   - **Rationale**: Source files are the single source of truth for all logic and functionality
   


2. **Build-first testing**: After editing source files, always rebuild before testing built artifacts
   - **Applies to**: ALL projects with build processes
   
   
   - **Workflow**: Edit source → Build → Test → Commit



### Workspace-Wide Policy
**This rule applies to all repositories managed by the orchestrator**:

#### Managed Projects Build Systems

- **composer**: TypeScript → JavaScript
  - Source: `.ts`{{#unless @last}}, {{/unless}}`.tsx`{{#unless @last}}, {{/unless}}
  - Built: `.js`{{#unless @last}}, {{/unless}}`.cjs`{{#unless @last}}, {{/unless}}`.mjs`{{#unless @last}}, {{/unless}}

- **battle**: TypeScript → JavaScript
  - Source: `.ts`{{#unless @last}}, {{/unless}}`.tsx`{{#unless @last}}, {{/unless}}
  - Built: `.js`{{#unless @last}}, {{/unless}}`.cjs`{{#unless @last}}, {{/unless}}`.mjs`{{#unless @last}}, {{/unless}}

- **builder**: TypeScript → JavaScript
  - Source: `.ts`{{#unless @last}}, {{/unless}}`.tsx`{{#unless @last}}, {{/unless}}
  - Built: `.js`{{#unless @last}}, {{/unless}}`.cjs`{{#unless @last}}, {{/unless}}`.mjs`{{#unless @last}}, {{/unless}}

- **air**: TypeScript → JavaScript
  - Source: `.ts`{{#unless @last}}, {{/unless}}`.tsx`{{#unless @last}}, {{/unless}}
  - Built: `.js`{{#unless @last}}, {{/unless}}`.cjs`{{#unless @last}}, {{/unless}}`.mjs`{{#unless @last}}, {{/unless}}

- **tui**: TypeScript → JavaScript
  - Source: `.ts`{{#unless @last}}, {{/unless}}`.tsx`{{#unless @last}}, {{/unless}}
  - Built: `.js`{{#unless @last}}, {{/unless}}`.cjs`{{#unless @last}}, {{/unless}}`.mjs`{{#unless @last}}, {{/unless}}

- **ui**: TypeScript → JavaScript
  - Source: `.ts`{{#unless @last}}, {{/unless}}`.tsx`{{#unless @last}}, {{/unless}}
  - Built: `.js`{{#unless @last}}, {{/unless}}`.cjs`{{#unless @last}}, {{/unless}}`.mjs`{{#unless @last}}, {{/unless}}


### Development Workflow Requirements

0. **Identify file type before editing** (CRITICAL)
   - Check file extension - if .js/.cjs/.mjs, find corresponding .ts source file

1. **Edit source files only** (REQUIRED)
   - Make all changes in .ts/.tsx/.jsx files

2. **Build immediately after editing** (REQUIRED)
   - Run build command for the project (npm run build, tsc, etc.)

3. **Test built artifacts** (VERIFICATION)
   - Test the built .js files, not the source .ts files


### ⚠️ Critical Warnings

- **CRITICAL**: Editing built artifacts will cause loss of work
  - Built files are regenerated from source files during build process

- **WORKSPACE_INTEGRITY**: Inconsistent edits across projects cause integration failures
  - All projects must follow same source-first development pattern

- **AI_ASSISTANT**: AI assistants working with ANY project need to understand this fundamental rule
  - Failure to follow this rule leads to confusion and broken development workflow


### File Identification Guide
**Built Artifacts** (NEVER EDIT):

- Files in dist/ directories

- Files with .js extension when .ts equivalent exists

- Generated header comments (e.g., 'Generated by TypeScript')

- Minified or transpiled code patterns


**Source Files** (ALWAYS EDIT):

- TypeScript syntax and typing

- Import statements using .ts extensions

- Raw, unprocessed code

- Located in src/ directories


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

## Best Practices for AI Assistants

### 🚨 CRITICAL: Build Architecture Compliance
1. **NEVER edit built artifacts** - Only edit source files (.ts, .tsx, .jsx)
2. **Identify file types first** - Check extension before making any edits
3. **Build after source changes** - Always rebuild before testing
4. **This applies to ALL managed projects** - composer, battle, builder, air, tui, ui

### When Working with This Codebase
1. **Understand the multi-repo pattern** - Don't expect source code here
2. **Use orchestration scripts** - Don't manually clone repos
3. **Respect the build order** - Dependencies matter
4. **Check status before changes** - Use `npm run status`
5. **Follow build architecture rules** - See Universal Build Architecture section above

### When Making Changes
1. **Verify file type first** - Source (.ts) vs Built (.js) artifacts
2. **Edit source files only** - Never touch .js/.cjs/.mjs files
3. **Build immediately after editing** - Ensure artifacts are updated
4. **Test changes in workspace** before suggesting
5. **Consider cross-project impact** of modifications  
6. **Update documentation** when changing workflows
7. **Verify security** - no sensitive data exposure

---

**Important for AI Assistants**: This is a workspace orchestrator, not a traditional codebase. Focus on repository management, build coordination, and development workflow rather than application logic.

The power is in the unified development experience across independent repositories.

---
*Generated:  using @akaoio/composer*