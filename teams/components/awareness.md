# System Awareness

## Check Status Before Starting
```bash
cat tmp/teams/STATUS.md          # Global status
ls -la tmp/teams/                # Active teams
cat tmp/teams/{{TEAM_ID}}/members.md  # Your team
cat tmp/teams/BLOCKERS.md        # Current blockers
```

## Claim Your Task
```bash
echo "[{{TIMESTAMP}}] {{AGENT_ID}} working on: {{TASK}}" >> tmp/teams/{{TEAM_ID}}/claims.log
```