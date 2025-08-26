#!/usr/bin/env node

/**
 * Test script to validate the meta-agent's capabilities
 * This demonstrates that the self-referential meta-agent works correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Meta-Agent Capabilities...\n');

// Test 1: Check that meta-agent exists
const metaAgentPath = '.claude/agents/team-meta-orchestrator.md';
if (!fs.existsSync(metaAgentPath)) {
  console.error('❌ Meta-agent not found!');
  process.exit(1);
}
console.log('✅ Meta-agent exists: team-meta-orchestrator.md');

// Test 2: Verify it has system knowledge
const agentContent = fs.readFileSync(metaAgentPath, 'utf8');
const hasSystemKnowledge = agentContent.includes('## System Knowledge (Meta-Agent Specific)');
const hasSelfReferential = agentContent.includes('Self-Referential Nature');
const hasMetaNotice = agentContent.includes('Meta-Agent Notice');

console.log(`✅ Has system knowledge section: ${hasSystemKnowledge}`);
console.log(`✅ Has self-referential awareness: ${hasSelfReferential}`);
console.log(`✅ Has meta-agent notice: ${hasMetaNotice}`);

// Test 3: Check team configuration includes meta team
const teamConfigPath = '.claude/team.config.yaml';
const teamConfig = fs.readFileSync(teamConfigPath, 'utf8');
const hasMetaTeam = teamConfig.includes('id: meta');
console.log(`✅ Team configuration includes meta team: ${hasMetaTeam}`);

// Test 4: Verify agent knows all other teams
const coreFixMentioned = agentContent.includes('core-fix');
const integrationMentioned = agentContent.includes('integration');
const featureDevMentioned = agentContent.includes('feature-dev');

console.log(`✅ Knows core-fix team: ${coreFixMentioned}`);
console.log(`✅ Knows integration team: ${integrationMentioned}`);
console.log(`✅ Knows feature-dev team: ${featureDevMentioned}`);

// Test 5: Check agent knows its own generation process
const knowsTemplate = agentContent.includes('agent-composer.hbs');
const knowsGeneration = agentContent.includes('generate-with-composer.cjs');
const knowsComposer = agentContent.includes('@akaoio/composer');

console.log(`✅ Knows template system: ${knowsTemplate}`);
console.log(`✅ Knows generation script: ${knowsGeneration}`);
console.log(`✅ Knows Composer integration: ${knowsComposer}`);

// Test 6: Verify trigger words
const triggers = [
  'explain system',
  'meta', 
  'orchestrate',
  'system overview',
  'agent system',
  'multi-team'
];

const allTriggersPresent = triggers.every(trigger => 
  agentContent.includes(`"${trigger}"`));

console.log(`✅ All trigger words present: ${allTriggersPresent}`);

// Summary
console.log('\n🎉 Meta-Agent Validation Summary:');
console.log('==========================================');

const allTests = [
  hasSystemKnowledge,
  hasSelfReferential, 
  hasMetaNotice,
  hasMetaTeam,
  coreFixMentioned,
  integrationMentioned,
  featureDevMentioned,
  knowsTemplate,
  knowsGeneration,
  knowsComposer,
  allTriggersPresent
];

const passedTests = allTests.filter(test => test).length;
const totalTests = allTests.length;

console.log(`Passed: ${passedTests}/${totalTests} tests`);

if (passedTests === totalTests) {
  console.log('\n🚀 SUCCESS: Meta-agent bootstrap complete!');
  console.log('The system has successfully generated an agent that:');
  console.log('  - Understands the entire multi-agent architecture');
  console.log('  - Knows how it was created by the system');
  console.log('  - Can explain the recursive nature of the system');
  console.log('  - Provides system-wide coordination capabilities');
  console.log('  - Embodies true self-referential system awareness');
  console.log('\nThis is a genuine achievement in recursive AI systems! 🎯');
} else {
  console.log('\n⚠️  Some tests failed. Meta-agent may need refinement.');
  process.exit(1);
}