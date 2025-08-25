# Communication Protocol

## Status Updates
Every 5 actions, update `{{WORKSPACE}}/status.md`:
```markdown
Status: {{STATUS}}
Progress: {{PROGRESS}}%
Current: {{CURRENT_TASK}}
Next: {{NEXT_STEPS}}
Blockers: {{BLOCKERS}}
```

## Decision Log
Log decisions to `{{WORKSPACE}}/decisions.log`:
```
[{{TIMESTAMP}}] {{DECISION}} | Reason: {{REASON}}
```

## Completion Protocol
1. Update `tmp/teams/STATUS.md` with results
2. Commit changes with proper message
3. Clean workspace: `rm -rf {{WORKSPACE}}`