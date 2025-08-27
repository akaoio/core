#!/usr/bin/env node

/**
 * Launch the Living Agent Network Dashboard
 * Uses @akaoio/dashboard to monitor the multi-agent system
 */

// Import directly from source since we're in a workspace
import { Dashboard } from '../projects/dashboard/dist/Dashboard.js';
import { Color } from '@akaoio/tui';

// Use our own TUI for colors!
const color = new Color();

console.log(color.cyan('🚀 Launching AIR Living Agent Network Dashboard...\n'));

const dashboard = new Dashboard({
  title: '@akaoio/core - Living Agent Network',
  peers: ['https://air.akao.io:8765/gun']
});

// Start dashboard
dashboard.start().then(() => {
  console.log(color.green('✅ Dashboard connected to AIR network\n'));
  
  // Simulate connecting our 34 agents
  const teams = [
    { id: 'meta', team: 'meta', role: 'orchestrator' },
    { id: 'fix', team: 'core-fix', role: 'coordinator' },
    { id: 'repair', team: 'core-fix', role: 'fixer' },
    { id: 'link', team: 'integration', role: 'coordinator' },
    { id: 'bridge', team: 'integration', role: 'integrator' },
    { id: 'feat', team: 'feature-dev', role: 'coordinator' },
    { id: 'build', team: 'feature-dev', role: 'developer' },
    { id: 'audit', team: 'security', role: 'auditor' },
    { id: 'shield', team: 'security', role: 'hardener' },
    { id: 'watch', team: 'integrity', role: 'sentinel' },
    { id: 'enforce', team: 'integrity', role: 'enforcer' },
    { id: 'guard', team: 'integrity', role: 'inspector' },
    { id: 'check', team: 'integrity', role: 'validator' },
    { id: 'net', team: 'team-access', role: 'guardian' },
    { id: 'dns', team: 'team-access', role: 'maintainer' },
    { id: 'speed', team: 'team-access', role: 'optimizer' },
    { id: 'sync', team: 'team-air', role: 'developer' },
    { id: 'p2p', team: 'team-air', role: 'architect' },
    { id: 'mesh', team: 'team-air', role: 'guardian' },
    { id: 'test', team: 'team-battle', role: 'architect' },
    { id: 'pty', team: 'team-battle', role: 'developer' },
    { id: 'verify', team: 'team-battle', role: 'validator' },
    { id: 'compile', team: 'team-builder', role: 'architect' },
    { id: 'bundle', team: 'team-builder', role: 'developer' },
    { id: 'optimize', team: 'team-builder', role: 'optimizer' },
    { id: 'doc', team: 'team-composer', role: 'architect' },
    { id: 'template', team: 'team-composer', role: 'developer' },
    { id: 'atom', team: 'team-composer', role: 'integrator' },
    { id: 'term', team: 'team-tui', role: 'designer' },
    { id: 'cli', team: 'team-tui', role: 'developer' },
    { id: 'keys', team: 'team-tui', role: 'accessibility' },
    { id: 'web', team: 'team-ui', role: 'architect' },
    { id: 'component', team: 'team-ui', role: 'developer' },
    { id: 'style', team: 'team-ui', role: 'designer' }
  ];
  
  console.log(color.yellow('🤖 Connecting 34 agents to the network...\n'));
  
  // Connect agents with delays for visual effect
  teams.forEach((agent, index) => {
    setTimeout(async () => {
      await dashboard.connectAgent(agent.id, agent);
      await dashboard.sendMessage(agent.id, `${agent.id} agent online and ready!`, { team: agent.team });
      
      if (index === teams.length - 1) {
        console.log(color.green('\n✅ All 34 agents connected!\n'));
        console.log(color.cyan('Dashboard is running. Press Ctrl+C to exit.\n'));
      }
    }, index * 200);
  });
  
}).catch(error => {
  console.error(color.red('❌ Failed to start dashboard:'), error);
  process.exit(1);
});

// Handle exit
process.on('SIGINT', () => {
  console.log(color.yellow('\n👋 Shutting down dashboard...'));
  dashboard.stop();
  process.exit(0);
});