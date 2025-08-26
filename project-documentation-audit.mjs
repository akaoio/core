#!/usr/bin/env node

/**
 * Comprehensive audit of all core technology projects
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('=== CORE TECHNOLOGY PROJECTS DOCUMENTATION AUDIT ===\n');

const projects = [
  'access',
  'air', 
  'battle',
  'builder',
  'composer',
  'tui',
  'ui'
];

const results = [];

// Check each project
for (const project of projects) {
  const projectPath = `projects/${project}`;
  
  console.log(`🔍 Analyzing: ${project.toUpperCase()}`);
  
  const analysis = {
    name: project,
    path: projectPath,
    exists: false,
    packageJson: null,
    documentation: {
      claude: { exists: false, size: 0, quality: 'unknown' },
      readme: { exists: false, size: 0, quality: 'unknown' },
      changelog: { exists: false, size: 0 },
      contributing: { exists: false, size: 0 },
      license: { exists: false, size: 0 }
    },
    codeStructure: {
      srcDir: false,
      testDir: false,
      examplesDir: false,
      docsDir: false,
      distDir: false
    },
    buildSystem: {
      hasPackageJson: false,
      hasNpmScripts: false,
      hasTsConfig: false,
      buildCommand: 'unknown'
    },
    overall: {
      score: 0,
      status: 'unknown',
      issues: []
    }
  };
  
  try {
    // Check if project exists
    if (!existsSync(projectPath)) {
      analysis.overall.issues.push('Project directory not found');
      results.push(analysis);
      console.log('❌ Project directory not found\n');
      continue;
    }
    
    analysis.exists = true;
    
    // Check package.json
    const packageJsonPath = join(projectPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        analysis.packageJson = pkg;
        analysis.buildSystem.hasPackageJson = true;
        analysis.buildSystem.hasNpmScripts = Object.keys(pkg.scripts || {}).length > 0;
        if (pkg.scripts?.build) {
          analysis.buildSystem.buildCommand = pkg.scripts.build;
        }
      } catch (e) {
        analysis.overall.issues.push('Invalid package.json');
      }
    }
    
    // Check documentation files
    const docFiles = [
      { key: 'claude', file: 'CLAUDE.md' },
      { key: 'readme', file: 'README.md' },
      { key: 'changelog', file: 'CHANGELOG.md' },
      { key: 'contributing', file: 'CONTRIBUTING.md' },
      { key: 'license', file: 'LICENSE' }
    ];
    
    for (const doc of docFiles) {
      const filePath = join(projectPath, doc.file);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8');
        const size = content.length;
        
        analysis.documentation[doc.key] = {
          exists: true,
          size,
          quality: size > 1000 ? 'good' : size > 500 ? 'basic' : size > 0 ? 'minimal' : 'empty'
        };
        
        // Special quality checks
        if (doc.key === 'claude' || doc.key === 'readme') {
          if (content.includes('TODO') || content.includes('{{')) {
            analysis.documentation[doc.key].quality = 'poor';
            analysis.overall.issues.push(`${doc.file} has placeholders`);
          }
          if (content.length > 5000) {
            analysis.documentation[doc.key].quality = 'excellent';
          }
        }
      }
    }
    
    // Check code structure
    const structureDirs = [
      { key: 'srcDir', dir: 'src' },
      { key: 'testDir', dir: 'test' },
      { key: 'examplesDir', dir: 'examples' },
      { key: 'docsDir', dir: 'docs' },
      { key: 'distDir', dir: 'dist' }
    ];
    
    for (const struct of structureDirs) {
      const dirPath = join(projectPath, struct.dir);
      analysis.codeStructure[struct.key] = existsSync(dirPath);
    }
    
    // Check TypeScript config
    analysis.buildSystem.hasTsConfig = existsSync(join(projectPath, 'tsconfig.json'));
    
    // Calculate overall score
    let score = 0;
    
    // Documentation scores
    if (analysis.documentation.claude.exists) score += 25;
    if (analysis.documentation.readme.exists) score += 20;
    if (analysis.documentation.claude.quality === 'excellent') score += 10;
    if (analysis.documentation.readme.quality === 'excellent') score += 10;
    
    // Code structure scores  
    if (analysis.codeStructure.srcDir) score += 10;
    if (analysis.codeStructure.testDir) score += 10;
    if (analysis.codeStructure.examplesDir) score += 5;
    
    // Build system scores
    if (analysis.buildSystem.hasPackageJson) score += 5;
    if (analysis.buildSystem.hasNpmScripts) score += 5;
    
    analysis.overall.score = score;
    
    // Determine status
    if (score >= 85) analysis.overall.status = 'excellent';
    else if (score >= 70) analysis.overall.status = 'good';
    else if (score >= 50) analysis.overall.status = 'needs-work';
    else analysis.overall.status = 'poor';
    
    // Report findings
    console.log(`   Package: ${analysis.packageJson?.name || 'N/A'} v${analysis.packageJson?.version || 'N/A'}`);
    console.log(`   CLAUDE.md: ${analysis.documentation.claude.exists ? `✅ ${analysis.documentation.claude.quality} (${analysis.documentation.claude.size} chars)` : '❌ Missing'}`);
    console.log(`   README.md: ${analysis.documentation.readme.exists ? `✅ ${analysis.documentation.readme.quality} (${analysis.documentation.readme.size} chars)` : '❌ Missing'}`);
    console.log(`   Structure: src:${analysis.codeStructure.srcDir ? '✅' : '❌'} test:${analysis.codeStructure.testDir ? '✅' : '❌'} examples:${analysis.codeStructure.examplesDir ? '✅' : '❌'}`);
    console.log(`   Score: ${score}/100 (${analysis.overall.status})`);
    
    results.push(analysis);
    
  } catch (e) {
    analysis.overall.issues.push(`Analysis error: ${e.message}`);
    results.push(analysis);
    console.log(`❌ Error analyzing project: ${e.message}`);
  }
  
  console.log('');
}

// Summary analysis
console.log('=== SUMMARY ANALYSIS ===\n');

const excellent = results.filter(r => r.overall.status === 'excellent');
const good = results.filter(r => r.overall.status === 'good'); 
const needsWork = results.filter(r => r.overall.status === 'needs-work');
const poor = results.filter(r => r.overall.status === 'poor');

console.log('📊 PROJECT STATUS DISTRIBUTION:');
console.log(`🏆 Excellent (85-100): ${excellent.length} projects`);
console.log(`✅ Good (70-84): ${good.length} projects`);  
console.log(`⚠️  Needs Work (50-69): ${needsWork.length} projects`);
console.log(`❌ Poor (0-49): ${poor.length} projects`);

const avgScore = Math.round(results.reduce((sum, r) => sum + r.overall.score, 0) / results.length);
console.log(`\n📈 Average Documentation Score: ${avgScore}/100\n`);

// Projects needing attention
if (needsWork.length > 0 || poor.length > 0) {
  console.log('⚠️  PROJECTS NEEDING DOCUMENTATION IMPROVEMENT:\n');
  
  [...needsWork, ...poor].sort((a, b) => a.overall.score - b.overall.score).forEach(project => {
    console.log(`${project.name.toUpperCase()} (Score: ${project.overall.score}/100):`);
    
    const missing = [];
    if (!project.documentation.claude.exists) missing.push('CLAUDE.md');
    if (!project.documentation.readme.exists) missing.push('README.md'); 
    if (!project.codeStructure.srcDir) missing.push('src/ directory');
    if (!project.codeStructure.testDir) missing.push('test/ directory');
    if (!project.codeStructure.examplesDir) missing.push('examples/');
    
    if (missing.length > 0) {
      console.log(`   Missing: ${missing.join(', ')}`);
    }
    
    const quality = [];
    if (project.documentation.claude.exists && project.documentation.claude.quality === 'poor') {
      quality.push('CLAUDE.md needs improvement');
    }
    if (project.documentation.readme.exists && project.documentation.readme.quality === 'poor') {
      quality.push('README.md needs improvement');
    }
    
    if (quality.length > 0) {
      console.log(`   Quality: ${quality.join(', ')}`);
    }
    
    if (project.overall.issues.length > 0) {
      console.log(`   Issues: ${project.overall.issues.join(', ')}`);
    }
    
    console.log('');
  });
}

// Best projects
if (excellent.length > 0) {
  console.log('🏆 BEST DOCUMENTED PROJECTS:\n');
  excellent.sort((a, b) => b.overall.score - a.overall.score).forEach(project => {
    console.log(`${project.name.toUpperCase()} (${project.overall.score}/100):`);
    console.log(`   ${project.packageJson?.description || 'No description'}`);
    console.log(`   CLAUDE.md: ${project.documentation.claude.quality} (${project.documentation.claude.size} chars)`);
    console.log(`   README.md: ${project.documentation.readme.quality} (${project.documentation.readme.size} chars)`);
    console.log('');
  });
}

// Technology overview
console.log('🔧 CORE TECHNOLOGY STACK OVERVIEW:\n');
results.forEach(project => {
  if (project.packageJson) {
    const tech = [];
    if (project.buildSystem.hasTsConfig) tech.push('TypeScript');
    if (project.packageJson.dependencies?.['gun']) tech.push('GUN Database');  
    if (project.packageJson.dependencies?.['node-pty']) tech.push('Terminal/PTY');
    if (project.packageJson.name?.includes('ui')) tech.push('UI Framework');
    if (project.packageJson.name?.includes('build')) tech.push('Build System');
    
    console.log(`${project.name}: ${project.packageJson.description || 'No description'}`);
    if (tech.length > 0) console.log(`   Tech: ${tech.join(', ')}`);
    console.log('');
  }
});

// Final recommendations
console.log('💡 RECOMMENDATIONS:\n');

if (avgScore >= 80) {
  console.log('✅ Overall documentation quality is GOOD');
  console.log('Focus on improving the weakest projects');
} else if (avgScore >= 65) {
  console.log('⚠️  Documentation quality is ACCEPTABLE but needs improvement');
  console.log('Several projects need attention');
} else {
  console.log('❌ Documentation quality is POOR across the board');  
  console.log('Major documentation effort needed');
}

const priorityProjects = results.filter(r => r.overall.score < 70).sort((a, b) => a.overall.score - b.overall.score);

if (priorityProjects.length > 0) {
  console.log('\n🎯 PRIORITY PROJECTS TO FIX:');
  priorityProjects.slice(0, 3).forEach((project, index) => {
    console.log(`${index + 1}. ${project.name.toUpperCase()} (${project.overall.score}/100) - ${project.overall.status}`);
  });
}

console.log('\n🚀 Use Composer to regenerate documentation for incomplete projects!');
console.log('Focus on projects with missing CLAUDE.md or README.md files.');