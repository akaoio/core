#!/usr/bin/env node

/**
 * Agent Short Name Lookup Utility
 * Helps users find and understand agent short names
 */

const fs = require('fs');
const path = require('path');

// Load mapping data
const mappingPath = path.join(process.cwd(), 'teams/agent-short-names.json');
let mapping = {};

try {
  mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
} catch (error) {
  console.error('❌ Could not load agent mapping. Run: node tmp/agent-naming-solution/generate-short-names.cjs first');
  process.exit(1);
}

// Command line argument processing
const args = process.argv.slice(2);
const command = args[0];
const query = args[1];

function showUsage() {
  console.log(`
🔍 Agent Short Name Lookup Utility

Usage:
  node agent-lookup.cjs <command> [query]

Commands:
  list                    # List all agents with short names
  lookup <short-name>     # Find full name from short name
  reverse <full-name>     # Find short name from full name  
  team <team-name>        # Show all agents for a team
  role <role-name>        # Show all agents with specific role
  search <term>           # Search agent names/roles
  stats                   # Show system statistics

Examples:
  node agent-lookup.cjs list
  node agent-lookup.cjs lookup meta-orch
  node agent-lookup.cjs reverse team-meta-orchestrator
  node agent-lookup.cjs team composer
  node agent-lookup.cjs role architect
  node agent-lookup.cjs search build
`);
}

function listAllAgents() {
  console.log('📋 ALL AGENT SHORT NAMES\n');
  console.log('═'.repeat(80));
  
  Object.entries(mapping.categories).forEach(([category, shortNames]) => {
    console.log(`\n🏷️  ${category.toUpperCase()}`);
    console.log('─'.repeat(40));
    
    shortNames.forEach(shortName => {
      const fullName = mapping.shortToFull[shortName];
      const agent = mapping.agentList.find(a => a.shortName === shortName);
      console.log(`  ${shortName.padEnd(12)} → ${fullName}`);
      if (agent) {
        console.log(`  ${''.padEnd(12)}   ${agent.specialization}`);
      }
      console.log('');
    });
  });
  
  console.log(`\n📊 Total: ${mapping.metadata.totalAgents} agents across ${mapping.metadata.totalCategories} categories`);
}

function lookupShortName(shortName) {
  const fullName = mapping.shortToFull[shortName];
  
  if (!fullName) {
    console.log(`❌ Short name '${shortName}' not found.`);
    console.log('\nDid you mean:');
    
    // Find similar names
    const similar = Object.keys(mapping.shortToFull).filter(name => 
      name.includes(shortName) || shortName.includes(name.split('-')[0])
    ).slice(0, 5);
    
    similar.forEach(name => {
      console.log(`  - ${name} → ${mapping.shortToFull[name]}`);
    });
    return;
  }
  
  const agent = mapping.agentList.find(a => a.shortName === shortName);
  
  console.log(`✅ Found agent: ${shortName}`);
  console.log('─'.repeat(50));
  console.log(`Short Name:     ${shortName}`);
  console.log(`Full Name:      ${fullName}`);
  if (agent) {
    console.log(`Team:           ${agent.team}`);
    console.log(`Role:           ${agent.role}`);
    console.log(`Specialization: ${agent.specialization}`);
  }
}

function reverseLoookup(fullName) {
  const shortName = mapping.fullToShort[fullName];
  
  if (!shortName) {
    console.log(`❌ Full name '${fullName}' not found.`);
    console.log('\nDid you mean:');
    
    // Find similar names
    const similar = Object.keys(mapping.fullToShort).filter(name => 
      name.toLowerCase().includes(fullName.toLowerCase())
    ).slice(0, 5);
    
    similar.forEach(name => {
      console.log(`  - ${name} → ${mapping.fullToShort[name]}`);
    });
    return;
  }
  
  console.log(`✅ Short name: ${shortName}`);
  console.log(`Full name:  ${fullName}`);
}

function showTeamAgents(teamName) {
  const teamKey = teamName.toLowerCase();
  const category = mapping.categories[teamKey];
  
  if (!category) {
    console.log(`❌ Team '${teamName}' not found.`);
    console.log('\nAvailable teams:');
    Object.keys(mapping.categories).forEach(team => {
      console.log(`  - ${team}`);
    });
    return;
  }
  
  console.log(`🏷️  ${teamName.toUpperCase()} TEAM AGENTS\n`);
  console.log('─'.repeat(60));
  
  category.forEach(shortName => {
    const fullName = mapping.shortToFull[shortName];
    const agent = mapping.agentList.find(a => a.shortName === shortName);
    
    console.log(`${shortName.padEnd(12)} → ${agent?.role.padEnd(12)} - ${agent?.specialization}`);
  });
  
  console.log(`\n📊 Total: ${category.length} agents in ${teamName} team`);
}

function showRoleAgents(roleName) {
  const role = roleName.toLowerCase();
  const roleAgents = mapping.agentList.filter(agent => 
    agent.role.toLowerCase().includes(role)
  );
  
  if (roleAgents.length === 0) {
    console.log(`❌ No agents found with role '${roleName}'.`);
    return;
  }
  
  console.log(`👥 AGENTS WITH ROLE: ${roleName.toUpperCase()}\n`);
  console.log('─'.repeat(70));
  
  roleAgents.forEach(agent => {
    console.log(`${agent.shortName.padEnd(12)} → ${agent.team.padEnd(15)} - ${agent.specialization}`);
  });
  
  console.log(`\n📊 Total: ${roleAgents.length} agents with role '${roleName}'`);
}

function searchAgents(searchTerm) {
  const term = searchTerm.toLowerCase();
  const results = [];
  
  // Search in short names, full names, teams, roles, and specializations
  mapping.agentList.forEach(agent => {
    if (
      agent.shortName.toLowerCase().includes(term) ||
      agent.fullName.toLowerCase().includes(term) ||
      agent.team.toLowerCase().includes(term) ||
      agent.role.toLowerCase().includes(term) ||
      agent.specialization.toLowerCase().includes(term)
    ) {
      results.push(agent);
    }
  });
  
  if (results.length === 0) {
    console.log(`❌ No agents found matching '${searchTerm}'.`);
    return;
  }
  
  console.log(`🔍 SEARCH RESULTS FOR: "${searchTerm}"\n`);
  console.log('─'.repeat(80));
  
  results.forEach(agent => {
    console.log(`${agent.shortName.padEnd(12)} → ${agent.team.padEnd(12)} / ${agent.role.padEnd(10)} - ${agent.specialization}`);
  });
  
  console.log(`\n📊 Found: ${results.length} matching agents`);
}

function showStats() {
  console.log('📊 SYSTEM STATISTICS\n');
  console.log('─'.repeat(40));
  
  console.log(`Total Agents:     ${mapping.metadata.totalAgents}`);
  console.log(`Total Teams:      ${mapping.metadata.totalCategories}`);
  console.log(`Generated:        ${new Date(mapping.metadata.generated).toLocaleString()}`);
  
  console.log('\n🏷️  TEAM BREAKDOWN:');
  Object.entries(mapping.categories).forEach(([team, agents]) => {
    console.log(`  ${team.padEnd(10)} → ${agents.length} agents`);
  });
  
  console.log('\n👥 ROLE BREAKDOWN:');
  const roles = {};
  mapping.agentList.forEach(agent => {
    roles[agent.role] = (roles[agent.role] || 0) + 1;
  });
  
  Object.entries(roles).sort(([,a], [,b]) => b - a).forEach(([role, count]) => {
    console.log(`  ${role.padEnd(12)} → ${count} agents`);
  });
}

// Main execution
switch (command) {
  case 'list':
    listAllAgents();
    break;
  case 'lookup':
    if (!query) {
      console.log('❌ Please provide a short name to lookup');
      showUsage();
      process.exit(1);
    }
    lookupShortName(query);
    break;
  case 'reverse':
    if (!query) {
      console.log('❌ Please provide a full name to reverse lookup');
      showUsage();
      process.exit(1);
    }
    reverseLoookup(query);
    break;
  case 'team':
    if (!query) {
      console.log('❌ Please provide a team name');
      showUsage();
      process.exit(1);
    }
    showTeamAgents(query);
    break;
  case 'role':
    if (!query) {
      console.log('❌ Please provide a role name');
      showUsage();
      process.exit(1);
    }
    showRoleAgents(query);
    break;
  case 'search':
    if (!query) {
      console.log('❌ Please provide a search term');
      showUsage();
      process.exit(1);
    }
    searchAgents(query);
    break;
  case 'stats':
    showStats();
    break;
  default:
    showUsage();
    break;
}