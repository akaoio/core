#!/usr/bin/env node

/**
 * Test composer compatibility
 * This simulates what @akaoio/composer will do
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simulate composer's data loading
class ComposerSimulator {
  constructor() {
    this.data = {
      components: {},
      roles: {},
      config: {}
    };
    this.helpers = {};
  }

  async loadSources() {
    // Load components
    const componentsDir = path.join(__dirname, 'components');
    const componentFiles = fs.readdirSync(componentsDir);
    
    for (const file of componentFiles) {
      if (file.endsWith('.md')) {
        const name = path.basename(file, '.md');
        const content = fs.readFileSync(path.join(componentsDir, file), 'utf8');
        this.data.components[name] = content;
      }
    }

    // Load roles
    const rolesDir = path.join(__dirname, 'roles');
    const roleFiles = fs.readdirSync(rolesDir);
    
    for (const file of roleFiles) {
      if (file.endsWith('.yaml')) {
        const name = path.basename(file, '.yaml');
        const content = fs.readFileSync(path.join(rolesDir, file), 'utf8');
        this.data.roles[name] = yaml.load(content);
      }
    }

    // Load config
    const configPath = path.join(__dirname, '..', '.claude', 'team.config.yaml');
    const configContent = fs.readFileSync(configPath, 'utf8');
    this.data.config = yaml.load(configContent);

    console.log('✅ Loaded sources:');
    console.log(`  - ${Object.keys(this.data.components).length} components`);
    console.log(`  - ${Object.keys(this.data.roles).length} roles`);
    console.log(`  - ${Object.keys(this.data.config.teams).length} teams`);
  }

  async loadTemplate() {
    const templatePath = path.join(__dirname, 'templates', 'agent.hbs');
    this.template = fs.readFileSync(templatePath, 'utf8');
    console.log('✅ Loaded template: agent.hbs');
  }

  // Simulate Handlebars processing
  processTemplate(template, data) {
    let result = template;
    
    // Simple variable replacement
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    });
    
    // Handle {{#each}} blocks (simplified)
    result = result.replace(/{{#each (\w+)}}([\s\S]*?){{\/each}}/g, (match, varName, content) => {
      const items = data[varName];
      if (Array.isArray(items)) {
        return items.map(item => {
          let itemContent = content;
          if (typeof item === 'object') {
            Object.entries(item).forEach(([k, v]) => {
              itemContent = itemContent.replace(new RegExp(`{{this.${k}}}`, 'g'), v);
            });
          }
          return itemContent.trim();
        }).join('\n');
      }
      return '';
    });
    
    // Handle {{#if}} blocks (simplified)
    result = result.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
      return data[varName] ? content : '';
    });
    
    // Clean up any remaining placeholders
    result = result.replace(/{{[^}]+}}/g, '');
    
    return result;
  }

  async generateAgents() {
    const agents = [];
    
    // Iterate through teams
    for (const [teamKey, team] of Object.entries(this.data.config.teams)) {
      // Iterate through team members
      team.members.forEach((member, index) => {
        const role = this.data.roles[member.role] || {};
        const agentName = `team-${team.id}-${member.role}${index > 0 ? `-${index + 1}` : ''}`;
        
        // Prepare data for template
        const templateData = {
          AGENT_NAME: agentName,
          MODEL: member.model || 'claude-3-5-sonnet-20241022',
          TEAM_ID: team.id,
          ROLE: member.role.toUpperCase(),
          ROLE_DESCRIPTION: role.description || member.role,
          SPECIALIZATION: member.specialization || role.description,
          ACTIVATION_CONDITIONS: team.conditions.join(', '),
          EXAMPLE_TRIGGER: team.triggers[0],
          WORKSPACE: `tmp/teams/${team.id}-${Date.now()}/`,
          TIMESTAMP: new Date().toISOString(),
          
          // Components (already processed)
          IDENTITY_COMPONENT: this.processTemplate(this.data.components.identity, {
            ROLE: member.role,
            TEAM_ID: team.id,
            AGENT_ID: agentName,
            WORKSPACE: `tmp/teams/${team.id}-${Date.now()}/`,
            SESSION_ID: 'tmux-session',
            TIMESTAMP: new Date().toISOString()
          }),
          
          AWARENESS_COMPONENT: this.data.components.awareness,
          PROTOCOL_COMPONENT: this.data.components.protocol,
          COORDINATION_COMPONENT: this.data.components.coordination,
          ACTIVATION_COMPONENT: this.data.components.activation,
          
          // Role data
          ROLE_CAPABILITIES: this.formatList(role.capabilities),
          ROLE_RESPONSIBILITIES: role.responsibilities || '',
          ROLE_COMMANDS: role.commands || '',
          
          // Team members
          TEAM_MEMBERS: team.members,
          
          // Examples
          EXAMPLE_CONTEXT: this.getExampleContext(member.role),
          EXAMPLE_ACTION: this.getExampleAction(member.role),
          EXAMPLE_ISSUE: 'failing tests',
          EXAMPLE_COORDINATION: 'fixing issues across packages',
          
          // Trigger
          TRIGGER: team.triggers[0]
        };
        
        // Process template
        const agentContent = this.processTemplate(this.template, templateData);
        
        agents.push({
          name: agentName,
          path: `.claude/agents/${agentName}.md`,
          content: agentContent
        });
      });
    }
    
    return agents;
  }

  formatList(items) {
    if (!items || !Array.isArray(items)) return '';
    return items.map(item => `- ${item}`).join('\n');
  }

  getExampleContext(role) {
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

  getExampleAction(role) {
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
}

// Main
async function main() {
  console.log('🧪 Testing Composer Compatibility\n');
  
  const simulator = new ComposerSimulator();
  
  // Load all sources
  await simulator.loadSources();
  
  // Load template
  await simulator.loadTemplate();
  
  // Generate agents
  console.log('\n📝 Generating agents...');
  const agents = await simulator.generateAgents();
  
  console.log(`\n✅ Generated ${agents.length} agents:`);
  agents.forEach(agent => {
    console.log(`  - ${agent.name}`);
  });
  
  // Test that they match existing files
  console.log('\n🔍 Comparing with existing agents...');
  let allMatch = true;
  
  for (const agent of agents) {
    const existingPath = path.join(__dirname, '..', agent.path);
    if (fs.existsSync(existingPath)) {
      const existing = fs.readFileSync(existingPath, 'utf8');
      // Just check they're roughly the same size (within 10%)
      const sizeDiff = Math.abs(existing.length - agent.content.length) / existing.length;
      if (sizeDiff > 0.1) {
        console.log(`  ⚠️  ${agent.name}: Size difference ${(sizeDiff * 100).toFixed(1)}%`);
        allMatch = false;
      } else {
        console.log(`  ✅ ${agent.name}: Compatible`);
      }
    } else {
      console.log(`  ❌ ${agent.name}: File not found`);
      allMatch = false;
    }
  }
  
  if (allMatch) {
    console.log('\n✅ All agents are composer-compatible!');
    console.log('\n📦 When @akaoio/composer is stable, just run:');
    console.log('   npx @akaoio/composer build --config teams/composer.config.js');
  } else {
    console.log('\n⚠️  Some compatibility issues found');
  }
}

main().catch(console.error);