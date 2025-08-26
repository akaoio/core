#!/bin/bash
# Quick system status overview

echo "🤖 Multi-Agent System Status"
echo "============================"

# Health check
if [[ -f "teams/scripts/health-check.sh" ]]; then
    ./teams/scripts/health-check.sh
else
    echo "Health check not available"
fi

echo ""
echo "📊 Quick Stats:"

# Active sessions
active=$(ls tmp/teams/sessions/*.lock 2>/dev/null | wc -l)
echo "  Active Agents: $active"

# Recent activity
if [[ -f "tmp/teams/activity.log" ]]; then
    recent=$(tail -1 tmp/teams/activity.log 2>/dev/null || echo "No recent activity")
    echo "  Last Activity: $recent"
fi

# Dashboard age
if [[ -f "SYSTEM-DASHBOARD.md" ]]; then
    age=$((($(date +%s) - $(stat -c %Y "SYSTEM-DASHBOARD.md")) / 60))
    echo "  Dashboard Age: ${age}m"
fi

echo ""
echo "💡 Use 'node teams/scripts/smart-router.cjs \"your request\"' for intelligent agent routing"
echo "💡 Use 'teams/scripts/auto-cleanup.sh' to clean up resources"
echo "💡 Use 'node teams/generate-dashboard.cjs' to refresh dashboard"
