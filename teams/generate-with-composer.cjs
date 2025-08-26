#!/usr/bin/env node

/**
 * Generate team agents using @akaoio/composer
 * This script uses the composer library directly rather than CLI
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Import composer using ESM syntax in Node
async function generateAgents() {
  try {
    // Use dynamic import for ESM module - import Template directly for our use case
    const { Template } = await import('../projects/composer/dist/Template/index.js');
    
    // Load team configuration
    const teamConfig = yaml.load(fs.readFileSync('.claude/team.config.yaml', 'utf8'));
    
    // Create output directory if needed
    const outputDir = '.claude/agents-generated';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Load template
    const template = fs.readFileSync('teams/templates/agent-composer.hbs', 'utf8');
    
    // Generate each agent directly from configuration - NO DUPLICATES
    const agents = [];
    
    Object.entries(teamConfig.teams).forEach(([teamKey, team]) => {
      team.members.forEach((member, index) => {
        // Simple, direct naming - one agent per configuration entry
        const agentName = `team-${team.id}-${member.role}`;
        
        const agentData = {
          AGENT_NAME: agentName,
          MODEL: member.model || 'claude-3-5-sonnet-20241022',
          TEAM_ID: team.id,
          ROLE: member.role,
          SPECIALIZATION: member.specialization || `${member.role} tasks`,
          TEAM_DESCRIPTION: team.description,
          TRIGGERS: team.triggers,
          CONDITIONS: team.conditions,
          TIMESTAMP: new Date().toISOString(),
          ROLE_SUFFIX: '',
          AGENT_INDEX: index + 1
        };
        
        agents.push({ name: agentName, data: agentData });
      });
    });
    
    // Process each agent with enhanced Composer template engine
    console.log('🚀 Generating agents with @akaoio/composer (with helpers)...');
    
    for (const agent of agents) {
      try {
        // Create a Template instance directly
        const templateEngine = new Template(template, {
          data: agent.data
        });
        
        // Render the template using the enhanced Template engine
        const output = templateEngine.render();
        
        // Write output
        const outputPath = path.join(outputDir, `${agent.name}.md`);
        fs.writeFileSync(outputPath, output);
        console.log(`✅ Generated: ${agent.name} (using enhanced Template engine)`);
        
      } catch (error) {
        console.error(`❌ Error generating ${agent.name}:`, error.message);
        console.error('   Falling back to simple replacement...');
        
        // Fallback to simple replacement if Composer fails
        let output = template;
        Object.entries(agent.data).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          if (Array.isArray(value)) {
            output = output.replace(regex, value.join(', '));
          } else {
            output = output.replace(regex, value);
          }
        });
        
        const outputPath = path.join(outputDir, `${agent.name}.md`);
        fs.writeFileSync(outputPath, output);
        console.log(`✅ Generated: ${agent.name} (fallback mode)`);
      }
    }
    
    console.log(`\n📦 Generated ${agents.length} agents in ${outputDir}`);
    console.log('\nTo activate the generated agents:');
    console.log('  cp .claude/agents-generated/* .claude/agents/');
    
  } catch (error) {
    console.error('❌ Error generating agents:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateAgents();