#!/usr/bin/env node

/**
 * Deep test of composer's real-time documentation synthesis
 * Testing data aggregation and template processing
 */

import { Composer, Template } from '@akaoio/composer';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

console.log('=== Deep Composer Real-time Documentation Test ===\n');

// Create test directory
const testDir = 'tmp/composer-test';
if (!existsSync(testDir)) {
  mkdirSync(testDir, { recursive: true });
}

// Test 1: Basic Template with Real Data
console.log('Test 1: Basic Template Processing');
try {
  const template = new Template(`
# {{project.name}} Documentation

Version: {{project.version}}
Description: {{project.description}}

## Features
{{#each features}}
- {{name}}: {{description}}
{{/each}}

## Status
Generated at: {{timestamp}}
`);

  const result = template.render({
    data: {
      project: {
        name: '@akaoio/core',
        version: '1.0.0',
        description: 'Workspace orchestrator for multi-repo development'
      },
      features: [
        { name: 'Multi-repo management', description: 'Manage multiple repositories as one' },
        { name: 'Agent system', description: 'Living AI agents with real-time coordination' },
        { name: 'Build orchestration', description: 'Unified build system across projects' }
      ],
      timestamp: new Date().toISOString()
    }
  });

  writeFileSync(join(testDir, 'test1-output.md'), result);
  console.log(`✅ Generated ${result.length} characters`);
  console.log(`   Output: ${testDir}/test1-output.md`);
} catch (error) {
  console.log(`❌ Failed: ${error.message}`);
}

// Test 2: Complex Nested Data Synthesis
console.log('\nTest 2: Complex Data Synthesis');
try {
  // Simulate gathering data from multiple sources
  const teamData = {
    teams: {
      'core-fix': {
        id: 'core-fix',
        description: 'Core bug fixing team',
        members: [
          { role: 'coordinator', specialization: 'Task planning and allocation' },
          { role: 'fixer', specialization: 'Bug fixes and repairs' }
        ]
      },
      'integrity': {
        id: 'integrity',
        description: 'Code integrity enforcement',
        members: [
          { role: 'inspector', specialization: 'Deep code analysis' },
          { role: 'enforcer', specialization: 'Standards enforcement' }
        ]
      }
    }
  };

  const template = new Template(`
# Multi-Agent System Report

## Teams Overview
{{#each teams}}
### Team: {{id}}
Description: {{description}}

Members:
{{#each members}}
- **{{role}}**: {{specialization}}
{{/each}}
{{/each}}

## Statistics
- Total Teams: {{stats.teamCount}}
- Total Agents: {{stats.agentCount}}
- Generation Time: {{stats.generationTime}}ms
`);

  const startTime = Date.now();
  
  // Calculate statistics
  const stats = {
    teamCount: Object.keys(teamData.teams).length,
    agentCount: Object.values(teamData.teams).reduce((sum, team) => sum + team.members.length, 0),
    generationTime: 0
  };

  const result = template.render({
    data: {
      ...teamData,
      stats
    }
  });

  stats.generationTime = Date.now() - startTime;
  
  // Re-render with actual generation time
  const finalResult = template.render({
    data: {
      ...teamData,
      stats
    }
  });

  writeFileSync(join(testDir, 'test2-output.md'), finalResult);
  console.log(`✅ Synthesized data from ${stats.teamCount} teams, ${stats.agentCount} agents`);
  console.log(`   Generation time: ${stats.generationTime}ms`);
  console.log(`   Output: ${testDir}/test2-output.md`);
} catch (error) {
  console.log(`❌ Failed: ${error.message}`);
}

// Test 3: Real-time Data Update Simulation
console.log('\nTest 3: Real-time Data Updates');
try {
  const template = new Template(`
## System Status [{{updateCount}}]
- Memory Usage: {{memory.used}}MB / {{memory.total}}MB ({{memory.percent}}%)
- CPU Load: {{cpu.load}}%
- Active Agents: {{agents.active}}/{{agents.total}}
- Last Update: {{timestamp}}
`);

  let updateCount = 0;
  const updates = [];

  // Simulate 5 real-time updates
  for (let i = 0; i < 5; i++) {
    updateCount++;
    
    const memUsed = Math.floor(Math.random() * 1000) + 500;
    const memTotal = 2048;
    
    const data = {
      updateCount,
      memory: {
        used: memUsed,
        total: memTotal,
        percent: Math.floor((memUsed / memTotal) * 100)
      },
      cpu: {
        load: Math.floor(Math.random() * 100)
      },
      agents: {
        active: Math.floor(Math.random() * 10) + 1,
        total: 13
      },
      timestamp: new Date().toISOString()
    };

    const result = template.render({ data });
    updates.push(result);
    
    // Small delay to simulate real-time
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Write all updates
  writeFileSync(join(testDir, 'test3-output.md'), updates.join('\n---\n'));
  console.log(`✅ Generated ${updateCount} real-time updates`);
  console.log(`   Output: ${testDir}/test3-output.md`);
} catch (error) {
  console.log(`❌ Failed: ${error.message}`);
}

// Test 4: Template Composition (Templates using Templates)
console.log('\nTest 4: Template Composition');
try {
  // Base templates
  const headerTemplate = new Template('# {{title}}\n_Generated: {{date}}_\n');
  const itemTemplate = new Template('- **{{name}}**: {{value}}');
  
  // Composite template
  const mainTemplate = new Template(`
{{header}}

## Configuration
{{#each config}}
{{item}}
{{/each}}

## Summary
Total items: {{itemCount}}
`);

  // Generate header
  const header = headerTemplate.render({
    data: {
      title: 'System Configuration',
      date: new Date().toDateString()
    }
  });

  // Generate items
  const configData = [
    { name: 'Database', value: 'GUN on port 8765' },
    { name: 'Agents', value: '13 active' },
    { name: 'Mode', value: 'Real-time synchronization' }
  ];

  const items = configData.map(cfg => 
    itemTemplate.render({ data: cfg })
  );

  // Compose final document
  const finalDoc = mainTemplate.render({
    data: {
      header,
      config: items.map(item => ({ item })),
      itemCount: configData.length
    }
  });

  writeFileSync(join(testDir, 'test4-output.md'), finalDoc);
  console.log(`✅ Composed document from ${configData.length} templates`);
  console.log(`   Output: ${testDir}/test4-output.md`);
} catch (error) {
  console.log(`❌ Failed: ${error.message}`);
}

// Test 5: Error Handling and Edge Cases
console.log('\nTest 5: Error Handling');
const errorTests = [
  {
    name: 'Missing variables',
    template: '{{missing.variable}}',
    data: { existing: 'value' }
  },
  {
    name: 'Empty loops',
    template: '{{#each items}}Item: {{.}}{{/each}}',
    data: { items: [] }
  },
  {
    name: 'Nested missing data',
    template: '{{user.profile.settings.theme}}',
    data: { user: { profile: {} } }
  }
];

for (const test of errorTests) {
  try {
    const template = new Template(test.template);
    const result = template.render({ data: test.data });
    console.log(`✅ ${test.name}: Handled gracefully (${result.length} chars)`);
  } catch (error) {
    console.log(`❌ ${test.name}: ${error.message}`);
  }
}

// Summary
console.log('\n=== Test Summary ===');
console.log('Composer capabilities tested:');
console.log('✓ Basic template processing');
console.log('✓ Complex data synthesis');
console.log('✓ Real-time updates');
console.log('✓ Template composition');
console.log('✓ Error handling');
console.log(`\nAll test outputs saved in: ${testDir}/`);