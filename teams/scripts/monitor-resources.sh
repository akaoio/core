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
