#!/usr/bin/env node
// Test cross-dependencies between core tech packages

import { existsSync } from 'fs';
import { execSync } from 'child_process';

console.log('🔬 Testing Cross-Dependencies Between Core Techs\n');

// Test Builder using Battle for testing
console.log('1. Builder → Battle (testing dependency)');
try {
  const builderPkg = JSON.parse(execSync('cat projects/builder/package.json').toString());
  if (builderPkg.devDependencies?.['@akaoio/battle']) {
    console.log('   ✅ Builder uses Battle for testing');
  } else {
    console.log('   ⚠️  Builder not using Battle');
  }
} catch (e) {
  console.log('   ❌ Error checking Builder deps:', e.message);
}

// Test Composer using Builder for builds
console.log('\n2. Composer → Builder (build dependency)');
try {
  const composerPkg = JSON.parse(execSync('cat projects/composer/package.json').toString());
  if (composerPkg.devDependencies?.['@akaoio/builder']) {
    console.log('   ✅ Composer uses Builder for builds');
  } else {
    console.log('   ⚠️  Composer not using Builder');
  }
} catch (e) {
  console.log('   ❌ Error checking Composer deps:', e.message);
}

// Test Battle using Builder for builds
console.log('\n3. Battle → Builder (build dependency)');
try {
  const battlePkg = JSON.parse(execSync('cat projects/battle/package.json').toString());
  if (battlePkg.devDependencies?.['@akaoio/builder']) {
    console.log('   ✅ Battle uses Builder for builds');
  } else {
    console.log('   ⚠️  Battle not using Builder');
  }
} catch (e) {
  console.log('   ❌ Error checking Battle deps:', e.message);
}

// Test Air using Battle for testing
console.log('\n4. Air → Battle (testing dependency)');
try {
  const airPkg = JSON.parse(execSync('cat projects/air/package.json').toString());
  if (airPkg.devDependencies?.['@akaoio/battle']) {
    console.log('   ✅ Air uses Battle for testing');
  } else {
    console.log('   ⚠️  Air not using Battle');
  }
} catch (e) {
  console.log('   ❌ Error checking Air deps:', e.message);
}

// Test Composer generates its own docs
console.log('\n5. Composer → Self (documentation generation)');
try {
  if (existsSync('projects/composer/composer.config.js')) {
    console.log('   ✅ Composer self-documents using composer.config.js');
  } else {
    console.log('   ⚠️  Composer missing self-documentation config');
  }
} catch (e) {
  console.log('   ❌ Error checking Composer self-docs:', e.message);
}

// Test Access doesn't have dependencies (pure shell)
console.log('\n6. Access → None (pure shell, no deps)');
try {
  const accessPkg = existsSync('projects/access/package.json');
  if (!accessPkg) {
    console.log('   ✅ Access is pure shell with no package.json');
  } else {
    const pkg = JSON.parse(execSync('cat projects/access/package.json').toString());
    if (!pkg.dependencies || Object.keys(pkg.dependencies).length === 0) {
      console.log('   ✅ Access has no runtime dependencies');
    } else {
      console.log('   ⚠️  Access has dependencies:', Object.keys(pkg.dependencies));
    }
  }
} catch (e) {
  console.log('   ❌ Error checking Access:', e.message);
}

console.log('\n📊 Summary of Cross-Dependencies:');
console.log('   • Builder provides build tooling for TypeScript projects');
console.log('   • Battle provides testing for all projects');
console.log('   • Composer provides documentation generation');
console.log('   • Air provides distributed database (living agents)');
console.log('   • Access provides network layer (pure shell, no deps)');
