#!/usr/bin/env node
// Smart Agent Router - File-based agent discovery and routing
// Analyzes context and routes to the best agent without Air dependency

const fs = require('fs');
const path = require('path');

class SmartAgentRouter {
  constructor() {
    this.agentData = this.loadAgentData();
    this.systemState = this.loadSystemState();
  }

  loadAgentData() {
    try {
      const agentFile = path.join(__dirname, '../agent-short-names.json');
      return JSON.parse(fs.readFileSync(agentFile, 'utf8'));
    } catch (error) {
      console.error('Failed to load agent data:', error.message);
      return { agentList: [], categories: {} };
    }
  }

  loadSystemState() {
    const state = {
      activeAgents: [],
      systemHealth: 100,
      currentProjects: [],
      recentActivity: [],
      blockers: []
    };

    try {
      // Load active agents
      const sessionsDir = 'tmp/teams/sessions';
      if (fs.existsSync(sessionsDir)) {
        state.activeAgents = fs.readdirSync(sessionsDir)
          .filter(f => f.endsWith('.lock'))
          .map(f => f.replace('.lock', ''));
      }

      // Load health score
      const healthFile = 'tmp/teams/health.status';
      if (fs.existsSync(healthFile)) {
        const healthContent = fs.readFileSync(healthFile, 'utf8');
        const match = healthContent.match(/SYSTEM_HEALTH_SCORE: (\d+)/);
        if (match) state.systemHealth = parseInt(match[1]);
      }

      // Load recent activity
      const activityFile = 'tmp/teams/activity.log';
      if (fs.existsSync(activityFile)) {
        const lines = fs.readFileSync(activityFile, 'utf8').split('\n');
        state.recentActivity = lines.slice(-10).filter(l => l.trim());
      }

    } catch (error) {
      console.error('Error loading system state:', error.message);
    }

    return state;
  }

  analyzeContext(userInput) {
    const input = userInput.toLowerCase();
    const context = {
      keywords: this.extractKeywords(input),
      intent: this.detectIntent(input),
      urgency: this.detectUrgency(input),
      scope: this.detectScope(input)
    };

    return context;
  }

  extractKeywords(input) {
    const keywordMap = {
      fix: ['fix', 'sửa', 'bug', 'error', 'broken', 'fail', 'repair'],
      feature: ['feature', 'tính năng', 'implement', 'add', 'create', 'build'],
      integrate: ['integrate', 'tích hợp', 'compatibility', 'merge', 'connect'],
      test: ['test', 'testing', 'pty', 'battle', 'verify', 'check'],
      build: ['build', 'compile', 'bundle', 'builder', 'compilation'],
      ui: ['ui', 'interface', 'component', 'frontend', 'web', 'tui', 'terminal'],
      docs: ['docs', 'documentation', 'composer', 'template', 'generate'],
      security: ['security', 'audit', 'vulnerability', 'secure', 'hardening'],
      network: ['network', 'dns', 'access', 'connection', 'p2p'],
      system: ['system', 'meta', 'orchestrate', 'overview', 'explain'],
      work: ['work', 'làm việc', 'start', 'begin']
    };

    const found = {};
    for (const [category, words] of Object.entries(keywordMap)) {
      found[category] = words.some(word => input.includes(word));
    }

    return found;
  }

  detectIntent(input) {
    if (input.includes('explain') || input.includes('what') || input.includes('how')) {
      return 'explain';
    }
    if (input.includes('fix') || input.includes('sửa') || input.includes('repair')) {
      return 'fix';
    }
    if (input.includes('implement') || input.includes('create') || input.includes('add')) {
      return 'implement';
    }
    if (input.includes('test') || input.includes('verify') || input.includes('check')) {
      return 'test';
    }
    if (input.includes('work') || input.includes('làm việc')) {
      return 'work';
    }
    return 'unknown';
  }

  detectUrgency(input) {
    const urgentWords = ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'broken'];
    const highWords = ['important', 'priority', 'soon', 'needed'];
    
    if (urgentWords.some(word => input.includes(word))) return 'urgent';
    if (highWords.some(word => input.includes(word))) return 'high';
    return 'normal';
  }

  detectScope(input) {
    if (input.includes('all') || input.includes('entire') || input.includes('system')) {
      return 'system-wide';
    }
    if (input.includes('project') || input.includes('package')) {
      return 'project';
    }
    return 'component';
  }

  routeAgent(userInput) {
    const context = this.analyzeContext(userInput);
    const recommendations = [];

    // System health considerations
    if (this.systemState.systemHealth < 70) {
      recommendations.push({
        agent: 'meta',
        reason: 'System health critical - need orchestrator',
        priority: 'urgent'
      });
    }

    // Intent-based routing
    switch (context.intent) {
      case 'fix':
        if (context.keywords.test) {
          recommendations.push({ agent: 'verify', reason: 'Test failure fix needed', priority: 'high' });
        } else if (context.keywords.build) {
          recommendations.push({ agent: 'compile', reason: 'Build failure fix needed', priority: 'high' });
        } else {
          recommendations.push({ agent: 'fix', reason: 'General bug fix needed', priority: 'high' });
        }
        break;

      case 'implement':
        if (context.keywords.ui) {
          recommendations.push({ agent: 'component', reason: 'UI feature implementation', priority: 'medium' });
        } else if (context.keywords.docs) {
          recommendations.push({ agent: 'doc', reason: 'Documentation feature', priority: 'medium' });
        } else {
          recommendations.push({ agent: 'build', reason: 'General feature implementation', priority: 'medium' });
        }
        break;

      case 'explain':
        if (context.keywords.system || context.scope === 'system-wide') {
          recommendations.push({ agent: 'meta', reason: 'System explanation needed', priority: 'medium' });
        } else {
          recommendations.push({ agent: 'doc', reason: 'Documentation/explanation needed', priority: 'low' });
        }
        break;

      case 'work':
        // Smart work routing based on current system state
        const workAgent = this.smartWorkRouting(context);
        recommendations.push(workAgent);
        break;

      default:
        // Fallback routing based on keywords
        if (context.keywords.fix) {
          recommendations.push({ agent: 'fix', reason: 'Keywords suggest fix needed', priority: 'medium' });
        } else if (context.keywords.feature) {
          recommendations.push({ agent: 'feat', reason: 'Keywords suggest feature work', priority: 'medium' });
        } else {
          recommendations.push({ agent: 'meta', reason: 'Unclear intent - need orchestration', priority: 'low' });
        }
    }

    // Filter out busy agents
    const availableRecs = recommendations.filter(rec => {
      return !this.systemState.activeAgents.some(active => active.includes(rec.agent));
    });

    return availableRecs.length > 0 ? availableRecs[0] : recommendations[0];
  }

  smartWorkRouting(context) {
    // Analyze system state for smart work routing
    const activity = this.systemState.recentActivity.join(' ').toLowerCase();

    if (activity.includes('error') || activity.includes('fail')) {
      return { agent: 'fix', reason: 'Recent errors detected in activity', priority: 'high' };
    }

    if (activity.includes('test') && activity.includes('fail')) {
      return { agent: 'verify', reason: 'Test failures in recent activity', priority: 'high' };
    }

    if (this.systemState.systemHealth < 80) {
      return { agent: 'meta', reason: 'System health degraded - need oversight', priority: 'medium' };
    }

    // Default to feature development if system is stable
    return { agent: 'feat', reason: 'System stable - ready for feature work', priority: 'medium' };
  }

  displayRoute(recommendation, userInput) {
    console.log('\n🎯 Smart Agent Routing Result');
    console.log('=====================================');
    console.log(`Input: ${userInput}`);
    console.log(`Recommended Agent: ${recommendation.agent}`);
    console.log(`Reason: ${recommendation.reason}`);
    console.log(`Priority: ${recommendation.priority}`);
    console.log(`System Health: ${this.systemState.systemHealth}%`);
    console.log(`Active Agents: ${this.systemState.activeAgents.length}`);
    
    // Find agent details
    const agentDetails = this.agentData.agentList.find(a => a.shortName === recommendation.agent);
    if (agentDetails) {
      console.log(`\nAgent Details:`);
      console.log(`  Full Name: ${agentDetails.fullName}`);
      console.log(`  Team: ${agentDetails.team}`);
      console.log(`  Role: ${agentDetails.role}`);
      console.log(`  Specialization: ${agentDetails.specialization}`);
    }

    return recommendation;
  }
}

// CLI Interface
if (require.main === module) {
  const router = new SmartAgentRouter();
  const userInput = process.argv.slice(2).join(' ') || 'work';
  const recommendation = router.routeAgent(userInput);
  router.displayRoute(recommendation, userInput);
}

module.exports = SmartAgentRouter;