#!/usr/bin/env node

/**
 * Generate real-time multi-agent system dashboard using @akaoio/composer
 * Shows active teams, agent status, and system health
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

async function generateDashboard() {
  try {
    // Use dynamic import for ESM module - import Template directly
    const { Template } = await import('../projects/composer/dist/Template/index.js');
    
    // Load team configuration
    const teamConfig = yaml.load(fs.readFileSync('.claude/team.config.yaml', 'utf8'));
    
    // Load dashboard template
    const template = fs.readFileSync('teams/dashboard-template.hbs', 'utf8');
    
    // Collect system data
    const systemData = await collectSystemData(teamConfig);
    
    // Add health metrics to system data
    systemData.health = await collectHealthMetrics();
    
    console.log('📊 Generating real-time dashboard...');
    
    // Create Template instance
    const templateEngine = new Template(template, {
      data: systemData
    });
    
    // Render the dashboard
    const dashboardOutput = templateEngine.render();
    
    // Ensure tmp/teams directory exists
    if (!fs.existsSync('tmp/teams')) {
      fs.mkdirSync('tmp/teams', { recursive: true });
    }
    
    // Write dashboard
    fs.writeFileSync('tmp/teams/DASHBOARD.md', dashboardOutput);
    console.log('✅ Dashboard generated: tmp/teams/DASHBOARD.md');
    
    // Also write to current directory for easy access
    fs.writeFileSync('SYSTEM-DASHBOARD.md', dashboardOutput);
    console.log('✅ Dashboard copied to: SYSTEM-DASHBOARD.md');
    
  } catch (error) {
    console.error('❌ Error generating dashboard:', error.message);
    
    // Fallback to basic dashboard if composer fails
    console.log('📊 Generating fallback dashboard...');
    await generateFallbackDashboard();
  }
}

async function collectSystemData(teamConfig) {
  const now = new Date().toISOString();
  const teams = Object.values(teamConfig.teams);
  
  // Check for active workspaces
  let activeWorkspaces = [];
  let activityLog = [];
  let blockers = [];
  let activeSessions = [];
  let agentUpdates = [];
  let conflicts = [];
  
  try {
    if (fs.existsSync('tmp/teams')) {
      const teamDirs = fs.readdirSync('tmp/teams').filter(dir => 
        dir.includes('-') && fs.statSync(path.join('tmp/teams', dir)).isDirectory()
      );
      activeWorkspaces = teamDirs;
      
      // Collect active agent sessions
      if (fs.existsSync('tmp/teams/sessions')) {
        const sessionFiles = fs.readdirSync('tmp/teams/sessions').filter(f => f.endsWith('.lock'));
        activeSessions = sessionFiles.map(sessionFile => {
          const sessionId = sessionFile.replace('.lock', '');
          const sessionPath = path.join('tmp/teams/sessions', sessionFile);
          const countFile = path.join('tmp/teams/sessions', `${sessionId}.count`);
          const statusFile = path.join('tmp/teams/status', `${sessionId}.md`);
          
          let actionCount = '0';
          let status = 'Unknown';
          let lastUpdate = 'Unknown';
          
          try {
            if (fs.existsSync(countFile)) {
              actionCount = fs.readFileSync(countFile, 'utf8').trim();
            }
            if (fs.existsSync(statusFile)) {
              status = fs.readFileSync(statusFile, 'utf8').trim();
            }
            const sessionStats = fs.statSync(sessionPath);
            lastUpdate = sessionStats.mtime.toLocaleString();
          } catch (err) {
            console.log(`Warning: Could not read session data for ${sessionId}`);
          }
          
          return {
            SESSION_ID: sessionId,
            ACTION_COUNT: actionCount,
            STATUS: status,
            LAST_UPDATE: lastUpdate
          };
        });
      }
      
      // Collect agent update files
      if (fs.existsSync('tmp/teams/updates')) {
        const updateFiles = fs.readdirSync('tmp/teams/updates').filter(f => f.endsWith('.log'));
        agentUpdates = updateFiles.map(updateFile => {
          const agentId = updateFile.replace('.log', '');
          const updatePath = path.join('tmp/teams/updates', updateFile);
          
          let recentUpdates = '';
          try {
            const updates = fs.readFileSync(updatePath, 'utf8')
              .split('\n')
              .filter(line => line.trim())
              .slice(-5);
            recentUpdates = updates.join('\n');
          } catch (err) {
            recentUpdates = 'Could not read updates';
          }
          
          return {
            AGENT_ID: agentId,
            RECENT_UPDATES: recentUpdates
          };
        });
      }
      
      // Load conflicts if exists
      if (fs.existsSync('tmp/teams/conflicts.log')) {
        const conflictsContent = fs.readFileSync('tmp/teams/conflicts.log', 'utf8');
        const conflictLines = conflictsContent.split('\n').filter(line => line.trim());
        conflicts = conflictLines.slice(-5).map(line => ({
          timestamp: line.match(/\[(.*?)\]/)?.[1] || 'Unknown',
          message: line.replace(/\[.*?\]\s*/, '')
        }));
      }
      
      // Load activity log if exists
      if (fs.existsSync('tmp/teams/activity.log')) {
        const log = fs.readFileSync('tmp/teams/activity.log', 'utf8')
          .split('\n')
          .filter(line => line.trim())
          .slice(-10)
          .map(line => ({
            timestamp: line.match(/\[(.*?)\]/)?.[1] || 'Unknown',
            message: line.replace(/\[.*?\]\s*/, '')
          }));
        activityLog = log.reverse();
      }
      
      // Load blockers if exists
      if (fs.existsSync('tmp/teams/BLOCKERS.md')) {
        const blockersContent = fs.readFileSync('tmp/teams/BLOCKERS.md', 'utf8');
        // Parse blockers (simple format for now)
        const blockerLines = blockersContent.split('\n').filter(line => line.includes('BLOCKED:'));
        blockers = blockerLines.slice(-5).map(line => ({
          team: 'Unknown',
          message: line.replace(/BLOCKED:\s*/, ''),
          timestamp: 'Recent'
        }));
      }
    }
  } catch (err) {
    console.log('ℹ️ No existing team activity found');
  }
  
  // Enhance teams with activity data
  const enhancedTeams = teams.map(team => {
    const activeWorkspace = activeWorkspaces.find(ws => ws.startsWith(`${team.id}-`));
    return {
      ...team,
      ACTIVE: !!activeWorkspace,
      WORKSPACE: activeWorkspace || null,
      ACTIVE_SINCE: activeWorkspace ? 'Recently' : null,
      LAST_UPDATE: activeWorkspace ? 'Active' : null
    };
  });
  
  return {
    TIMESTAMP: now,
    TEAM_COUNT: teams.length,
    AGENT_COUNT: teams.reduce((sum, team) => sum + team.members.length, 0),
    ACTIVE_WORKSPACES: activeWorkspaces.length,
    ACTIVE_SESSIONS_COUNT: activeSessions.length,
    SYSTEM_STATUS: activeSessions.length > 0 ? 'Active' : (activeWorkspaces.length > 0 ? 'Legacy Active' : 'Idle'),
    TEAMS: enhancedTeams,
    ACTIVITY_LOG: activityLog,
    ACTIVE_SESSIONS: activeSessions,
    AGENT_UPDATES: agentUpdates,
    BLOCKERS: blockers,
    CONFLICTS: conflicts,
    UPDATE_FREQUENCY: 3
  };
}

async function collectHealthMetrics() {
  const health = {
    score: 100,
    status: 'Healthy',
    issues: [],
    lastCheck: new Date().toISOString(),
    metrics: {
      activeAgents: 0,
      staleWorkspaces: 0,
      stuckAgents: 0,
      conflicts: 0,
      dashboardAge: 0
    }
  };

  try {
    // Load health status if available
    if (fs.existsSync('tmp/teams/health.status')) {
      const healthContent = fs.readFileSync('tmp/teams/health.status', 'utf8');
      const scoreMatch = healthContent.match(/SYSTEM_HEALTH_SCORE: (\d+)/);
      if (scoreMatch) {
        health.score = parseInt(scoreMatch[1]);
      }
    }

    // Load health issues if available  
    if (fs.existsSync('tmp/teams/health-issues.log')) {
      const issuesContent = fs.readFileSync('tmp/teams/health-issues.log', 'utf8');
      health.issues = issuesContent.split('\n').filter(line => line.trim() && !line.includes('HEALTH ISSUES'));
    }

    // Calculate metrics
    const staleWorkspaces = await new Promise(resolve => {
      require('child_process').exec('find tmp/teams -name "*-*" -type d -mmin +120 2>/dev/null | wc -l', 
        (error, stdout) => resolve(error ? 0 : parseInt(stdout.trim()))
      );
    });

    health.metrics.staleWorkspaces = staleWorkspaces;

    // Count active sessions
    if (fs.existsSync('tmp/teams/sessions')) {
      const sessionFiles = fs.readdirSync('tmp/teams/sessions').filter(f => f.endsWith('.lock'));
      health.metrics.activeAgents = sessionFiles.length;
    }

    // Check dashboard age
    if (fs.existsSync('SYSTEM-DASHBOARD.md')) {
      const stats = fs.statSync('SYSTEM-DASHBOARD.md');
      health.metrics.dashboardAge = Math.round((Date.now() - stats.mtime.getTime()) / 60000);
    }

    // Determine health status
    if (health.score >= 90) health.status = 'Excellent';
    else if (health.score >= 80) health.status = 'Good';
    else if (health.score >= 70) health.status = 'Fair';
    else if (health.score >= 50) health.status = 'Poor';
    else health.status = 'Critical';

  } catch (error) {
    console.error('Error collecting health metrics:', error.message);
    health.issues.push(`Health collection error: ${error.message}`);
  }

  return health;
}

async function generateFallbackDashboard() {
  const teamConfig = yaml.load(fs.readFileSync('.claude/team.config.yaml', 'utf8'));
  const teams = Object.values(teamConfig.teams);
  
  let dashboard = `# Multi-Agent System Dashboard (Fallback)\n*Generated at: ${new Date().toISOString()}*\n\n`;
  
  dashboard += `## System Overview\n`;
  dashboard += `- Total Teams: ${teams.length}\n`;
  dashboard += `- Total Agents: ${teams.reduce((sum, team) => sum + team.members.length, 0)}\n\n`;
  
  dashboard += `## Teams\n`;
  teams.forEach(team => {
    dashboard += `### ${team.id}\n`;
    dashboard += `${team.description}\n`;
    dashboard += `Members: ${team.members.map(m => m.role).join(', ')}\n\n`;
  });
  
  fs.writeFileSync('tmp/teams/DASHBOARD.md', dashboard);
  fs.writeFileSync('SYSTEM-DASHBOARD.md', dashboard);
  console.log('✅ Fallback dashboard generated');
}

// Run if called directly
if (require.main === module) {
  generateDashboard();
}

module.exports = { generateDashboard };