#!/usr/bin/env node

/**
 * Comprehensive documentation quality audit
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('=== COMPREHENSIVE DOCUMENTATION QUALITY AUDIT ===\n');

// Find all documentation files
function findDocFiles(dir, files = []) {
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      if (item === 'node_modules') continue;
      
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          findDocFiles(fullPath, files);
        } else if (item === 'CLAUDE.md' || item === 'README.md') {
          files.push(fullPath);
        }
      } catch (e) {
        // Skip inaccessible files
      }
    }
  } catch (e) {
    // Skip inaccessible directories
  }
  return files;
}

const docFiles = findDocFiles('.');

console.log(`Found ${docFiles.length} documentation files\n`);

const results = {
  excellent: [],
  good: [],
  poor: [],
  broken: []
};

const issues = {
  templates: [],
  empty: [],
  outdated: [],
  generic: []
};

// Analyze each file
for (const filepath of docFiles) {
  try {
    const content = readFileSync(filepath, 'utf8');
    const filename = filepath.split('/').pop();
    const size = content.length;
    
    let score = 100;
    let problems = [];
    
    // Check for unprocessed templates
    const hasUnprocessed = content.match(/\{\{[^}]+\}\}/g);
    if (hasUnprocessed && hasUnprocessed.length > 0) {
      score -= 30;
      problems.push(`${hasUnprocessed.length} unprocessed templates`);
      issues.templates.push({ file: filepath, count: hasUnprocessed.length });
    }
    
    // Check size
    if (size < 100) {
      score -= 40;
      problems.push('too short');
      issues.empty.push(filepath);
    } else if (size < 500) {
      score -= 20;
      problems.push('minimal content');
    }
    
    // Check for generic content
    if (content.includes('Lorem ipsum') || content.includes('TODO') || content.includes('FIXME')) {
      score -= 25;
      problems.push('placeholder content');
      issues.generic.push(filepath);
    }
    
    // Check for outdated dates
    const dateMatches = content.match(/(\d{4})/g);
    if (dateMatches && dateMatches.some(year => parseInt(year) < 2024)) {
      if (!content.includes('2024') && !content.includes('2025')) {
        score -= 15;
        problems.push('potentially outdated');
        issues.outdated.push(filepath);
      }
    }
    
    // Check structure
    const hasHeaders = content.includes('##');
    const hasOverview = /overview|description/i.test(content);
    
    if (!hasHeaders) {
      score -= 15;
      problems.push('no structure');
    }
    
    if (!hasOverview) {
      score -= 10;
      problems.push('no overview');
    }
    
    // Categorize quality
    const quality = {
      file: filepath,
      filename,
      size,
      score,
      problems
    };
    
    if (score >= 90) results.excellent.push(quality);
    else if (score >= 70) results.good.push(quality);
    else if (score >= 40) results.poor.push(quality);
    else results.broken.push(quality);
    
  } catch (e) {
    results.broken.push({
      file: filepath,
      filename: filepath.split('/').pop(),
      size: 0,
      score: 0,
      problems: [`read error: ${e.message}`]
    });
  }
}

// Report results
console.log('📊 QUALITY DISTRIBUTION:\n');
console.log(`🏆 Excellent (90-100): ${results.excellent.length} files`);
console.log(`✅ Good (70-89): ${results.good.length} files`);
console.log(`⚠️  Poor (40-69): ${results.poor.length} files`);
console.log(`❌ Broken (0-39): ${results.broken.length} files`);

const totalFiles = docFiles.length;
const qualityScore = Math.round(
  (results.excellent.length * 100 + 
   results.good.length * 80 + 
   results.poor.length * 55 + 
   results.broken.length * 20) / totalFiles
);

console.log(`\n📈 Overall Documentation Quality: ${qualityScore}/100\n`);

// Show problematic files
if (results.broken.length > 0) {
  console.log('❌ BROKEN FILES:');
  results.broken.forEach(file => {
    console.log(`   ${file.file} (${file.size} chars): ${file.problems.join(', ')}`);
  });
  console.log('');
}

if (results.poor.length > 0) {
  console.log('⚠️  POOR QUALITY FILES:');
  results.poor.slice(0, 5).forEach(file => {
    console.log(`   ${file.file} (${file.size} chars, score: ${file.score}): ${file.problems.join(', ')}`);
  });
  if (results.poor.length > 5) {
    console.log(`   ... and ${results.poor.length - 5} more`);
  }
  console.log('');
}

// Show specific issues
console.log('🔍 SPECIFIC ISSUES:\n');

if (issues.templates.length > 0) {
  console.log(`❌ Files with unprocessed templates (${issues.templates.length}):`);
  issues.templates.slice(0, 3).forEach(item => {
    console.log(`   ${item.file}: ${item.count} templates`);
  });
  if (issues.templates.length > 3) {
    console.log(`   ... and ${issues.templates.length - 3} more`);
  }
  console.log('');
}

if (issues.empty.length > 0) {
  console.log(`📄 Empty/minimal files (${issues.empty.length}):`);
  issues.empty.slice(0, 3).forEach(file => console.log(`   ${file}`));
  if (issues.empty.length > 3) {
    console.log(`   ... and ${issues.empty.length - 3} more`);
  }
  console.log('');
}

if (issues.outdated.length > 0) {
  console.log(`📅 Potentially outdated files (${issues.outdated.length}):`);
  issues.outdated.slice(0, 3).forEach(file => console.log(`   ${file}`));
  console.log('');
}

// Best and worst examples
if (results.excellent.length > 0) {
  console.log('🏆 BEST DOCUMENTATION:');
  results.excellent.slice(0, 3).forEach(file => {
    console.log(`   ${file.file} (${file.size} chars, score: ${file.score})`);
  });
  console.log('');
}

// File storage locations summary
console.log('📁 GENERATED FILES STORAGE LOCATIONS:\n');
console.log('1. **Agent Files**:');
console.log('   - Generated: `.claude/agents-generated/` (21 files)');
console.log('   - Active: `.claude/agents/` (copied from generated)');
console.log('   - Template: `teams/templates/agent-composer.hbs`');
console.log('');
console.log('2. **Documentation Files**:');
console.log('   - Main: `./CLAUDE.md` (workspace guide)');
console.log('   - Projects: `projects/*/CLAUDE.md` (project-specific)');
console.log('   - READMEs: Various locations');
console.log('');
console.log('3. **Temporary Files**:');
console.log('   - Location: `tmp/` directory');
console.log('   - Reports: Various analysis files');
console.log('   - Tests: Composer test outputs');

// Final assessment
console.log('\n=== FINAL ASSESSMENT ===\n');

if (qualityScore >= 80) {
  console.log('✅ DOCUMENTATION QUALITY: GOOD');
  console.log('Most files are well-written with proper structure');
} else if (qualityScore >= 60) {
  console.log('⚠️  DOCUMENTATION QUALITY: NEEDS IMPROVEMENT');
  console.log('Many files have issues that should be addressed');
} else {
  console.log('❌ DOCUMENTATION QUALITY: POOR');
  console.log('Significant problems across the codebase');
}

console.log(`\nPriority fixes needed:`);
if (issues.templates.length > 0) {
  console.log(`1. Fix ${issues.templates.length} files with unprocessed templates`);
}
if (issues.empty.length > 0) {
  console.log(`2. Improve ${issues.empty.length} empty/minimal files`);
}
if (results.broken.length > 0) {
  console.log(`3. Repair ${results.broken.length} broken files`);
}

console.log('\n💡 RECOMMENDATION:');
if (qualityScore < 70) {
  console.log('Use Composer to regenerate documentation from atomic sources');
  console.log('Focus on fixing template files and improving content quality');
} else {
  console.log('Documentation is generally good, focus on fixing specific issues');
}