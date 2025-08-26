#!/bin/bash
# Multi-Agent System Health Check
# File-based health monitoring without Air dependency

health_score=100
issues=()

# Check workspace cleanliness
stale_workspaces=$(find tmp/teams -name "*-*" -type d -mmin +120 2>/dev/null | wc -l)
if [[ $stale_workspaces -gt 5 ]]; then
    health_score=$((health_score - 20))
    issues+=("$stale_workspaces stale workspaces detected")
fi

# Check for active conflicts
if [[ -f "tmp/teams/conflicts.log" ]]; then
    active_conflicts=$(grep -c "CONFLICT" tmp/teams/conflicts.log 2>/dev/null || echo 0)
    if [[ $active_conflicts -gt 0 ]]; then
        health_score=$((health_score - 10))
        issues+=("$active_conflicts active agent conflicts")
    fi
fi

# Check for stuck agents (sessions older than 30 minutes)
stuck_agents=0
if ls tmp/teams/sessions/*.lock >/dev/null 2>&1; then
    for lock_file in tmp/teams/sessions/*.lock; do
        if [[ -f "$lock_file" ]]; then
            age_minutes=$((($(date +%s) - $(stat -c %Y "$lock_file")) / 60))
            if [[ $age_minutes -gt 30 ]]; then
                stuck_agents=$((stuck_agents + 1))
            fi
        fi
    done
fi
if [[ $stuck_agents -gt 0 ]]; then
    health_score=$((health_score - 15))
    issues+=("$stuck_agents agents stuck/unresponsive")
fi

# Check system resources
active_agents=$(ls tmp/teams/sessions/*.lock 2>/dev/null | wc -l)
if [[ $active_agents -gt 6 ]]; then
    health_score=$((health_score - 5))
    issues+=("High agent load: $active_agents active agents")
fi

# Check dashboard freshness
if [[ -f "SYSTEM-DASHBOARD.md" ]]; then
    dashboard_age=$((($(date +%s) - $(stat -c %Y "SYSTEM-DASHBOARD.md")) / 60))
    if [[ $dashboard_age -gt 10 ]]; then
        health_score=$((health_score - 5))
        issues+=("Dashboard outdated: ${dashboard_age}m old")
    fi
fi

# Write health status
mkdir -p tmp/teams
echo "SYSTEM_HEALTH_SCORE: $health_score" > tmp/teams/health.status
echo "LAST_CHECK: $(date -Iseconds)" >> tmp/teams/health.status
echo "ACTIVE_AGENTS: $active_agents" >> tmp/teams/health.status
echo "STALE_WORKSPACES: $stale_workspaces" >> tmp/teams/health.status

# Write detailed issues
if [[ ${#issues[@]} -gt 0 ]]; then
    echo "HEALTH ISSUES DETECTED:" > tmp/teams/health-issues.log
    printf '%s\n' "${issues[@]}" >> tmp/teams/health-issues.log
    echo "$(date -Iseconds): Health check completed - Score: $health_score" >> tmp/teams/health-issues.log
else
    echo "No health issues detected - Score: $health_score" > tmp/teams/health-issues.log
fi

# Output for immediate feedback
echo "System Health Score: $health_score/100"
if [[ ${#issues[@]} -gt 0 ]]; then
    echo "Issues found:"
    printf '  - %s\n' "${issues[@]}"
else
    echo "All systems healthy"
fi

# Auto-cleanup if health is poor
if [[ $health_score -lt 70 ]]; then
    echo "Health score critical - performing auto-cleanup..."
    
    # Clean stale workspaces
    find tmp/teams -name "*-*" -type d -mmin +60 -exec rm -rf {} + 2>/dev/null
    
    # Remove stuck agent locks
    if ls tmp/teams/sessions/*.lock >/dev/null 2>&1; then
        for lock_file in tmp/teams/sessions/*.lock; do
            if [[ -f "$lock_file" ]]; then
                age_minutes=$((($(date +%s) - $(stat -c %Y "$lock_file")) / 60))
                if [[ $age_minutes -gt 30 ]]; then
                    echo "Removing stuck agent lock: $lock_file"
                    rm "$lock_file"
                fi
            fi
        done
    fi
    
    echo "Auto-cleanup completed"
fi

exit $((health_score < 70 ? 1 : 0))