#!/usr/bin/env node
/**
 * Integration test for all @akaoio core technologies
 */

const { execSync } = require('child_process');
const path = require('path');

const projects = [
  { name: 'builder', path: 'projects/builder' },
  { name: 'battle', path: 'projects/battle' },
  { name: 'composer', path: 'projects/composer' },
  { name: 'air', path: 'projects/air' }
];

console.log('===========================================');
console.log('  @akaoio Core Technologies Integration Test');
console.log('===========================================\n');

let allPassed = true;
const results = [];

for (const project of projects) {
  console.log(`Testing @akaoio/${project.name}...`);
  
  try {
    // Run tests
    execSync('npm test', {
      cwd: path.join(process.cwd(), project.path),
      stdio: 'pipe'
    });
    
    console.log(`✅ @akaoio/${project.name} - PASSED\n`);
    results.push({ name: project.name, status: 'PASSED' });
  } catch (error) {
    console.log(`❌ @akaoio/${project.name} - FAILED\n`);
    results.push({ name: project.name, status: 'FAILED' });
    allPassed = false;
  }
}

console.log('\n===========================================');
console.log('              Test Summary');
console.log('===========================================\n');

results.forEach(r => {
  const icon = r.status === 'PASSED' ? '✅' : '❌';
  console.log(`${icon} @akaoio/${r.name}: ${r.status}`);
});

if (allPassed) {
  console.log('\n🎉 All core technologies are working!');
  process.exit(0);
} else {
  console.log('\n⚠️ Some technologies need attention');
  process.exit(1);
}
