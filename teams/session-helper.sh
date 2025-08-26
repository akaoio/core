#!/bin/bash

# Session Helper Script for Multi-Agent Claude Code System
# Eliminates export variable conflicts and provides session management utilities

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SESSION_MANAGER_PATH="./teams/session-manager.cjs"

# Initialize session management
init_session_system() {
    echo -e "${BLUE}🔧 Initializing session management system...${NC}"
    
    # Create required directories
    mkdir -p tmp/sessions/{active,archive,locks}
    mkdir -p ../worktrees
    
    # Make session manager executable
    chmod +x "${SESSION_MANAGER_PATH}"
    
    echo -e "${GREEN}✅ Session system initialized${NC}"
}

# Create new session
create_session() {
    local agent_name="$1"
    local team_id="$2"
    local context="${3:-{}}"
    
    if [[ -z "$agent_name" || -z "$team_id" ]]; then
        echo -e "${RED}❌ Usage: create_session <agent_name> <team_id> [context_json]${NC}"
        return 1
    fi
    
    echo -e "${BLUE}✨ Creating session for ${agent_name} (${team_id})...${NC}"
    
    local session_id
    session_id=$(SHELL_OUTPUT=1 node "${SESSION_MANAGER_PATH}" create "$agent_name" "$team_id" "$context" 2>/dev/null | tail -1)
    
    if [[ $? -eq 0 && -n "$session_id" ]]; then
        echo -e "${GREEN}✅ Session created: ${session_id}${NC}"
        echo "$session_id"
    else
        echo -e "${RED}❌ Failed to create session${NC}"
        return 1
    fi
}

# Load existing session
load_session() {
    local session_id="$1"
    
    if [[ -z "$session_id" ]]; then
        echo -e "${RED}❌ Usage: load_session <session_id>${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🔄 Loading session ${session_id}...${NC}"
    
    local session_data
    session_data=$(node "${SESSION_MANAGER_PATH}" load "$session_id")
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Session loaded successfully${NC}"
        echo "$session_data" | jq .
    else
        echo -e "${RED}❌ Failed to load session${NC}"
        return 1
    fi
}

# List active sessions
list_sessions() {
    echo -e "${BLUE}📋 Active sessions:${NC}"
    
    local sessions
    sessions=$(node "${SESSION_MANAGER_PATH}" list)
    
    if [[ $? -eq 0 ]]; then
        local count
        count=$(echo "$sessions" | jq '. | length')
        
        if [[ "$count" -eq 0 ]]; then
            echo -e "${YELLOW}   No active sessions${NC}"
        else
            echo "$sessions" | jq -r '.[] | "   \(.id) | \(.agentName) (\(.teamId)) | \(.status) | \(.updated)"'
        fi
    else
        echo -e "${RED}❌ Failed to list sessions${NC}"
        return 1
    fi
}

# Create git worktree for session
create_worktree() {
    local session_id="$1"
    local branch_name="$2"
    local base_branch="${3:-main}"
    
    if [[ -z "$session_id" || -z "$branch_name" ]]; then
        echo -e "${RED}❌ Usage: create_worktree <session_id> <branch_name> [base_branch]${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🌳 Creating worktree for session ${session_id}...${NC}"
    echo -e "${CYAN}   Branch: ${branch_name}${NC}"
    echo -e "${CYAN}   Base: ${base_branch}${NC}"
    
    local worktree_path
    worktree_path=$(node "${SESSION_MANAGER_PATH}" worktree "$session_id" "$branch_name" "$base_branch")
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Worktree created: ${worktree_path}${NC}"
        echo -e "${PURPLE}💡 Open new Claude Code session in: ${worktree_path}${NC}"
        echo "$worktree_path"
    else
        echo -e "${RED}❌ Failed to create worktree${NC}"
        return 1
    fi
}

# Get session environment variables (replaces exports)
get_session_env() {
    local session_id="$1"
    local var_name="$2"
    
    if [[ -z "$session_id" ]]; then
        echo -e "${RED}❌ Usage: get_session_env <session_id> [var_name]${NC}"
        return 1
    fi
    
    local env_vars
    env_vars=$(node "${SESSION_MANAGER_PATH}" env "$session_id")
    
    if [[ $? -eq 0 ]]; then
        if [[ -n "$var_name" ]]; then
            echo "$env_vars" | jq -r ".$var_name // \"not_found\""
        else
            echo "$env_vars" | jq .
        fi
    else
        echo -e "${RED}❌ Failed to get session environment${NC}"
        return 1
    fi
}

# Export session environment to shell script
export_session_env() {
    local session_id="$1"
    
    if [[ -z "$session_id" ]]; then
        echo -e "${RED}❌ Usage: export_session_env <session_id>${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📤 Exporting session environment...${NC}"
    
    local script_path
    script_path=$(node "${SESSION_MANAGER_PATH}" export "$session_id")
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Environment exported: ${script_path}${NC}"
        echo -e "${PURPLE}💡 Source with: source ${script_path}${NC}"
        echo "$script_path"
    else
        echo -e "${RED}❌ Failed to export environment${NC}"
        return 1
    fi
}

# Cleanup stale sessions
cleanup_sessions() {
    echo -e "${BLUE}🧹 Cleaning up stale sessions...${NC}"
    
    local cleaned
    cleaned=$(node "${SESSION_MANAGER_PATH}" cleanup)
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ ${cleaned}${NC}"
    else
        echo -e "${RED}❌ Cleanup failed${NC}"
        return 1
    fi
}

# Show system status
show_status() {
    echo -e "${BLUE}📊 System Status:${NC}"
    
    local status
    status=$(node "${SESSION_MANAGER_PATH}" status)
    
    if [[ $? -eq 0 ]]; then
        local active_count
        local archived_count
        local worktree_count
        
        active_count=$(echo "$status" | jq -r '.activeSessions')
        archived_count=$(echo "$status" | jq -r '.archivedSessions')
        worktree_count=$(echo "$status" | jq -r '.worktrees')
        
        echo -e "${GREEN}   Active Sessions: ${active_count}${NC}"
        echo -e "${YELLOW}   Archived Sessions: ${archived_count}${NC}"
        echo -e "${PURPLE}   Active Worktrees: ${worktree_count}${NC}"
        
        echo -e "\n${BLUE}📋 Session Details:${NC}"
        echo "$status" | jq -r '.sessions[] | "   \(.id) | \(.agent) (\(.team)) | \(.status) | Actions: \(.actions)"'
    else
        echo -e "${RED}❌ Failed to get system status${NC}"
        return 1
    fi
}

# Find sessions by criteria
find_sessions() {
    local criteria="$1"
    local value="$2"
    
    if [[ -z "$criteria" || -z "$value" ]]; then
        echo -e "${RED}❌ Usage: find_sessions <agent|team|status> <value>${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🔍 Finding sessions where ${criteria}=${value}...${NC}"
    
    local sessions
    sessions=$(node "${SESSION_MANAGER_PATH}" list)
    
    if [[ $? -eq 0 ]]; then
        local results
        case "$criteria" in
            "agent")
                results=$(echo "$sessions" | jq -r ".[] | select(.agentName == \"$value\") | .id")
                ;;
            "team")
                results=$(echo "$sessions" | jq -r ".[] | select(.teamId == \"$value\") | .id")
                ;;
            "status")
                results=$(echo "$sessions" | jq -r ".[] | select(.status == \"$value\") | .id")
                ;;
            *)
                echo -e "${RED}❌ Invalid criteria. Use: agent, team, or status${NC}"
                return 1
                ;;
        esac
        
        if [[ -n "$results" ]]; then
            echo -e "${GREEN}Found sessions:${NC}"
            echo "$results" | while read -r session_id; do
                echo "   $session_id"
            done
        else
            echo -e "${YELLOW}   No sessions found matching criteria${NC}"
        fi
    else
        echo -e "${RED}❌ Failed to search sessions${NC}"
        return 1
    fi
}

# Quick session setup for agents
quick_session() {
    local agent_name="$1"
    local team_id="$2"
    local branch_name="$3"
    
    if [[ -z "$agent_name" || -z "$team_id" ]]; then
        echo -e "${RED}❌ Usage: quick_session <agent_name> <team_id> [branch_name]${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🚀 Quick session setup for ${agent_name}...${NC}"
    
    # Create session and capture just the session ID
    local session_id
    session_id=$(SHELL_OUTPUT=1 node "${SESSION_MANAGER_PATH}" create "$agent_name" "$team_id" "{}" 2>/dev/null | tail -1)
    
    if [[ $? -ne 0 || -z "$session_id" ]]; then
        echo -e "${RED}❌ Failed to create session${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Session created: ${session_id}${NC}"
    
    # Create worktree if branch specified
    if [[ -n "$branch_name" ]]; then
        echo -e "${BLUE}🌳 Creating worktree...${NC}"
        
        local worktree_path
        worktree_path=$(SHELL_OUTPUT=1 node "${SESSION_MANAGER_PATH}" worktree "$session_id" "$branch_name" "main" 2>/dev/null | tail -1)
        
        if [[ $? -eq 0 && -n "$worktree_path" ]]; then
            echo -e "${GREEN}✅ Worktree created: ${worktree_path}${NC}"
            echo -e "\n${GREEN}🎉 Session ready!${NC}"
            echo -e "${PURPLE}   Session ID: ${session_id}${NC}"
            echo -e "${PURPLE}   Worktree: ${worktree_path}${NC}"
            echo -e "${CYAN}   Next: cd ${worktree_path} && claude${NC}"
        else
            echo -e "${YELLOW}⚠️  Worktree creation failed, but session is active${NC}"
            echo -e "${PURPLE}   Session ID: ${session_id}${NC}"
        fi
    else
        echo -e "\n${GREEN}🎉 Session ready!${NC}"
        echo -e "${PURPLE}   Session ID: ${session_id}${NC}"
    fi
    
    echo "$session_id"
}

# Monitor sessions (continuous)
monitor_sessions() {
    local interval="${1:-5}"
    
    echo -e "${BLUE}👁️  Monitoring sessions (every ${interval}s). Press Ctrl+C to stop...${NC}"
    
    while true; do
        clear
        echo -e "${CYAN}Session Monitor - $(date)${NC}"
        echo "════════════════════════════════════════"
        show_status
        echo ""
        echo -e "${YELLOW}Refreshing in ${interval}s...${NC}"
        sleep "$interval"
    done
}

# Help function
show_help() {
    cat << EOF
${BLUE}Session Helper - Multi-Agent Claude Code System${NC}

${GREEN}USAGE:${NC}
    $0 <command> [arguments]

${GREEN}COMMANDS:${NC}
    ${CYAN}init${NC}                              Initialize session system
    ${CYAN}create${NC} <agent> <team> [context]     Create new session
    ${CYAN}load${NC} <session_id>                  Load existing session
    ${CYAN}list${NC}                              List active sessions
    ${CYAN}status${NC}                            Show system status
    ${CYAN}cleanup${NC}                           Clean stale sessions
    
    ${CYAN}worktree${NC} <session_id> <branch>     Create git worktree
    ${CYAN}env${NC} <session_id> [var_name]        Get session environment
    ${CYAN}export${NC} <session_id>               Export environment script
    
    ${CYAN}find${NC} <agent|team|status> <value>   Find sessions by criteria
    ${CYAN}quick${NC} <agent> <team> [branch]      Quick session setup
    ${CYAN}monitor${NC} [interval]                 Monitor sessions continuously

${GREEN}EXAMPLES:${NC}
    # Initialize system
    $0 init
    
    # Create session for coordinator
    $0 create coordinator core-fix
    
    # Create session with worktree
    $0 quick fixer core-fix feature-bug-fix
    
    # Monitor system
    $0 monitor 10
    
    # Find all core-fix sessions
    $0 find team core-fix
    
    # Export environment for session
    $0 export core-fix-coordinator-2025-08-25T23-45-12-123

${GREEN}TIPS:${NC}
    • Use worktrees for parallel Claude Code sessions
    • Sessions automatically recover on restart
    • No more export variable conflicts!
    • Each session is completely isolated
EOF
}

# Main command dispatcher
main() {
    case "$1" in
        "init")
            init_session_system
            ;;
        "create")
            create_session "$2" "$3" "$4"
            ;;
        "load")
            load_session "$2"
            ;;
        "list")
            list_sessions
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            cleanup_sessions
            ;;
        "worktree")
            create_worktree "$2" "$3" "$4"
            ;;
        "env")
            get_session_env "$2" "$3"
            ;;
        "export")
            export_session_env "$2"
            ;;
        "find")
            find_sessions "$2" "$3"
            ;;
        "quick")
            quick_session "$2" "$3" "$4"
            ;;
        "monitor")
            monitor_sessions "$2"
            ;;
        "help"|"-h"|"--help"|"")
            show_help
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $1${NC}"
            echo -e "${YELLOW}Use '$0 help' for usage information${NC}"
            exit 1
            ;;
    esac
}

# Check dependencies
check_dependencies() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq is required but not installed${NC}"
        exit 1
    fi
    
    if [[ ! -f "$SESSION_MANAGER_PATH" ]]; then
        echo -e "${RED}❌ Session manager not found: $SESSION_MANAGER_PATH${NC}"
        exit 1
    fi
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    check_dependencies
    main "$@"
fi