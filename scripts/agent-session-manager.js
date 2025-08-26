#!/usr/bin/env node

/**
 * Agent Session Manager - Handles agent ID conflicts and session coordination
 * Automatically resolves conflicts when multiple agents/sessions are running
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AgentSessionManager {
  constructor() {
    this.sessionsDir = 'tmp/teams/sessions';
    this.conflictsLog = 'tmp/teams/conflicts.log';
    this.statusDir = 'tmp/teams/status';
    this.updatesDir = 'tmp/teams/updates';
    
    this.ensureDirs();
  }

  ensureDirs() {
    const dirs = [this.sessionsDir, this.statusDir, this.updatesDir, 'tmp/teams'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  generateSessionId(baseAgentName) {
    const timestamp = Date.now();
    const pid = process.pid;
    const random = crypto.randomBytes(4).toString('hex');
    
    // Format: team-role-timestamp-pid-random
    return `${baseAgentName}-${timestamp}-${pid}-${random}`;
  }

  detectConflicts() {
    const conflicts = [];
    const sessionFiles = fs.readdirSync(this.sessionsDir)
      .filter(file => file.endsWith('.lock'));
    
    if (sessionFiles.length <= 1) {
      return conflicts; // No conflicts
    }

    // Group sessions by base agent name (before timestamp)
    const sessionGroups = {};
    
    sessionFiles.forEach(file => {
      const sessionId = file.replace('.lock', '');
      const parts = sessionId.split('-');
      
      // Extract base name (team-role or team-role-number)
      let baseName = parts.slice(0, 3).join('-');
      if (parts[2] && /^\d+$/.test(parts[2])) {
        baseName = parts.slice(0, 3).join('-');
      } else {
        baseName = parts.slice(0, 2).join('-');
      }
      
      if (!sessionGroups[baseName]) {
        sessionGroups[baseName] = [];
      }
      
      sessionGroups[baseName].push({
        sessionId,
        file,
        baseName
      });
    });

    // Find groups with multiple sessions
    Object.entries(sessionGroups).forEach(([baseName, sessions]) => {
      if (sessions.length > 1) {
        conflicts.push({
          type: 'MULTI_SESSION',
          baseName,
          sessions: sessions.map(s => s.sessionId),
          count: sessions.length
        });
      }
    });

    return conflicts;
  }

  logConflict(conflict) {
    const logEntry = `[${new Date().toISOString()}] ${conflict.type}: ${conflict.baseName} (${conflict.count} sessions: ${conflict.sessions.join(', ')})`;
    
    try {
      fs.appendFileSync(this.conflictsLog, logEntry + '\n');
      console.log('⚠️  Conflict detected:', logEntry);
    } catch (error) {
      console.warn('Warning: Could not log conflict:', error.message);
    }
  }

  resolveConflict(conflict) {
    const resolvedSessions = [];
    
    conflict.sessions.forEach((sessionId, index) => {
      const sessionFile = `${this.sessionsDir}/${sessionId}.lock`;
      
      if (index === 0) {
        // Keep first session as primary
        resolvedSessions.push({
          sessionId,
          status: 'PRIMARY',
          action: 'KEPT'
        });
      } else {
        // Rename other sessions with suffix
        const newSessionId = `${sessionId}-alt${index}`;
        const newSessionFile = `${this.sessionsDir}/${newSessionId}.lock`;
        
        try {
          if (fs.existsSync(sessionFile)) {
            fs.renameSync(sessionFile, newSessionFile);
            
            // Update related files
            this.updateRelatedFiles(sessionId, newSessionId);
            
            resolvedSessions.push({
              sessionId: newSessionId,
              originalId: sessionId,
              status: 'ALTERNATIVE',
              action: 'RENAMED'
            });
          }
        } catch (error) {
          console.warn(`Warning: Could not rename session ${sessionId}:`, error.message);
        }
      }
    });

    // Log resolution
    const resolutionEntry = `[${new Date().toISOString()}] RESOLVED: ${conflict.baseName} - ${resolvedSessions.length} sessions resolved`;
    fs.appendFileSync(this.conflictsLog, resolutionEntry + '\n');
    
    console.log('✅ Conflict resolved:', resolutionEntry);
    return resolvedSessions;
  }

  updateRelatedFiles(oldSessionId, newSessionId) {
    // Update status file
    const oldStatusFile = `${this.statusDir}/${oldSessionId}.md`;
    const newStatusFile = `${this.statusDir}/${newSessionId}.md`;
    
    if (fs.existsSync(oldStatusFile)) {
      try {
        fs.renameSync(oldStatusFile, newStatusFile);
      } catch (error) {
        console.warn(`Warning: Could not rename status file: ${error.message}`);
      }
    }

    // Update updates file
    const oldUpdatesFile = `${this.updatesDir}/${oldSessionId}.log`;
    const newUpdatesFile = `${this.updatesDir}/${newSessionId}.log`;
    
    if (fs.existsSync(oldUpdatesFile)) {
      try {
        fs.renameSync(oldUpdatesFile, newUpdatesFile);
      } catch (error) {
        console.warn(`Warning: Could not rename updates file: ${error.message}`);
      }
    }
  }

  cleanupExpiredSessions() {
    const expirationTime = 60 * 60 * 1000; // 1 hour
    const now = Date.now();
    
    let cleanedCount = 0;
    
    try {
      const sessionFiles = fs.readdirSync(this.sessionsDir)
        .filter(file => file.endsWith('.lock'));
      
      sessionFiles.forEach(file => {
        const sessionPath = path.join(this.sessionsDir, file);
        const stat = fs.statSync(sessionPath);
        
        if (now - stat.mtime.getTime() > expirationTime) {
          const sessionId = file.replace('.lock', '');
          
          // Remove session files
          fs.unlinkSync(sessionPath);
          
          // Remove related files
          const statusFile = `${this.statusDir}/${sessionId}.md`;
          const updatesFile = `${this.updatesDir}/${sessionId}.log`;
          
          if (fs.existsSync(statusFile)) fs.unlinkSync(statusFile);
          if (fs.existsSync(updatesFile)) fs.unlinkSync(updatesFile);
          
          cleanedCount++;
        }
      });
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
      }
      
    } catch (error) {
      console.warn('Warning: Error during cleanup:', error.message);
    }
  }

  registerSession(agentName) {
    // Check for existing sessions and resolve conflicts
    const conflicts = this.detectConflicts();
    const resolvedSessions = [];
    
    conflicts.forEach(conflict => {
      this.logConflict(conflict);
      const resolved = this.resolveConflict(conflict);
      resolvedSessions.push(...resolved);
    });

    // Generate unique session ID
    const sessionId = this.generateSessionId(agentName);
    const sessionFile = `${this.sessionsDir}/${sessionId}.lock`;
    
    // Create session lock
    const sessionData = {
      agentName,
      sessionId,
      startTime: new Date().toISOString(),
      pid: process.pid,
      conflicts: resolvedSessions.length > 0 ? resolvedSessions : null
    };
    
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
    
    console.log(`🔒 Session registered: ${sessionId}`);
    
    return {
      sessionId,
      conflicts: resolvedSessions,
      sessionData
    };
  }

  getActiveSession() {
    // Try to detect session from environment or current directory
    if (process.env.AGENT_SESSION_ID) {
      return process.env.AGENT_SESSION_ID;
    }

    // Look for most recent session
    try {
      const sessionFiles = fs.readdirSync(this.sessionsDir)
        .filter(file => file.endsWith('.lock'))
        .map(file => {
          const sessionPath = path.join(this.sessionsDir, file);
          const stat = fs.statSync(sessionPath);
          return {
            sessionId: file.replace('.lock', ''),
            mtime: stat.mtime.getTime()
          };
        })
        .sort((a, b) => b.mtime - a.mtime);
      
      return sessionFiles.length > 0 ? sessionFiles[0].sessionId : null;
    } catch {
      return null;
    }
  }

  monitor() {
    console.log('🔍 Agent Session Monitor started...');
    
    setInterval(() => {
      this.cleanupExpiredSessions();
      
      const conflicts = this.detectConflicts();
      if (conflicts.length > 0) {
        conflicts.forEach(conflict => {
          this.logConflict(conflict);
          this.resolveConflict(conflict);
        });
      }
    }, 30000); // Check every 30 seconds
  }
}

// CLI execution
if (require.main === module) {
  const manager = new AgentSessionManager();
  
  const command = process.argv[2];
  const agentName = process.argv[3];
  
  switch (command) {
    case 'register':
      if (!agentName) {
        console.error('Usage: agent-session-manager.js register <agent-name>');
        process.exit(1);
      }
      const result = manager.registerSession(agentName);
      console.log(JSON.stringify(result, null, 2));
      break;
      
    case 'resolve':
      const conflicts = manager.detectConflicts();
      if (conflicts.length === 0) {
        console.log('✅ No conflicts detected');
      } else {
        conflicts.forEach(conflict => {
          manager.logConflict(conflict);
          manager.resolveConflict(conflict);
        });
      }
      break;
      
    case 'cleanup':
      manager.cleanupExpiredSessions();
      break;
      
    case 'monitor':
      manager.monitor();
      break;
      
    case 'status':
      const activeSession = manager.getActiveSession();
      console.log('Active Session:', activeSession || 'None');
      break;
      
    default:
      console.log(`
Agent Session Manager Commands:
  register <agent-name>  - Register new agent session
  resolve               - Resolve current conflicts
  cleanup              - Clean expired sessions
  monitor              - Start conflict monitoring
  status               - Show active session
`);
  }
}

module.exports = AgentSessionManager;