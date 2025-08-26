#!/usr/bin/env node

/**
 * Real-time Dashboard Generator for @akaoio/core Team Coordination
 * Uses @akaoio/composer to generate dashboard from atomic data
 */

const fs = require('fs');
const path = require('path');

class DashboardGenerator {
  constructor() {
    this.dashboardDir = 'tmp/teams/dashboard';
    this.sessionsDir = 'tmp/teams/sessions';
    this.updatesDir = 'tmp/teams/updates';
    this.statusDir = 'tmp/teams/status';
    
    this.ensureDirs();
  }

  ensureDirs() {
    const dirs = [
      this.dashboardDir,
      `${this.dashboardDir}/agent-activities`,
      `${this.dashboardDir}/team-summaries`,
      this.sessionsDir,
      this.updatesDir,
      this.statusDir
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  collectActiveAgents() {
    const agents = [];
    
    try {
      const sessionFiles = fs.readdirSync(this.sessionsDir)
        .filter(file => file.endsWith('.lock'));
      
      for (const sessionFile of sessionFiles) {
        const agentId = sessionFile.replace('.lock', '');
        const sessionPath = path.join(this.sessionsDir, sessionFile);
        const sessionStat = fs.statSync(sessionPath);
        
        // Consider session active if updated within last 5 minutes
        const sessionAge = Date.now() - sessionStat.mtime.getTime();
        if (sessionAge > 5 * 60 * 1000) continue; // 5 minutes
        
        const agent = {
          AGENT_ID: agentId,
          SESSION_DURATION: this.formatDuration(sessionAge),
          ACTION_COUNT: 0,
          RECENT_ACTIVITIES: []
        };

        // Parse agent ID for team and role
        const parts = agentId.split('-');
        if (parts.length >= 3) {
          agent.TEAM_ID = parts[1];
          agent.ROLE = parts[2];
        }

        // Get current activity
        const activityPath = `${this.dashboardDir}/agent-activities/${agentId}/current.md`;
        if (fs.existsSync(activityPath)) {
          agent.CURRENT_ACTIVITY = fs.readFileSync(activityPath, 'utf8').trim();
        }

        // Get status
        const statusPath = `${this.statusDir}/${agentId}.md`;
        if (fs.existsSync(statusPath)) {
          agent.STATUS = fs.readFileSync(statusPath, 'utf8').trim();
        }

        // Get recent activities
        const updatesPath = `${this.updatesDir}/${agentId}.log`;
        if (fs.existsSync(updatesPath)) {
          const updates = fs.readFileSync(updatesPath, 'utf8')
            .split('\n')
            .filter(line => line.trim())
            .slice(-5) // Last 5 activities
            .map(line => {
              const match = line.match(/\[(.*?)\] (.+)/);
              return match ? {
                TIMESTAMP: match[1],
                ACTIVITY: match[2]
              } : { ACTIVITY: line };
            });
          
          agent.RECENT_ACTIVITIES = updates;
          agent.ACTION_COUNT = updates.length;
          agent.LAST_UPDATE = updates[updates.length - 1]?.TIMESTAMP || 'Never';
        }

        agents.push(agent);
      }
    } catch (error) {
      console.warn('Error collecting active agents:', error.message);
    }

    return agents;
  }

  collectTeamSummaries(activeAgents) {
    const teams = {};
    
    activeAgents.forEach(agent => {
      if (!agent.TEAM_ID) return;
      
      if (!teams[agent.TEAM_ID]) {
        teams[agent.TEAM_ID] = {
          TEAM_ID: agent.TEAM_ID,
          ONLINE_MEMBERS: [],
          TEAM_FOCUS: 'Active development',
          COORDINATION_STATUS: 'Coordinated'
        };
      }
      
      teams[agent.TEAM_ID].ONLINE_MEMBERS.push({
        ROLE: agent.ROLE,
        CURRENT_ACTIVITY: agent.CURRENT_ACTIVITY || 'Working...',
        STATUS: agent.STATUS || 'Active'
      });
    });

    return Object.values(teams);
  }

  collectConflicts() {
    const conflicts = [];
    const conflictsPath = 'tmp/teams/conflicts.log';
    
    if (fs.existsSync(conflictsPath)) {
      const conflictLines = fs.readFileSync(conflictsPath, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .slice(-10); // Last 10 conflicts
      
      conflictLines.forEach(line => {
        if (line.includes('MULTI_SESSION')) {
          conflicts.push({
            CONFLICT_TYPE: 'Multi-Session',
            DESCRIPTION: 'Multiple agents detected',
            RESOLUTION_STATUS: 'Auto-resolving'
          });
        } else if (line.includes('RESOLVED')) {
          conflicts.push({
            CONFLICT_TYPE: 'Resolved',
            DESCRIPTION: line.replace('RESOLVED: ', ''),
            RESOLUTION_STATUS: 'Complete'
          });
        }
      });
    }
    
    return conflicts;
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  async generateDashboard() {
    try {
      // Collect all data
      const activeAgents = this.collectActiveAgents();
      const activeTeams = this.collectTeamSummaries(activeAgents);
      const conflicts = this.collectConflicts();
      
      const dashboardData = {
        TIMESTAMP: new Date().toISOString(),
        ACTIVE_AGENTS: activeAgents,
        ACTIVE_TEAMS: activeTeams,
        SESSION_HEALTH_STATUS: activeAgents.length > 0 ? 'Healthy' : 'Idle',
        CONFLICTS: conflicts.filter(c => c.RESOLUTION_STATUS !== 'Complete'),
        SESSION_WARNINGS: [],
        TOTAL_ACTIONS: activeAgents.reduce((sum, agent) => sum + agent.ACTION_COUNT, 0),
        COORDINATION_EVENTS: activeTeams.length,
        CONFLICTS_RESOLVED: conflicts.filter(c => c.RESOLUTION_STATUS === 'Complete').length,
        DASHBOARD_UPDATES: this.getDashboardUpdateCount()
      };

      // Try to use composer for template rendering
      try {
        const { Template } = await import('../projects/composer/dist/Template/index.js');
        const templateContent = fs.readFileSync('docs/templates/dashboard-main.hbs', 'utf8');
        
        const template = new Template(templateContent, {
          data: dashboardData
        });
        
        const output = template.render();
        
        // Write main dashboard
        fs.writeFileSync(`${this.dashboardDir}/current-state.md`, output);
        
        // Write big picture summary
        const bigPictureContent = this.generateBigPicture(dashboardData);
        fs.writeFileSync(`${this.dashboardDir}/big-picture.md`, bigPictureContent);
        
        // Write team summaries
        activeTeams.forEach(team => {
          const teamContent = this.generateTeamSummary(team);
          fs.writeFileSync(`${this.dashboardDir}/team-summaries/${team.TEAM_ID}.md`, teamContent);
        });
        
        console.log(`✅ Dashboard generated with ${activeAgents.length} active agents`);
        
      } catch (composerError) {
        console.warn('Composer unavailable, using fallback generation:', composerError.message);
        
        // Fallback generation
        const fallbackContent = this.generateFallbackDashboard(dashboardData);
        fs.writeFileSync(`${this.dashboardDir}/current-state.md`, fallbackContent);
      }
      
    } catch (error) {
      console.error('Error generating dashboard:', error.message);
    }
  }

  generateBigPicture(data) {
    return `# 🌟 Big Picture System Status

**Active Agents**: ${data.ACTIVE_AGENTS.length}
**Active Teams**: ${data.ACTIVE_TEAMS.length}  
**System Health**: ${data.SESSION_HEALTH_STATUS}
**Total Actions**: ${data.TOTAL_ACTIONS}

## Current Focus Areas
${data.ACTIVE_TEAMS.map(team => 
  `- **${team.TEAM_ID}**: ${team.ONLINE_MEMBERS.length} members active`
).join('\n')}

## Recent Activity Summary
${data.ACTIVE_AGENTS.slice(0, 3).map(agent => 
  `- **${agent.AGENT_ID}**: ${agent.CURRENT_ACTIVITY || 'Active'}`
).join('\n')}

*Generated: ${data.TIMESTAMP}*`;
  }

  generateTeamSummary(team) {
    return `# Team ${team.TEAM_ID} Status

**Members Online**: ${team.ONLINE_MEMBERS.length}
**Coordination**: ${team.COORDINATION_STATUS}

## Active Members
${team.ONLINE_MEMBERS.map(member => 
  `- **${member.ROLE}**: ${member.CURRENT_ACTIVITY} (${member.STATUS})`
).join('\n')}

*Updated: ${new Date().toISOString()}*`;
  }

  generateFallbackDashboard(data) {
    return `# 🚀 @akaoio/core Team Dashboard

*Generated: ${data.TIMESTAMP}*

## System Status
- **Active Agents**: ${data.ACTIVE_AGENTS.length}
- **Active Teams**: ${data.ACTIVE_TEAMS.length}
- **Health**: ${data.SESSION_HEALTH_STATUS}

## Active Agents
${data.ACTIVE_AGENTS.map(agent => 
  `### ${agent.AGENT_ID}\n- **Current**: ${agent.CURRENT_ACTIVITY || 'Working...'}\n- **Status**: ${agent.STATUS || 'Active'}`
).join('\n\n')}

## Team Coordination
${data.ACTIVE_TEAMS.map(team => 
  `### ${team.TEAM_ID}\n- **Members**: ${team.ONLINE_MEMBERS.length} online\n- **Status**: ${team.COORDINATION_STATUS}`
).join('\n\n')}
`;
  }

  getDashboardUpdateCount() {
    try {
      const updateMarkerPath = `${this.dashboardDir}/.update-count`;
      let count = 0;
      
      if (fs.existsSync(updateMarkerPath)) {
        count = parseInt(fs.readFileSync(updateMarkerPath, 'utf8')) || 0;
      }
      
      count++;
      fs.writeFileSync(updateMarkerPath, count.toString());
      return count;
    } catch {
      return 1;
    }
  }
}

// CLI execution
if (require.main === module) {
  const generator = new DashboardGenerator();
  generator.generateDashboard();
}

module.exports = DashboardGenerator;