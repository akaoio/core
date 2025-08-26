#!/usr/bin/env node

/**
 * Session Manager for Multi-Agent Claude Code System
 * 
 * Solves critical issues:
 * 1. Export variable conflicts between agents
 * 2. Session garbage and memory loss
 * 3. Git worktree integration for parallel development
 * 
 * Features:
 * - File-based session state (no export conflicts)
 * - Automatic session recovery
 * - Git worktree coordination
 * - Session cleanup and garbage collection
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SessionManager {
    constructor() {
        this.sessionsDir = path.join(process.cwd(), 'tmp', 'sessions');
        this.worktreesDir = path.join(process.cwd(), '..', 'worktrees');
        this.configFile = path.join(this.sessionsDir, 'config.json');
        this.init();
    }

    init() {
        // Create session directories
        fs.mkdirSync(this.sessionsDir, { recursive: true });
        fs.mkdirSync(path.join(this.sessionsDir, 'active'), { recursive: true });
        fs.mkdirSync(path.join(this.sessionsDir, 'archive'), { recursive: true });
        fs.mkdirSync(path.join(this.sessionsDir, 'locks'), { recursive: true });
        
        // Initialize config if not exists
        if (!fs.existsSync(this.configFile)) {
            this.saveConfig({
                version: '1.0.0',
                created: new Date().toISOString(),
                sessions: {},
                worktrees: {},
                settings: {
                    maxActiveSessions: 10,
                    sessionTimeout: 3600000, // 1 hour
                    cleanupInterval: 300000,  // 5 minutes
                    autoCleanup: true
                }
            });
        }
    }

    loadConfig() {
        try {
            return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
        } catch (error) {
            throw new Error(`Failed to load session config: ${error.message}`);
        }
    }

    saveConfig(config) {
        fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
    }

    generateSessionId(agentName, teamId) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${teamId}-${agentName}-${timestamp}-${random}`;
    }

    createSession(agentName, teamId, context = {}) {
        const config = this.loadConfig();
        const sessionId = this.generateSessionId(agentName, teamId);
        
        const session = {
            id: sessionId,
            agentName,
            teamId,
            pid: process.pid,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            status: 'active',
            context: context,
            workspace: path.join('tmp', 'teams', `${teamId}-${Date.now()}`),
            worktree: null,
            actions: [],
            locks: [],
            environment: {
                // File-based replacements for export variables
                AGENT_SESSION_ID: sessionId,
                TEAM_ID: teamId,
                AGENT_NAME: agentName,
                SESSION_WORKSPACE: path.join('tmp', 'teams', `${teamId}-${Date.now()}`)
            }
        };

        // Save session state
        const sessionFile = path.join(this.sessionsDir, 'active', `${sessionId}.json`);
        fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

        // Create session lock
        const lockFile = path.join(this.sessionsDir, 'locks', `${sessionId}.lock`);
        fs.writeFileSync(lockFile, JSON.stringify({
            sessionId,
            pid: process.pid,
            created: new Date().toISOString(),
            agentName,
            teamId
        }, null, 2));

        // Update config
        config.sessions[sessionId] = {
            agentName,
            teamId,
            created: session.created,
            status: 'active',
            workspace: session.workspace,
            worktree: session.worktree
        };
        this.saveConfig(config);

        // Create workspace
        fs.mkdirSync(session.workspace, { recursive: true });
        
        console.log(`✅ Session created: ${sessionId}`);
        console.log(`📁 Workspace: ${session.workspace}`);
        
        return session;
    }

    loadSession(sessionId) {
        const sessionFile = path.join(this.sessionsDir, 'active', `${sessionId}.json`);
        
        if (!fs.existsSync(sessionFile)) {
            // Try to recover from archive
            const archivedFile = path.join(this.sessionsDir, 'archive', `${sessionId}.json`);
            if (fs.existsSync(archivedFile)) {
                console.log(`🔄 Recovering session from archive: ${sessionId}`);
                const session = JSON.parse(fs.readFileSync(archivedFile, 'utf8'));
                session.status = 'recovered';
                session.updated = new Date().toISOString();
                
                // Move back to active
                fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
                fs.unlinkSync(archivedFile);
                
                return session;
            }
            
            throw new Error(`Session not found: ${sessionId}`);
        }

        return JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    }

    updateSession(sessionId, updates) {
        const session = this.loadSession(sessionId);
        
        // Merge updates
        Object.assign(session, updates);
        session.updated = new Date().toISOString();
        
        // Add action to history
        if (updates.action) {
            session.actions.push({
                timestamp: new Date().toISOString(),
                action: updates.action,
                details: updates.actionDetails || {}
            });
        }

        // Save updated session
        const sessionFile = path.join(this.sessionsDir, 'active', `${sessionId}.json`);
        fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
        
        return session;
    }

    archiveSession(sessionId, reason = 'completed') {
        const sessionFile = path.join(this.sessionsDir, 'active', `${sessionId}.json`);
        const archiveFile = path.join(this.sessionsDir, 'archive', `${sessionId}.json`);
        
        if (fs.existsSync(sessionFile)) {
            const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
            session.status = 'archived';
            session.archiveReason = reason;
            session.archived = new Date().toISOString();
            
            // Move to archive
            fs.writeFileSync(archiveFile, JSON.stringify(session, null, 2));
            fs.unlinkSync(sessionFile);
            
            // Remove lock
            const lockFile = path.join(this.sessionsDir, 'locks', `${sessionId}.lock`);
            if (fs.existsSync(lockFile)) {
                fs.unlinkSync(lockFile);
            }
            
            console.log(`📦 Session archived: ${sessionId} (${reason})`);
        }
    }

    listActiveSessions() {
        const activeDir = path.join(this.sessionsDir, 'active');
        const sessions = [];
        
        if (fs.existsSync(activeDir)) {
            const files = fs.readdirSync(activeDir).filter(f => f.endsWith('.json'));
            
            for (const file of files) {
                try {
                    const session = JSON.parse(fs.readFileSync(path.join(activeDir, file), 'utf8'));
                    sessions.push(session);
                } catch (error) {
                    console.warn(`⚠️  Corrupted session file: ${file}`);
                }
            }
        }
        
        return sessions.sort((a, b) => new Date(b.updated) - new Date(a.updated));
    }

    createWorktree(sessionId, branchName, baseBranch = 'main') {
        const session = this.loadSession(sessionId);
        
        // Create worktrees directory if not exists
        fs.mkdirSync(this.worktreesDir, { recursive: true });
        
        const worktreePath = path.join(this.worktreesDir, `${session.teamId}-${branchName}-${sessionId.slice(-8)}`);
        
        try {
            // Create worktree
            execSync(`git worktree add "${worktreePath}" -b "${branchName}" "${baseBranch}"`, {
                cwd: process.cwd(),
                stdio: 'pipe'
            });
            
            // Update session with worktree info
            this.updateSession(sessionId, {
                worktree: {
                    path: worktreePath,
                    branch: branchName,
                    baseBranch: baseBranch,
                    created: new Date().toISOString()
                },
                action: 'create_worktree',
                actionDetails: { branch: branchName, path: worktreePath }
            });
            
            // Update config
            const config = this.loadConfig();
            config.worktrees[worktreePath] = {
                sessionId,
                branch: branchName,
                created: new Date().toISOString(),
                agentName: session.agentName,
                teamId: session.teamId
            };
            this.saveConfig(config);
            
            console.log(`🌳 Worktree created: ${worktreePath}`);
            console.log(`🌿 Branch: ${branchName}`);
            
            return worktreePath;
            
        } catch (error) {
            console.error(`❌ Failed to create worktree: ${error.message}`);
            throw error;
        }
    }

    cleanupWorktree(sessionId) {
        const session = this.loadSession(sessionId);
        
        if (session.worktree) {
            try {
                // Remove worktree
                execSync(`git worktree remove "${session.worktree.path}"`, {
                    cwd: process.cwd(),
                    stdio: 'pipe'
                });
                
                // Update config
                const config = this.loadConfig();
                delete config.worktrees[session.worktree.path];
                this.saveConfig(config);
                
                console.log(`🗑️  Worktree cleaned: ${session.worktree.path}`);
                
            } catch (error) {
                console.warn(`⚠️  Failed to cleanup worktree: ${error.message}`);
            }
        }
    }

    cleanupStaleSessions() {
        const config = this.loadConfig();
        const now = Date.now();
        const timeout = config.settings.sessionTimeout;
        
        const activeSessions = this.listActiveSessions();
        let cleaned = 0;
        
        for (const session of activeSessions) {
            const sessionAge = now - new Date(session.updated).getTime();
            
            // Check if session is stale
            if (sessionAge > timeout) {
                console.log(`🧹 Cleaning stale session: ${session.id} (${Math.floor(sessionAge / 60000)}m old)`);
                
                // Cleanup worktree if exists
                if (session.worktree) {
                    this.cleanupWorktree(session.id);
                }
                
                // Archive session
                this.archiveSession(session.id, 'stale_timeout');
                cleaned++;
            }
        }
        
        // Cleanup orphaned locks
        const locksDir = path.join(this.sessionsDir, 'locks');
        if (fs.existsSync(locksDir)) {
            const lockFiles = fs.readdirSync(locksDir);
            
            for (const lockFile of lockFiles) {
                const lockPath = path.join(locksDir, lockFile);
                const sessionId = lockFile.replace('.lock', '');
                
                // Check if corresponding session exists
                const sessionPath = path.join(this.sessionsDir, 'active', `${sessionId}.json`);
                if (!fs.existsSync(sessionPath)) {
                    fs.unlinkSync(lockPath);
                    console.log(`🗑️  Removed orphaned lock: ${lockFile}`);
                }
            }
        }
        
        return cleaned;
    }

    getEnvironmentVars(sessionId) {
        const session = this.loadSession(sessionId);
        return session.environment;
    }

    exportEnvironmentScript(sessionId) {
        const env = this.getEnvironmentVars(sessionId);
        const script = Object.entries(env)
            .map(([key, value]) => `export ${key}="${value}"`)
            .join('\n');
        
        const scriptPath = path.join(this.sessionsDir, 'active', `${sessionId}.env.sh`);
        fs.writeFileSync(scriptPath, script);
        
        return scriptPath;
    }

    status() {
        const config = this.loadConfig();
        const activeSessions = this.listActiveSessions();
        const archivedCount = fs.existsSync(path.join(this.sessionsDir, 'archive')) 
            ? fs.readdirSync(path.join(this.sessionsDir, 'archive')).length 
            : 0;
        
        return {
            activeSessions: activeSessions.length,
            archivedSessions: archivedCount,
            worktrees: Object.keys(config.worktrees).length,
            sessions: activeSessions.map(s => ({
                id: s.id,
                agent: s.agentName,
                team: s.teamId,
                status: s.status,
                created: s.created,
                updated: s.updated,
                workspace: s.workspace,
                worktree: s.worktree?.path,
                actions: s.actions.length
            }))
        };
    }
}

// CLI Interface
if (require.main === module) {
    const sessionManager = new SessionManager();
    const command = process.argv[2];
    
    switch (command) {
        case 'create':
            const agentName = process.argv[3];
            const teamId = process.argv[4];
            const context = process.argv[5] ? JSON.parse(process.argv[5]) : {};
            const session = sessionManager.createSession(agentName, teamId, context);
            
            // Output session ID only for shell script
            if (process.env.SHELL_OUTPUT) {
                console.log(session.id);
            } else {
                console.log(JSON.stringify(session, null, 2));
            }
            break;
            
        case 'load':
            const sessionId = process.argv[3];
            const loadedSession = sessionManager.loadSession(sessionId);
            console.log(JSON.stringify(loadedSession, null, 2));
            break;
            
        case 'list':
            const sessions = sessionManager.listActiveSessions();
            console.log(JSON.stringify(sessions, null, 2));
            break;
            
        case 'cleanup':
            const cleaned = sessionManager.cleanupStaleSessions();
            console.log(`Cleaned ${cleaned} stale sessions`);
            break;
            
        case 'worktree':
            const wtSessionId = process.argv[3];
            const branchName = process.argv[4];
            const baseBranch = process.argv[5] || 'main';
            const worktreePath = sessionManager.createWorktree(wtSessionId, branchName, baseBranch);
            
            // Output path only for shell script  
            if (process.env.SHELL_OUTPUT) {
                console.log(worktreePath);
            }
            break;
            
        case 'status':
            const status = sessionManager.status();
            console.log(JSON.stringify(status, null, 2));
            break;
            
        case 'env':
            const envSessionId = process.argv[3];
            const envVars = sessionManager.getEnvironmentVars(envSessionId);
            console.log(JSON.stringify(envVars, null, 2));
            break;
            
        case 'export':
            const expSessionId = process.argv[3];
            const scriptPath = sessionManager.exportEnvironmentScript(expSessionId);
            console.log(scriptPath);
            break;
            
        default:
            console.log(`
Usage: node session-manager.js <command> [args...]

Commands:
  create <agent> <team> [context]  Create new session
  load <sessionId>                 Load existing session
  list                            List active sessions
  cleanup                         Clean stale sessions
  worktree <sessionId> <branch>   Create git worktree
  status                          Show system status
  env <sessionId>                 Get environment variables
  export <sessionId>              Export environment script

Examples:
  node session-manager.js create coordinator core-fix
  node session-manager.js worktree core-fix-coord-... feature-branch
  node session-manager.js cleanup
            `);
            break;
    }
}

module.exports = SessionManager;