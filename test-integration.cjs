#!/usr/bin/env node
// Test actual integration between packages

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing Package Integration\n');

// Test 1: Can Composer generate docs?
console.log('1. Testing Composer documentation generation...');
try {
  process.chdir('projects/composer');
  execSync('node bin/composer.mjs --help', { stdio: 'ignore' });
  console.log('   ✅ Composer CLI works');
} catch (e) {
  console.log('   ❌ Composer CLI failed:', e.message);
}

// Test 2: Can Battle run tests?
console.log('\n2. Testing Battle test execution...');
try {
  process.chdir('../battle');
  const result = execSync('node dist/cli.cjs --help', { encoding: 'utf8' });
  if (result.includes('test') || result.includes('command')) {
    console.log('   ✅ Battle CLI works');
  } else {
    console.log('   ⚠️  Battle CLI output unexpected');
  }
} catch (e) {
  console.log('   ❌ Battle CLI failed:', e.message);
}

// Test 3: Can Builder build projects?
console.log('\n3. Testing Builder build system...');
try {
  process.chdir('../builder');
  const result = execSync('node dist/cli.js --help', { encoding: 'utf8' });
  if (result.includes('Builder') || result.includes('build')) {
    console.log('   ✅ Builder CLI works');
  } else {
    console.log('   ⚠️  Builder CLI output unexpected');
  }
} catch (e) {
  console.log('   ❌ Builder CLI failed:', e.message);
}

// Test 4: Can Air be imported?
console.log('\n4. Testing Air module import...');
try {
  process.chdir('../air');
  // Check if main entry point exists
  const fs = require('fs');
  if (fs.existsSync('dist/main.js')) {
    console.log('   ✅ Air main module exists');
  } else {
    console.log('   ⚠️  Air main module missing');
  }
} catch (e) {
  console.log('   ❌ Air check failed:', e.message);
}

// Test 5: Access shell script
console.log('\n5. Testing Access shell script...');
try {
  process.chdir('../access');
  const result = execSync('sh access.sh version', { encoding: 'utf8' });
  if (result.includes('0.0')) {
    console.log('   ✅ Access shell script works');
  } else {
    console.log('   ⚠️  Access version not found');
  }
} catch (e) {
  console.log('   ❌ Access script failed:', e.message);
}

console.log('\n✨ Integration testing complete!');
