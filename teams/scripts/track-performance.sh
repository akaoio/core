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
