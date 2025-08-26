# Quick Reference: File Protection for Agents

## Before ANY File Operation

### 1. Check if File is Protected
```bash
node scripts/file-protection-system.cjs check <file-path>
```

### 2. Validate Deletion Request
```bash
node scripts/file-protection-system.cjs validate-deletion <file1> [file2...]
```

### 3. Use Agent-Safe Operations
```bash
# Set your agent ID
export AGENT_ID="team-[team]-[role]"

# Safe deletion
node scripts/agent-safe-operations.cjs $AGENT_ID delete <file-path> 

# Safe workspace cleanup
node scripts/agent-safe-operations.cjs $AGENT_ID cleanup <workspace-dir>
```

## Critical Files - NEVER DELETE

### Battle Test Files
- `**/*.battle.*` - ALL Battle test files
- `test-integration.battle.cjs` - Integration tests
- `security-tests.battle.cjs` - Security tests
- `projects/*/**.battle.*` - Project-specific Battle tests

### Package Management
- `**/package.json` - Dependency definitions
- `**/package-lock.json` - Lock files

### Agent System
- `.claude/team.config.yaml` - Team configuration
- `teams/templates/**` - Agent templates
- `CLAUDE.md` - System instructions

### Configuration Files
- `**/tsconfig*.json` - TypeScript configs
- `**/*config.*` - All config files

## Protection Exit Codes

- **Exit 0**: Operation allowed, proceed
- **Exit 1**: Operation blocked, DO NOT PROCEED
- **Exit 2**: Human confirmation required

## Agent Integration Pattern

```bash
#!/bin/bash
# Standard agent protection check

AGENT_ID="team-meta-orchestrator"
FILES_TO_DELETE="temp1.log temp2.tmp"

# Always check before deleting
node scripts/agent-safe-operations.cjs $AGENT_ID validate delete $FILES_TO_DELETE

if [ $? -eq 0 ]; then
    echo "✅ Safe to proceed"
    node scripts/agent-safe-operations.cjs $AGENT_ID delete $FILES_TO_DELETE
else
    echo "🚫 Operation blocked by file protection"
    exit 1
fi
```

## Common Scenarios

### Workspace Cleanup
```bash
# WRONG - Direct deletion
rm -rf tmp/teams/my-workspace/

# RIGHT - Protected cleanup
node scripts/agent-safe-operations.cjs $AGENT_ID cleanup tmp/teams/my-workspace/
```

### Temporary File Cleanup
```bash
# WRONG - Wildcard deletion
rm *.tmp *.log

# RIGHT - Protected validation
node scripts/agent-safe-operations.cjs $AGENT_ID validate delete *.tmp *.log
```

### Config File Modification
```bash
# WRONG - Direct edit
vim package.json

# RIGHT - Protected modification with backup
node scripts/agent-safe-operations.cjs $AGENT_ID backup package.json
# Then edit safely knowing backup exists
```

## Emergency Contacts

If protection system fails or blocks legitimate operations:
1. Check `tmp/file-protection.log` for details
2. Check `tmp/teams/agent-operations.log` for agent logs
3. Use `node scripts/file-protection-system.cjs report` for status

---
**REMEMBER**: Better safe than sorry - the protection system exists because we already lost critical files once.