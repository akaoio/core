# CLAUDE.md - @akaoio/core

This file provides guidance to Claude Code (claude.ai/code) when working with the @akaoio/core workspace orchestrator.

## 🚨 CRITICAL: UI/UX PRINCIPLE - NO HARDCODED DECORATIONS

### ABSOLUTE UI/UX RULE - NO EXCEPTIONS

**"NO HARDCODED DECORATIONS (like =====================) BECAUSE ON SMALL SCREEN DEVICES THEY ARE BROKEN AND VERY UGLY"**

**🛑 RULE 0: NO HARDCODED DECORATIVE ELEMENTS**
- **NEVER use hardcoded separator lines** (=====================)
- **NEVER use fixed-width ASCII borders** (--------------------)
- **NEVER use fixed character counts** for visual elements
- **ALL decorations MUST be responsive** and adapt to screen size

**✅ CORRECT ALTERNATIVES:**
- Terminal: Use `tput cols` for dynamic width detection
- Web: Use CSS flexible layouts and semantic elements
- Documentation: Use markdown native separators (`---`)
- CLI: Calculate proportional decorations based on viewport

**📱 CRITICAL IMPACT:**
- Small terminal windows become unusable with hardcoded decorations
- Mobile web interfaces break with fixed-width elements
- Responsive design principles are fundamental to modern UX

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

## 📚 STORIES SYSTEM - KNOWLEDGE MANAGEMENT PROTOCOL

### CRITICAL: Collective Knowledge Storage System
**"WE NEED TO STORE OUR STORIES IN 'stories' FOLDER. EACH STORY IS A TOPIC ABOUT SOMETHING THAT I AND @agent-meta TALK! WE MUST KEEP THEM TIDY AND NOT DUPLICATED."**

#### Stories System Architecture
- **Location**: `/home/x/core/stories/` directory
- **Purpose**: Capture visions, principles, and system knowledge from conversations
- **Format**: Markdown files with clear topic-based naming
- **Organization**: One story per topic/theme, no duplication allowed

#### All 34 Agents Must Be Story-Aware
- **Meta Agent Primary Responsibility**: Story creation, organization, and management
- **All Agents Can Reference**: Stories provide context for decisions and development
- **Update Over Duplicate**: Always update existing stories rather than creating new ones
- **Conversation Integration**: Every discussion with meta agent updates or creates stories

#### Story Management Protocol
1. **Check existing stories** before creating new ones
2. **Use descriptive kebab-case naming**: `ssl-security-principle.md`
3. **Update stories** when new insights emerge from conversations
4. **Reference stories** in decision-making processes
5. **Keep stories organized** and maintain system knowledge continuity

#### Story Categories and Examples
- **Principles**: `ssl-security-principle.md`, `root-cause-fixing-principle.md`, `no-hardcoded-decorations-principle.md`
- **Architecture**: `multi-agent-system-architecture.md`, `air-based-living-agents.md`
- **Conversations**: `stories-system-implementation.md`, `documentation-fixes-discussion.md`
- **Visions**: `system-evolution-roadmap.md`, `agent-coordination-future.md`

**Integration**: Stories inform all development decisions and provide system-wide context for all 34 agents.

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

## 🚨 SECURITY AND INTEGRITY ENFORCEMENT PROTOCOL

### ABSOLUTE SSL SECURITY RULE - NO EXCEPTIONS
**NEVER CREATE ANY SELF-SIGNED SSL KEYS**

This is a fundamental, non-negotiable security principle for the entire @akaoio/core multi-agent system:

- **ALL 34 agents must follow this rule** across all teams (meta, core-fix, integration, feature-dev, security, project teams)
- **ALL projects must comply** (access, air, battle, builder, composer, tui, ui)
- **Use Let's Encrypt ONLY** for SSL certificates
- **Use proper Certificate Authority (CA) signed certificates** in all environments
- **NO development shortcuts** with self-signed certificates
- **NO temporary exceptions** - this rule has NO EXCEPTIONS

#### Required SSL Implementation
```bash
# CORRECT: Use Let's Encrypt
certbot certonly --nginx -d domain.com

# CORRECT: Use proper CA certificates  
curl --cert ca-signed-cert.pem --key private-key.pem https://api.example.com
```

#### Prohibited SSL Practices
```bash
# NEVER: Self-signed certificate creation
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# NEVER: Bypass SSL verification
curl -k https://example.com
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
```

**Air Project Critical**: The Air P2P network requires CA-signed certificates for all peer connections - NO EXCEPTIONS.

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

## 🎯 ROOT CAUSE FIXING PRINCIPLE - ABSOLUTE DEVELOPMENT LAW

### CRITICAL DEVELOPMENT RULE - NO EXCEPTIONS
**"FIX THE ROOT CAUSE IN THE SOURCE CODE, NOT THE SYMPTOMS IN GENERATED FILES."**

This is the foundational development principle that ALL 34 agents across ALL teams must follow:

**DETAILED PRINCIPLE:**
- ✅ ALWAYS fix from the ROOT CAUSE
- ✅ ALWAYS fix at the SOURCE CODE level  
- ❌ NEVER fix at surface level without addressing root cause
- ❌ NEVER fix generated files instead of source files

#### Universal Application
- **ALL teams**: meta, core-fix, integration, feature-dev, security, project teams
- **ALL projects**: access, air, battle, builder, composer, tui, ui
- **ALL fixes**: bugs, features, configurations, documentation, security issues

#### Root Cause Analysis Protocol
Before ANY fix, agents must:
1. **Identify the symptom**: What appears broken
2. **Trace to root cause**: What actually caused the problem
3. **Fix at source level**: Address the underlying issue
4. **Verify systematic solution**: Ensure problem cannot recur

#### Anti-Patterns (IMMEDIATELY REJECT)
- ❌ Editing generated files instead of source files
- ❌ Manual patches instead of systematic fixes  
- ❌ Workarounds that ignore root causes
- ❌ Quick fixes that mask underlying problems
- ❌ Symptom treatment instead of disease cure
- ❌ Surface-level corrections without source analysis

#### Source-Level Fix Examples
```bash
# ✅ CORRECT: Fix template source
# Problem: Generated agent files have errors
# Solution: Fix teams/templates/agent-composer.hbs (source)
# NOT: Edit individual agent files (generated artifacts)

# ✅ CORRECT: Fix configuration source  
# Problem: Package name duplication in documentation
# Solution: Fix YAML atoms in teams/components/
# NOT: Manually edit README files

# ✅ CORRECT: Fix TypeScript source
# Problem: Runtime errors in built JavaScript
# Solution: Fix .ts source files and rebuild
# NOT: Edit .js built artifacts
```

#### Integration with Build Architecture
This principle reinforces existing workspace rules:
- **Never edit built artifacts** → Fix source files instead
- **Source-first development** → Root cause analysis traces to source
- **Zero technical debt** → Systematic solutions prevent accumulation
- **Living agent system** → Share root cause knowledge across network

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

0. **WORKSPACE CLEANLINESS**: NEVER create trash files in project roots - ALL temporary work goes to tmp/
   - **Applies to**: ALL projects in the workspace and all agents
   - **Impact**: Workspace pollution prevents scalable development
   
   


1. **NEVER edit built artifacts**: Never edit .js, .cjs, .mjs files across ANY project in the workspace - they are built artifacts
   - **Applies to**: ALL managed repositories (composer, battle, builder, air, tui, ui)
   - **Impact**: Changes will be overwritten on next build, causing confusion and lost work
   
   


2. **NEVER create versioned or temporary files**: NEVER create or edit files with patterns: v1, v2, v3, simple, fixed, new, temp, old, backup, copy
   - **Applies to**: ALL files across ALL managed repositories
   - **Impact**: Creates tech debt, confusion, and architecture drift
   
   


3. **Source-first development**: Always edit .ts, .tsx, .jsx files (source files) in ALL managed repositories
   - **Applies to**: ALL TypeScript/JavaScript projects in the workspace
   
   - **Rationale**: Source files are the single source of truth for all logic and functionality
   


4. **Build-first testing**: After editing source files, always rebuild before testing built artifacts
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