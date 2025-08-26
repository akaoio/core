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
