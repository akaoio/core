#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load configurations
const teamConfig = yaml.load(fs.readFileSync('.claude/team.config.yaml', 'utf8'));
const template = fs.readFileSync('teams/templates/agent.hbs', 'utf8');

// Load components
const components = {
  identity: fs.readFileSync('teams/components/identity.md', 'utf8'),
  awareness: fs.readFileSync('teams/components/awareness.md', 'utf8'),
  protocol: fs.readFileSync('teams/components/protocol.md', 'utf8'),
  coordination: fs.readFileSync('teams/components/coordination.md', 'utf8'),
  activation: fs.readFileSync('teams/components/activation.md', 'utf8')
};

// Load roles
const roles = {};
const roleFiles = fs.readdirSync('teams/roles');
roleFiles.forEach(file => {
  const roleName = path.basename(file, '.yaml');
  roles[roleName] = yaml.load(fs.readFileSync(`teams/roles/${file}`, 'utf8'));
});

// Generate agents for each team
Object.entries(teamConfig.teams).forEach(([teamKey, team]) => {
  team.members.forEach((member, index) => {
    const role = roles[member.role] || {};
    const agentName = `team-${team.id}-${member.role}${index > 0 ? `-${index + 1}` : ''}`;
    const timestamp = new Date().toISOString();
    const workspace = `tmp/teams/${team.id}-${Date.now()}/`;
    
    // Prepare template variables
    const vars = {
      AGENT_NAME: agentName,
      MODEL: member.model || 'claude-3-5-sonnet-20241022',
      ROLE_DESCRIPTION: role.description || member.role,
      ACTIVATION_CONDITIONS: team.conditions.join(', '),
      TEAM_ID: team.id,
      SPECIALIZATION: member.specialization || role.description,
      EXAMPLE_CONTEXT: getExampleContext(member.role),
      EXAMPLE_TRIGGER: team.triggers[0],
      EXAMPLE_ACTION: getExampleAction(member.role),
      EXAMPLE_ISSUE: 'failing tests',
      EXAMPLE_COORDINATION: 'fixing issues across packages',
      IDENTITY_COMPONENT: replaceVars(components.identity, {
        ROLE: member.role,
        TEAM_ID: team.id,
        AGENT_ID: agentName,
        WORKSPACE: workspace,
        SESSION_ID: 'tmux-session',
        TIMESTAMP: timestamp
      }),
      AWARENESS_COMPONENT: replaceVars(components.awareness, {
        TEAM_ID: team.id,
        AGENT_ID: agentName,
        TIMESTAMP: timestamp
      }),
      ROLE: member.role.toUpperCase(),
      ROLE_CAPABILITIES: formatList(role.capabilities),
      ROLE_RESPONSIBILITIES: role.responsibilities,
      TEAM_MEMBERS: team.members.map(m => ({
        role: m.role,
        description: roles[m.role]?.description || m.role
      })),
      COORDINATION_COMPONENT: replaceVars(components.coordination, {
        PACKAGE: '{{PACKAGE}}'
      }),
      WORKSPACE: workspace,
      PROTOCOL_COMPONENT: replaceVars(components.protocol, {
        WORKSPACE: workspace,
        STATUS: 'active',
        PROGRESS: '0',
        CURRENT_TASK: 'initializing',
        NEXT_STEPS: 'analyze system',
        BLOCKERS: 'none',
        TIMESTAMP: timestamp,
        DECISION: '{{DECISION}}',
        REASON: '{{REASON}}'
      }),
      ROLE_COMMANDS: role.commands,
      ACTIVATION_COMPONENT: replaceVars(components.activation, {
        ACTIVATION_REASON: 'System detected ' + team.conditions.join(' and '),
        FAILING_TESTS: '{{FAILING_TESTS}}',
        BUILD_ERRORS: '{{BUILD_ERRORS}}',
        INTEGRATION_ISSUES: '{{INTEGRATION_ISSUES}}',
        MISSION: team.description
      }),
      TRIGGER: team.triggers[0],
      TIMESTAMP: timestamp,
      CUSTOM_INSTRUCTIONS: member.custom_instructions || ''
    };
    
    // Generate agent file
    let agentContent = template;
    Object.entries(vars).forEach(([key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Skip objects for now
        return;
      }
      if (Array.isArray(value)) {
        // Handle arrays specially for Handlebars
        const arrayStr = value.map(item => {
          if (typeof item === 'object') {
            return `- ${item.role}: ${item.description}`;
          }
          return `- ${item}`;
        }).join('\\n');
        agentContent = agentContent.replace(new RegExp(`{{#each ${key}}}[\\s\\S]*?{{/each}}`, 'g'), arrayStr);
      } else {
        agentContent = agentContent.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
      }
    });
    
    // Clean up any remaining Handlebars syntax
    agentContent = agentContent.replace(/{{#if.*?}}[\\s\\S]*?{{\/if}}/g, '');
    agentContent = agentContent.replace(/{{.*?}}/g, '');
    
    // Write agent file
    const agentPath = `.claude/agents/${agentName}.md`;
    fs.writeFileSync(agentPath, agentContent);
    console.log(`✅ Generated: ${agentPath}`);
  });
});

// Helper functions
function replaceVars(template, vars) {
  let result = template;
  Object.entries(vars).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return result;
}

function formatList(items) {
  if (!items || !Array.isArray(items)) return '';
  return items.map(item => `- ${item}`).join('\\n');
}

function getExampleContext(role) {
  const contexts = {
    coordinator: 'analyze project state and coordinate work',
    fixer: 'fix failing tests in multiple packages',
    integrator: 'resolve cross-package dependency issues',
    architect: 'design a new feature architecture',
    developer: 'implement a new feature',
    tester: 'verify implementation quality'
  };
  return contexts[role] || 'work on the project';
}

function getExampleAction(role) {
  const actions = {
    coordinator: 'analyze the situation and create a task plan',
    fixer: 'investigate and fix the failing tests',
    integrator: 'ensure all packages work together correctly',
    architect: 'design the technical specification',
    developer: 'implement the feature',
    tester: 'run comprehensive tests'
  };
  return actions[role] || 'complete the task';
}

console.log('\\n🎯 Agent generation complete!');
console.log('\\nTo activate teams, use these triggers:');
teamConfig.teams && Object.values(teamConfig.teams).forEach(team => {
  console.log(`- "${team.triggers[0]}" → ${team.id} team`);
});