#!/bin/bash
# Quick Multi-Agent System Improvements - Immediate Deployment
# Implements file-based improvements without Air dependency

echo "🚀 Deploying Multi-Agent System Improvements..."
echo "=============================================="

# Create necessary directories
mkdir -p tmp/teams/{health,metrics,performance,archive}
mkdir -p teams/scripts

# 1. Deploy health monitoring
echo "📊 Setting up health monitoring..."
if [[ -f "teams/scripts/health-check.sh" ]]; then
    chmod +x teams/scripts/health-check.sh
    ./teams/scripts/health-check.sh
    echo "✅ Health check deployed and executed"
else
    echo "❌ Health check script not found"
fi

# 2. Setup automated cleanup
echo "🧹 Setting up automated cleanup..."
cat > teams/scripts/auto-cleanup.sh << 'EOF'
#!/bin/bash
# Auto-cleanup script for multi-agent system

# Clean stale workspaces (older than 2 hours)
find tmp/teams -name "*-*" -type d -mmin +120 -exec rm -rf {} + 2>/dev/null

# Archive completed sessions older than 1 week
if [[ -d "tmp/teams/archive" ]]; then
    find tmp/teams -name "*.completed" -mtime +7 -exec mv {} tmp/teams/archive/ \; 2>/dev/null
fi

# Remove stuck agent locks (older than 30 minutes)
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

echo "$(date): Auto-cleanup completed" >> tmp/teams/cleanup.log
EOF

chmod +x teams/scripts/auto-cleanup.sh
./teams/scripts/auto-cleanup.sh
echo "✅ Auto-cleanup deployed and executed"

# 3. Setup performance tracking
echo "📈 Setting up performance tracking..."
cat > teams/scripts/track-performance.sh << 'EOF'
#!/bin/bash
# Performance tracking for multi-agent system

# Create performance log entry
log_performance() {
    local agent_id=$1
    local action=$2
    local task_id=$3
    local duration=${4:-0}
    
    echo "$(date -Iseconds)|$agent_id|$action|$task_id|duration:${duration}s" >> tmp/teams/performance.log
}

# Generate performance report
generate_report() {
    if [[ -f "tmp/teams/performance.log" ]]; then
        awk -F'|' '
        BEGIN { print "# Agent Performance Report"; print "Generated: " strftime("%Y-%m-%d %H:%M:%S"); print "" }
        {
            if ($3 == "complete" && $5 != "") {
                agent=$2; duration=$5; gsub("duration:", "", duration);
                total[agent] += duration; count[agent]++
            }
        } 
        END {
            for (agent in total) {
                avg = total[agent]/count[agent]
                printf "- %s: %.1fs avg, %d tasks\n", agent, avg, count[agent]
            }
        }' tmp/teams/performance.log > tmp/teams/performance-report.md
        
        echo "✅ Performance report generated: tmp/teams/performance-report.md"
    fi
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    generate_report
fi
EOF

chmod +x teams/scripts/track-performance.sh
echo "✅ Performance tracking deployed"

# 4. Setup resource monitoring
echo "💾 Setting up resource monitoring..."
cat > teams/scripts/monitor-resources.sh << 'EOF'
#!/bin/bash
# Resource monitoring for multi-agent system

monitor_resources() {
    local report_file="tmp/teams/resources.status"
    
    echo "# Resource Status Report" > $report_file
    echo "Generated: $(date)" >> $report_file
    echo "" >> $report_file
    
    # Active agents
    local active_agents=$(ls tmp/teams/sessions/*.lock 2>/dev/null | wc -l)
    echo "Active Agents: $active_agents" >> $report_file
    
    # Workspace count
    local workspaces=$(find tmp/teams -name "*-*" -type d | wc -l)
    echo "Active Workspaces: $workspaces" >> $report_file
    
    # Disk usage
    local disk_usage=$(du -sh tmp/teams 2>/dev/null | cut -f1)
    echo "Workspace Disk Usage: $disk_usage" >> $report_file
    
    # Memory usage (if possible)
    local memory_usage=$(ps aux | grep -E '(node|claude)' | awk '{sum+=$4} END {print sum "%"}' 2>/dev/null || echo "N/A")
    echo "Agent Memory Usage: $memory_usage" >> $report_file
    
    # System load
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
    echo "System Load: $load_avg" >> $report_file
    
    echo "$(date): Resource monitoring completed" >> tmp/teams/monitoring.log
}

# Run monitoring
monitor_resources
echo "✅ Resource monitoring deployed and executed"
EOF

chmod +x teams/scripts/monitor-resources.sh
./teams/scripts/monitor-resources.sh
echo "✅ Resource monitoring completed"

# 5. Setup automated dashboard refresh
echo "📊 Setting up dashboard automation..."
if command -v crontab >/dev/null 2>&1; then
    # Add cron job for dashboard refresh (every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * cd /home/x/core && node teams/generate-dashboard.cjs >/dev/null 2>&1") | crontab -
    echo "✅ Dashboard auto-refresh enabled (every 5 minutes)"
else
    echo "⚠️ Cron not available - manual dashboard refresh required"
fi

# 6. Create system status command
echo "⚡ Creating system status command..."
cat > teams/scripts/system-status.sh << 'EOF'
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
local active=$(ls tmp/teams/sessions/*.lock 2>/dev/null | wc -l)
echo "  Active Agents: $active"

# Recent activity
if [[ -f "tmp/teams/activity.log" ]]; then
    local recent=$(tail -1 tmp/teams/activity.log 2>/dev/null || echo "No recent activity")
    echo "  Last Activity: $recent"
fi

# Dashboard age
if [[ -f "SYSTEM-DASHBOARD.md" ]]; then
    local age=$((($(date +%s) - $(stat -c %Y "SYSTEM-DASHBOARD.md")) / 60))
    echo "  Dashboard Age: ${age}m"
fi

echo ""
echo "💡 Use 'node teams/scripts/smart-router.cjs \"your request\"' for intelligent agent routing"
echo "💡 Use 'teams/scripts/auto-cleanup.sh' to clean up resources"
echo "💡 Use 'node teams/generate-dashboard.cjs' to refresh dashboard"
EOF

chmod +x teams/scripts/system-status.sh
echo "✅ System status command created"

# 7. Run final system check
echo ""
echo "🔍 Running final system check..."
./teams/scripts/system-status.sh

echo ""
echo "✅ Multi-Agent System Improvements Deployed Successfully!"
echo ""
echo "📋 Available Commands:"
echo "  ./teams/scripts/health-check.sh       - System health analysis"
echo "  ./teams/scripts/auto-cleanup.sh       - Clean up resources"  
echo "  ./teams/scripts/system-status.sh      - Quick system overview"
echo "  ./teams/scripts/track-performance.sh  - Performance reporting"
echo "  node teams/scripts/smart-router.cjs   - Intelligent agent routing"
echo ""
echo "🎯 Next Steps:"
echo "  1. Test the smart router: node teams/scripts/smart-router.cjs 'fix broken tests'"
echo "  2. Monitor health: ./teams/scripts/health-check.sh"
echo "  3. Consider team consolidation plan: tmp/team-consolidation-plan.md"