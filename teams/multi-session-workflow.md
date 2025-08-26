# Multi-Session Coordination Workflow

## Overview

This document describes the complete workflow for running multiple Claude Code sessions safely using the new session management system. This eliminates export variable conflicts and enables true parallel development.

## 🎯 Problem Solved

### Before (Broken System)
```bash
# Agent 1 Terminal
export TEAM_ID="core-fix"
export WORKSPACE="tmp/teams/core-fix-123"
# Do some work...

# Agent 2 Terminal (SAME ROOT DIRECTORY)
export TEAM_ID="integration"  # ❌ CONFLICTS WITH AGENT 1!
export WORKSPACE="tmp/teams/integration-456"  # ❌ OVERWRITES AGENT 1!

# Result: CHAOS - agents interfere with each other
```

### After (Session-Safe System)
```bash
# Agent 1 Terminal
./teams/session-helper.sh quick coordinator core-fix feature-a
# Session: core-fix-coord-2025-08-25-001
# Worktree: ../worktrees/core-fix-feature-a-001/

# Agent 2 Terminal  
./teams/session-helper.sh quick integrator integration feature-b
# Session: integration-integ-2025-08-25-002
# Worktree: ../worktrees/integration-feature-b-002/

# Result: PERFECT ISOLATION - no conflicts!
```

## 🚀 Quick Start Guide

### 1. Initialize the System

```bash
cd /home/x/core
./teams/session-helper.sh init
```

### 2. Create Your First Session

```bash
# Basic session (current directory)
./teams/session-helper.sh create coordinator core-fix

# Session with git worktree (recommended)
./teams/session-helper.sh quick coordinator core-fix bug-fix-session
```

### 3. Open Claude Code in Worktree

```bash
# Navigate to worktree
cd ../worktrees/core-fix-bug-fix-session-abc123/

# Open Claude Code
claude  # or code . if using Claude Code extension
```

### 4. Multiple Parallel Sessions

```bash
# Terminal 1: Core fixes
./teams/session-helper.sh quick fixer core-fix typescript-errors

# Terminal 2: Feature development  
./teams/session-helper.sh quick developer feature-dev new-api

# Terminal 3: Integration testing
./teams/session-helper.sh quick integrator integration cross-package-tests

# Each gets isolated worktree - no conflicts!
```

## 🏗️ Architecture Overview

```
@akaoio/core/                           # Main repository
├── tmp/sessions/                       # Session management
│   ├── active/                         # Active sessions
│   │   ├── core-fix-coord-....json     # Session state
│   │   └── integration-integ-....json  # Another session
│   ├── archive/                        # Completed sessions
│   └── locks/                          # Resource locks
│
├── ../worktrees/                       # Git worktrees directory
│   ├── core-fix-feature-a-001/         # Isolated worktree 1
│   ├── integration-feature-b-002/      # Isolated worktree 2
│   └── feature-dev-new-api-003/        # Isolated worktree 3
│
└── teams/
    ├── session-manager.js              # Core session logic
    ├── session-helper.sh               # CLI interface
    └── templates/
        └── agent-v2-sessionless.hbs   # Session-safe agents
```

## 🔄 Workflow Patterns

### Pattern 1: Parallel Bug Fixing

```bash
# Multiple developers fixing different bugs simultaneously
./teams/session-helper.sh quick fixer-1 core-fix typescript-compile-error
./teams/session-helper.sh quick fixer-2 core-fix test-failures  
./teams/session-helper.sh quick fixer-3 core-fix dependency-issues

# Each works in isolation:
# - ../worktrees/core-fix-typescript-compile-error-001/
# - ../worktrees/core-fix-test-failures-002/
# - ../worktrees/core-fix-dependency-issues-003/
```

### Pattern 2: Feature Development Pipeline

```bash
# Architecture -> Development -> Testing pipeline
./teams/session-helper.sh quick architect feature-dev api-design
./teams/session-helper.sh quick developer feature-dev api-implementation  
./teams/session-helper.sh quick tester feature-dev api-testing
```

### Pattern 3: Cross-Team Integration

```bash
# Different teams working on related features
./teams/session-helper.sh quick developer feature-dev user-auth
./teams/session-helper.sh quick integrator integration auth-integration
./teams/session-helper.sh quick auditor security auth-security-review
```

## 🛠️ Session Management Commands

### Core Commands

```bash
# Create and manage sessions
./teams/session-helper.sh create <agent> <team>
./teams/session-helper.sh load <session-id>
./teams/session-helper.sh list
./teams/session-helper.sh status

# Quick setup with worktree
./teams/session-helper.sh quick <agent> <team> <branch>

# Git worktree management
./teams/session-helper.sh worktree <session-id> <branch-name>

# Environment management (replaces exports)
./teams/session-helper.sh env <session-id>
./teams/session-helper.sh export <session-id>

# System maintenance
./teams/session-helper.sh cleanup
./teams/session-helper.sh monitor
```

### Advanced Commands

```bash
# Find sessions by criteria
./teams/session-helper.sh find team core-fix
./teams/session-helper.sh find agent coordinator
./teams/session-helper.sh find status active

# Monitor all sessions
./teams/session-helper.sh monitor 5  # Refresh every 5 seconds
```

## 🔐 Session Safety Features

### 1. Automatic Conflict Resolution

```javascript
// Session manager automatically resolves ID conflicts
if (sessionExists(sessionId)) {
    sessionId = `${sessionId}-${randomSuffix()}`;
    console.log('Conflict resolved: Using', sessionId);
}
```

### 2. Resource Locking

```javascript
// Prevent multiple agents from working on same resource
function claimResource(resourceName) {
    if (checkAgentConflicts(resourceName)) {
        throw new Error(`Resource already claimed: ${resourceName}`);
    }
    // Lock acquired safely
}
```

### 3. Session Recovery

```javascript
// Automatic recovery from previous sessions
const activeSessions = sessionManager.listActiveSessions()
    .filter(s => s.agentName === agentName && s.teamId === teamId);

if (activeSessions.length > 0) {
    session = sessionManager.loadSession(activeSessions[0].id);
    console.log('🔄 Recovered session:', session.id);
}
```

### 4. Automatic Cleanup

```javascript
// Cleanup stale sessions automatically
process.on('exit', () => cleanupSession('process_exit'));
process.on('SIGINT', () => cleanupSession('interrupted'));
process.on('SIGTERM', () => cleanupSession('terminated'));
```

## 🌳 Git Worktree Best Practices

### Directory Structure

```bash
# Recommended setup
/home/x/
├── core/                    # Main development (latest main)
└── worktrees/               # Parallel worktrees
    ├── core-fix-bug-001/    # Bug fix worktree  
    ├── feature-api-002/     # Feature worktree
    └── integration-003/     # Integration worktree
```

### Worktree Lifecycle

```bash
# 1. Create worktree with session
./teams/session-helper.sh quick fixer core-fix critical-bug

# 2. Work in isolation
cd ../worktrees/core-fix-critical-bug-abc123/
# Claude Code works here without conflicts

# 3. Merge when ready
git checkout main
git merge critical-bug

# 4. Cleanup happens automatically on session end
```

### Multiple Claude Code Windows

```bash
# Each terminal can run Claude Code independently:

# Terminal 1
cd /home/x/worktrees/core-fix-bug-001/
claude

# Terminal 2  
cd /home/x/worktrees/feature-api-002/
claude

# Terminal 3
cd /home/x/worktrees/integration-003/
claude

# No conflicts - each has isolated git state!
```

## 📊 Monitoring and Debugging

### Real-time Monitoring

```bash
# Continuous monitoring
./teams/session-helper.sh monitor

# Output:
# ════════════════════════════════════════
# System Status:
#    Active Sessions: 3
#    Archived Sessions: 7  
#    Active Worktrees: 3
#
# Session Details:
#    core-fix-coord-... | coordinator (core-fix) | active | Actions: 15
#    feature-dev-dev-... | developer (feature-dev) | active | Actions: 8
#    integration-int-... | integrator (integration) | active | Actions: 12
```

### Debug Session Issues

```bash
# Get detailed session info
./teams/session-helper.sh load <session-id>

# Check session environment
./teams/session-helper.sh env <session-id>

# Find related sessions
./teams/session-helper.sh find team core-fix
```

### Cleanup Stale Sessions

```bash
# Manual cleanup
./teams/session-helper.sh cleanup

# Automatic cleanup (runs every 5 minutes by default)
# - Sessions older than 1 hour are archived
# - Orphaned locks are removed
# - Stale worktrees are cleaned
```

## 🎭 Migration from Old System

### Step 1: Update Agent Templates

```bash
# Replace old templates with session-safe versions
cp teams/templates/agent-v2-sessionless.hbs teams/templates/agent-composer.hbs

# Regenerate agents
node teams/generate-with-composer.cjs
```

### Step 2: Update Existing Workflows

```diff
# Before (Broken)
- export TEAM_ID="core-fix"
- export WORKSPACE="tmp/teams/core-fix-123"

# After (Session-Safe) 
+ const sessionManager = require('./teams/session-manager.js');
+ const session = sessionManager.createSession('coordinator', 'core-fix');
+ const WORKSPACE = session.workspace;
```

### Step 3: Use Worktrees for Parallel Work

```bash
# Instead of switching branches in same directory
git checkout main
git checkout -b feature-branch  # ❌ Context switch!

# Use worktrees for isolation
./teams/session-helper.sh quick developer feature-dev feature-branch  # ✅ Parallel!
```

## 🔮 Advanced Use Cases

### 1. Parallel Testing Strategy

```bash
# Test different approaches simultaneously
./teams/session-helper.sh quick tester-1 feature-dev unit-tests
./teams/session-helper.sh quick tester-2 feature-dev integration-tests  
./teams/session-helper.sh quick tester-3 feature-dev performance-tests

# Compare results without context switching
```

### 2. Multi-Team Coordination

```bash
# Coordinated cross-team development
./teams/session-helper.sh quick coordinator meta system-overview
./teams/session-helper.sh quick architect feature-dev api-design
./teams/session-helper.sh quick integrator integration api-integration
./teams/session-helper.sh quick auditor security api-security

# Each team works in parallel on related features
```

### 3. Experiment Branches

```bash
# Try different approaches to same problem
./teams/session-helper.sh quick developer feature-dev approach-a
./teams/session-helper.sh quick developer feature-dev approach-b  
./teams/session-helper.sh quick developer feature-dev approach-c

# Keep all approaches until one proves best
```

## 📋 Troubleshooting

### Common Issues

1. **Session Not Found**
   ```bash
   # Check if session exists
   ./teams/session-helper.sh list
   
   # Try recovery
   ./teams/session-helper.sh cleanup
   ```

2. **Worktree Creation Failed**
   ```bash
   # Check git status
   git status
   git worktree list
   
   # Clean orphaned worktrees
   git worktree prune
   ```

3. **Export Variable Conflicts** (Should not happen with new system)
   ```bash
   # Verify using session manager
   ./teams/session-helper.sh env <session-id>
   
   # Never use export commands directly
   ```

### Performance Optimization

```bash
# Cleanup stale sessions regularly
./teams/session-helper.sh cleanup

# Monitor system resources
./teams/session-helper.sh monitor

# Archive old sessions
# (Happens automatically after 1 hour)
```

## 🎉 Success Metrics

With the new system, you should see:

- ✅ **Zero export variable conflicts**
- ✅ **Perfect session isolation**  
- ✅ **Automatic session recovery**
- ✅ **Parallel Claude Code sessions**
- ✅ **Git worktree integration**
- ✅ **Resource conflict prevention**
- ✅ **Automatic cleanup**

## 📚 Next Steps

1. **Initialize the system**: `./teams/session-helper.sh init`
2. **Create your first session**: `./teams/session-helper.sh quick coordinator core-fix test-session`
3. **Open Claude Code in worktree**: `cd ../worktrees/core-fix-test-session-.../`
4. **Start parallel development**: Create additional sessions as needed
5. **Monitor progress**: `./teams/session-helper.sh monitor`

The multi-agent system is now ready for production use with complete session safety and parallel development capabilities!