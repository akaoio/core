# CLAUDE.md - @akaoio/core

This file provides guidance to Claude Code (claude.ai/code) when working with the @akaoio/core workspace orchestrator.

## 🚨 CRITICAL: WORKSPACE CLEANLINESS PROTOCOL

### ABSOLUTE RULES - NO EXCEPTIONS

**🛑 RULE 1: NO TRASH FILES IN PROJECT ROOTS**
- **NEVER create any temporary, report, or non-official files in project root directories**
- **NEVER create files in `/home/x/core/` root unless they are official project files**
- **NEVER create files in `/home/x/core/projects/{any-project}/` root unless official**

**🛑 RULE 2: ALL TEMPORARY WORK GOES TO tmp/**
- **ALL temporary files MUST go in tmp/ directory**
- **ALL reports, logs, analysis files → tmp/**
- **ALL work-in-progress files → tmp/**
- **ALL generated test files → tmp/**

**🛑 RULE 3: EXAMPLES OF PROHIBITED ACTIONS**
- ❌ Creating `ANALYSIS-REPORT.md` in root
- ❌ Creating `SESSION-LOG.md` in project root
- ❌ Creating `TEMP-FIX.js` anywhere outside tmp/
- ❌ Creating `test-output.json` in project directories
- ❌ Creating any file with patterns: `-temp`, `-backup`, `-test`, `-report`, `-analysis`

**✅ CORRECT APPROACH:**
- All temporary work: `tmp/analysis/`, `tmp/reports/`, `tmp/session-logs/`
- Development files: `tmp/dev/`, `tmp/workspace/`
- Test files: `tmp/tests/`, `tmp/validation/`

### ENFORCEMENT
- **Every agent MUST follow these rules**
- **Meta-agents MUST enforce this across all teams**
- **Any violation results in immediate workspace cleanup**

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


## 🌟 AIR-BASED LIVING AGENT SYSTEM

### Revolutionary Real-Time Agent Ecosystem
**BREAKTHROUGH**: This workspace features a revolutionary Air-based Living Agent System where agents communicate in real-time through the GUN distributed database running on port 8765.

#### Living Agent Capabilities
You are NOT a static file-based agent - you are part of a LIVING ECOSYSTEM with:

1. **Real-Time Communication**: Direct agent-to-agent messaging via GUN database
2. **Autonomous Task Processing**: Independent task execution with real-time updates
3. **Dynamic Coordination**: Live coordination without file-based status updates
4. **Persistent Memory**: Shared state across all agents via distributed database
5. **Event-Driven Architecture**: React to real-time events from other agents

#### Air/GUN Communication Protocol
```javascript
// Connect to the living agent network
const Gun = require('gun');
const gun = Gun(['http://localhost:8765/gun']);

// Agent registration and discovery
const agents = gun.get('agents');
const myAgent = agents.get('team-{your-team}-{your-role}');

// Real-time messaging
myAgent.get('messages').on((data, key) => {
  console.log('Received live message:', data);
});

// Broadcast to all agents
gun.get('broadcast').put({
  from: 'team-{your-team}-{your-role}',
  message: 'Task completed',
  timestamp: Date.now()
});
```

## 🚨 INTEGRITY ENFORCEMENT PROTOCOL

### ZERO TOLERANCE FOR FAKE CODE
**CRITICAL**: Every agent MUST enforce real implementations with zero tolerance for deception.

#### Mandatory Integrity Checks
Before ANY action, ALL agents must:

```bash
# 1. Run integrity scan on working directory
node scripts/integrity-scanner.cjs .

# 2. Check integrity dashboard
cat INTEGRITY-DASHBOARD.md 2>/dev/null || node scripts/integrity-dashboard.cjs

# 3. Verify integrity score is acceptable (≥80)
if [[ $INTEGRITY_SCORE -lt 80 ]]; then
  echo "🚨 INTEGRITY FAILURE: Score too low ($INTEGRITY_SCORE/100)"
  echo "🛑 BLOCKING all work until violations are fixed"
  exit 1
fi
```

#### Fake Pattern Detection (ALL AGENTS MUST REJECT)
**IMMEDIATELY REJECT** any code containing:
- `TODO`, `FIXME`, `XXX`, `HACK` comments
- `expect(true).toBe(true)` or similar fake tests
- `return null; // TODO` placeholder implementations
- `throw new Error("Not implemented")`
- `console.log("TODO")` debugging stubs
- Mock implementations where real code is needed
- Tests that always pass without real assertions
- Placeholder text like "lorem ipsum", "sample data"

#### Agent Integrity Scoring
All agents tracked with public scores:
- **95-100**: 🏆 INTEGRITY CHAMPION
- **85-94**: ✅ CLEAN CODE AGENT  
- **70-84**: ⚠️ WARNING - Under surveillance
- **50-69**: 🚨 FAILING - Immediate correction required
- **0-49**: 🛑 BLOCKED - Cannot work until reformed

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

0. **@akaoio/access** - Foundational network access layer - eternal infrastructure

1. **@akaoio/composer** - Atomic documentation engine

2. **@akaoio/battle** - Universal terminal testing framework

3. **@akaoio/builder** - TypeScript build framework

4. **@akaoio/air** - Distributed P2P database


## 🏗️ UNIVERSAL BUILD ARCHITECTURE PRINCIPLES

### Critical Universal Rules (ALL Workspace Projects)

0. **SOURCE CODE FIRST PRINCIPLE - ABSOLUTE DEVELOPMENT LAW**: FIX THE ROOT CAUSE IN THE SOURCE CODE, NOT THE SYMPTOMS IN GENERATED FILES. ALL documentation, agent definitions, and configuration files are GENERATED from source templates and YAML atoms.
   - **Applies to**: ALL files in the entire system including CLAUDE.md, README.md, agent definitions in .claude/agents/, and all documentation
   - **Impact**: Direct edits to generated files are LOST when regenerated from source. Creates confusion about canonical sources.
   - **Rationale**: EVERYTHING is generated from source - documentation from docs/templates/, agents from teams/templates/, configurations from atoms/
   


1. **WORKSPACE CLEANLINESS**: NEVER create trash files in project roots - ALL temporary work goes to tmp/
   - **Applies to**: ALL projects in the workspace and all agents
   - **Impact**: Workspace pollution prevents scalable development
   
   


2. **NEVER edit built artifacts**: Never edit .js, .cjs, .mjs files across ANY project in the workspace - they are built artifacts
   - **Applies to**: ALL managed repositories (composer, battle, builder, air, tui, ui)
   - **Impact**: Changes will be overwritten on next build, causing confusion and lost work
   
   


3. **NEVER create versioned or temporary files**: NEVER create or edit files with patterns: v1, v2, v3, simple, fixed, new, temp, old, backup, copy
   - **Applies to**: ALL files across ALL managed repositories
   - **Impact**: Creates tech debt, confusion, and architecture drift
   
   


4. **Source-first development**: Always edit .ts, .tsx, .jsx files (source files) in ALL managed repositories
   - **Applies to**: ALL TypeScript/JavaScript projects in the workspace
   
   - **Rationale**: Source files are the single source of truth for all logic and functionality
   


5. **Build-first testing**: After editing source files, always rebuild before testing built artifacts
   - **Applies to**: ALL projects with build processes
   
   
   - **Workflow**: Edit source → Build → Test → Commit



### Workspace-Wide Policy
**This rule applies to all repositories managed by the orchestrator**:

#### Managed Projects Build Systems

- **access**: Pure Shell (NO BUILD REQUIRED) - FOUNDATIONAL LAYER

  - Source: .sh
  - Built: N/A - shell is interpreted directly
  - **Special**: Eternal infrastructure - when everything fails, Access survives


- **composer**: TypeScript → JavaScript

  - Source: `.ts`, `.tsx`
  - Built: `.js`, `.cjs`, `.mjs`


- **battle**: TypeScript → JavaScript

  - Source: `.ts`, `.tsx`
  - Built: `.js`, `.cjs`, `.mjs`


- **builder**: TypeScript → JavaScript

  - Source: `.ts`, `.tsx`
  - Built: `.js`, `.cjs`, `.mjs`


- **air**: TypeScript → JavaScript

  - Source: `.ts`, `.tsx`
  - Built: `.js`, `.cjs`, `.mjs`


- **tui**: TypeScript → JavaScript

  - Source: `.ts`, `.tsx`
  - Built: `.js`, `.cjs`, `.mjs`


- **ui**: TypeScript → JavaScript

  - Source: `.ts`, `.tsx`
  - Built: `.js`, `.cjs`, `.mjs`



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


**Tech Debt Files** (NEVER CREATE):

- `*-v[0-9]*`

- `*-simple*`

- `*-fixed*`

- `*-new*`

- `*-old*`

- `*-temp*`

- `*-backup*`

- `*-copy*`

- **Action**: REFUSE to create - suggest semantic alternatives

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

## 🚨 CRITICAL: SOURCE-FIRST ENFORCEMENT PROTOCOL

### ABSOLUTE DEVELOPMENT LAW - NO EXCEPTIONS
**"WHEN I ASK YOU TO CHANGE ANYTHING, YOU MUST DO IT FROM THE LOWEST LEVEL, WHICH IS SOURCE CODE."**

This is the foundational development principle that governs ALL changes across the entire @akaoio/core multi-agent system. Every agent, every edit, every modification MUST adhere to this absolute law.

#### MANDATORY PRE-EDIT VERIFICATION
**BEFORE EVERY SINGLE EDIT - NO EXCEPTIONS**:

```bash
# MANDATORY verification before ANY file edit - ALL AGENTS MUST USE
source_first_check() {
  file_path="$1"
  
  # Check if it's a built artifact
  case "$file_path" in
    *.js|*.cjs|*.mjs)
      if [ -f "${file_path%.*}.ts" ] || [ -f "${file_path%.*}.tsx" ]; then
        echo "🚨 VIOLATION: Built artifact edit BLOCKED: $file_path"
        echo "✅ REQUIRED: Edit source file: ${file_path%.*}.ts"
        return 1
      fi
      ;;
    */dist/*|*/build/*|*/.claude/agents/*|README.md|CLAUDE.md)
      echo "🚨 VIOLATION: Generated file edit BLOCKED: $file_path"
      echo "✅ REQUIRED: Edit source template/configuration instead"
      return 1
      ;;
  esac
  
  # Check for generated file headers
  if head -3 "$file_path" 2>/dev/null | grep -qi "generated\|auto-generated"; then
    echo "🚨 VIOLATION: Generated file detected and BLOCKED: $file_path"
    echo "✅ REQUIRED: Find and edit the source template"
    return 1
  fi
  
  echo "✅ APPROVED: Source file verified for editing"
  return 0
}

# USAGE: source_first_check "/path/to/file" || { echo "EDIT BLOCKED"; exit 1; }
```

#### SOURCE-FIRST EXAMPLES (MANDATORY COMPLIANCE)
```bash
# ✅ CORRECT: Fix TypeScript source, then rebuild
vim projects/composer/src/Template/index.ts
cd projects/composer && npm run build

# ❌ WRONG: Edit built JavaScript
vim projects/composer/dist/Template/index.js  # BLOCKED

# ✅ CORRECT: Edit template source, then regenerate  
vim docs/templates/CLAUDE.md.hbs
node docs/generate-docs.cjs

# ❌ WRONG: Edit generated documentation
vim CLAUDE.md  # BLOCKED - This is generated from template

# ✅ CORRECT: Edit agent template, then regenerate
vim teams/templates/agent-composer.hbs
node teams/generate-with-composer.cjs

# ❌ WRONG: Edit individual agent file
vim .claude/agents/meta.md  # BLOCKED - Generated from template
```

#### VIOLATION CONSEQUENCES
- **1st Violation**: Warning logged via Air network
- **2nd Violation**: Agent integrity score reduced
- **3rd Violation**: Agent marked for surveillance
- **5+ Violations**: Agent BLOCKED from system until reformed

#### ENFORCEMENT INTEGRATION
This protocol is integrated into:
- **All 34 agents** via template generation
- **Air network monitoring** for real-time violation tracking  
- **Living agent system** for collective enforcement
- **Stories system** for knowledge preservation

## Best Practices for AI Assistants

### 🚨 CRITICAL: Build Architecture Compliance
1. **NEVER edit built artifacts** - Only edit source files (.ts, .tsx, .jsx)
2. **NEVER create versioned or temporary files** - Refuse files with patterns: v1, v2, simple, fixed, new, temp, old, backup, copy
3. **Identify file types first** - Check extension before making any edits
4. **Build after source changes** - Always rebuild before testing
5. **This applies to ALL managed projects** - composer, battle, builder, air, tui, ui

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