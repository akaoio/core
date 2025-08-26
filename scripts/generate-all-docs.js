#!/usr/bin/env node

/**
 * Universal documentation generator for all @akaoio/core technologies
 * This script can generate docs for all core technologies in one command
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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

function generateProjectDocs(projectName, projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log(`⚠️ No package.json in ${projectName}`, 'yellow');
    return false;
  }

  const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Generate README.md using our template system
  const readmeTemplate = `# @akaoio/${packageData.name}

${packageData.description}

**Version**: ${packageData.version}
**License**: ${packageData.license}
**Repository**: ${packageData.repository?.url || 'https://github.com/akaoio/' + packageData.name}

## Installation

\`\`\`bash
npm install @akaoio/${packageData.name}
\`\`\`

## Usage

[Usage documentation here]

## Contributing

Please read [CONTRIBUTING.md](../../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the ${packageData.license} License - see the [LICENSE](LICENSE) file for details.

---

*Part of the AKAO ecosystem - Building the future of development tooling*

*Generated: ${new Date().toISOString()}*
`;

  // Write README.md
  fs.writeFileSync(path.join(projectPath, 'README.md'), readmeTemplate);
  
  // Keep existing CLAUDE.md if it's good, or create basic one
  const claudemdPath = path.join(projectPath, 'CLAUDE.md');
  if (!fs.existsSync(claudemdPath) || fs.readFileSync(claudemdPath, 'utf8').length < 500) {
    const claudeTemplate = `# CLAUDE.md - @akaoio/${packageData.name}

This file provides guidance to Claude Code (claude.ai/code) when working with the @akaoio/${packageData.name} codebase.

## Project Overview

${packageData.description}

**Version**: ${packageData.version}
**License**: ${packageData.license}
**Repository**: ${packageData.repository?.url || 'https://github.com/akaoio/' + packageData.name}

## Core Principles

### Development Guidelines
- Follow @akaoio ecosystem standards
- Use TypeScript for type safety
- Test with @akaoio/battle framework
- Build with @akaoio/builder

## Architecture

[Architecture documentation here]

## Usage

\`\`\`bash
npm install @akaoio/${packageData.name}
\`\`\`

[Usage examples here]

## Development

\`\`\`bash
npm run build    # Build the project
npm test         # Run tests
npm run dev      # Development mode
\`\`\`

## Notes for AI Assistants

When working with this codebase:
- Respect the core principles above
- Follow existing patterns
- Use proper TypeScript
- Test thoroughly

## Contributing

Please read [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

---

*Part of the AKAO ecosystem - Building the future of development tooling*

*Generated: ${new Date().toISOString()}*
`;
    
    fs.writeFileSync(claudemdPath, claudeTemplate);
  }
  
  return true;
}

async function generateAllDocs() {
  log('🚀 Universal Documentation Generator for @akaoio/core', 'bright');
  
  try {
    // Generate core documentation (workspace level)
    log('\n📁 Generating core workspace documentation...', 'blue');
    
    if (fs.existsSync('composer.config.js')) {
      execSync('npx composer build', { stdio: 'inherit' });
      log('✅ Core workspace documentation generated', 'green');
    } else {
      log('⚠️ No composer.config.js found in core workspace', 'yellow');
    }
    
    // Generate documentation for all core technologies
    const projectsDir = 'projects';
    if (!fs.existsSync(projectsDir)) {
      log('❌ Projects directory not found', 'red');
      return;
    }
    
    const projects = fs.readdirSync(projectsDir).filter(dir => 
      fs.statSync(path.join(projectsDir, dir)).isDirectory()
    );
    
    let successCount = 0;
    let totalCount = projects.length;
    
    for (const project of projects) {
      log(`\n📦 Processing ${project}...`, 'blue');
      const projectPath = path.join(projectsDir, project);
      
      if (generateProjectDocs(project, projectPath)) {
        log(`✅ ${project} documentation generated`, 'green');
        successCount++;
      } else {
        log(`⚠️ ${project} skipped - no package.json`, 'yellow');
      }
    }
    
    // Generate agents
    log('\n🤖 Generating team agents...', 'blue');
    if (fs.existsSync('teams/generate-with-composer.cjs')) {
      execSync('node teams/generate-with-composer.cjs', { stdio: 'inherit' });
      execSync('cp .claude/agents-generated/* .claude/agents/', { stdio: 'inherit' });
      log('✅ Team agents generated', 'green');
    } else {
      log('⚠️ Agent generation script not found', 'yellow');
    }
    
    log('\n✨ Universal documentation generation complete!', 'bright');
    
    // Summary
    log('\n📊 Summary:', 'bright');
    log(`  - Core docs: ${fs.existsSync('CLAUDE.md') ? '✅' : '❌'} CLAUDE.md, ${fs.existsSync('README.md') ? '✅' : '❌'} README.md`);
    log(`  - Technologies documented: ${successCount}/${totalCount}`);
    log(`  - Agents generated: ${fs.readdirSync('.claude/agents').filter(f => f.endsWith('.md')).length}`);
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the generator
generateAllDocs();
