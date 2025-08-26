#!/usr/bin/env node

/**
 * Generate all documentation using @akaoio/composer
 * This script generates docs for core and all projects
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function generateDocs() {
  log('🚀 Generating documentation with @akaoio/composer', 'bright');
  
  try {
    // Generate core documentation
    log('\n📁 Generating core documentation...', 'blue');
    
    if (fs.existsSync('composer.config.js')) {
      execSync('npx composer build', { stdio: 'inherit' });
      log('✅ Core documentation generated', 'green');
    } else {
      log('⚠️  No composer.config.js found in core', 'yellow');
    }
    
    // Generate documentation for each project
    const projects = fs.readdirSync('projects').filter(dir => 
      fs.statSync(path.join('projects', dir)).isDirectory()
    );
    
    for (const project of projects) {
      log(`\n📦 Processing ${project}...`, 'blue');
      const projectPath = path.join('projects', project);
      const configPath = path.join(projectPath, 'composer.config.js');
      
      if (fs.existsSync(configPath)) {
        process.chdir(projectPath);
        execSync('npx composer build', { stdio: 'inherit' });
        process.chdir('../..');
        log(`✅ ${project} documentation generated`, 'green');
      } else {
        log(`⚠️  No composer.config.js in ${project}`, 'yellow');
      }
    }
    
    // Generate agents
    log('\n🤖 Generating team agents...', 'blue');
    if (fs.existsSync('teams/generate-with-composer.cjs')) {
      execSync('node teams/generate-with-composer.cjs', { stdio: 'inherit' });
      execSync('cp .claude/agents-generated/* .claude/agents/', { stdio: 'inherit' });
      log('✅ Team agents generated', 'green');
    }
    
    log('\n✨ Documentation generation complete!', 'bright');
    
    // Summary
    log('\n📊 Summary:', 'bright');
    log(`  - Core docs: ${fs.existsSync('CLAUDE.md') ? '✅' : '❌'} CLAUDE.md, ${fs.existsSync('README.md') ? '✅' : '❌'} README.md`);
    log(`  - Projects documented: ${projects.length}`);
    log(`  - Agents generated: ${fs.readdirSync('.claude/agents').filter(f => f.endsWith('.md')).length}`);
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the generator
generateDocs();