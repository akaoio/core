#!/usr/bin/env node
/**
 * @akaoio/core Update Script
 * Updates all repositories to latest versions
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

console.log('🔄 @akaoio/core Update Starting...\n')

// Load repository configuration
const reposConfig = JSON.parse(readFileSync(join(rootDir, 'config', 'repos.json'), 'utf-8'))
const { repositories, build_order } = reposConfig

// Update each repository
console.log('📥 Updating repositories...\n')

const updateResults = {}

for (const [name, config] of Object.entries(repositories)) {
  const targetDir = join(rootDir, config.directory)
  
  if (!existsSync(targetDir)) {
    console.log(`⚠️  ${name}: Directory not found, skipping`)
    updateResults[name] = 'missing'
    continue
  }

  try {
    console.log(`🔄 Updating ${name}`)
    
    // Get current commit hash
    const beforeHash = execSync('git rev-parse HEAD', { 
      cwd: targetDir, 
      encoding: 'utf-8' 
    }).trim()

    // Fetch and pull latest changes
    execSync(`git fetch origin ${config.branch}`, { cwd: targetDir, stdio: 'pipe' })
    execSync(`git pull origin ${config.branch}`, { cwd: targetDir, stdio: 'pipe' })
    
    // Get new commit hash
    const afterHash = execSync('git rev-parse HEAD', { 
      cwd: targetDir, 
      encoding: 'utf-8' 
    }).trim()

    if (beforeHash === afterHash) {
      console.log(`✅ ${name}: Already up to date`)
      updateResults[name] = 'up-to-date'
    } else {
      console.log(`✅ ${name}: Updated ${beforeHash.slice(0, 7)} → ${afterHash.slice(0, 7)}`)
      updateResults[name] = 'updated'
    }
  } catch (error) {
    console.error(`❌ ${name}: Update failed - ${error.message}`)
    updateResults[name] = 'failed'
  }
}

// Update dependencies for projects that were updated
console.log('\n📦 Updating dependencies...\n')

const updatedProjects = Object.entries(updateResults)
  .filter(([name, status]) => status === 'updated')
  .map(([name]) => name)

if (updatedProjects.length > 0) {
  try {
    console.log('🔄 Installing updated dependencies')
    execSync('npm install', { stdio: 'inherit', cwd: rootDir })
    console.log('✅ Dependencies updated')
  } catch (error) {
    console.error(`❌ Dependency update failed - ${error.message}`)
  }
} else {
  console.log('⏭️  No dependency updates needed')
}

// Rebuild projects that were updated
console.log('\n🏗️  Rebuilding updated projects...\n')

const projectsToRebuild = build_order.filter(name => 
  updateResults[name] === 'updated' || 
  // Also rebuild if dependencies were updated
  repositories[name].dependencies?.some(dep => updateResults[dep] === 'updated')
)

if (projectsToRebuild.length === 0) {
  console.log('⏭️  No rebuilds needed')
} else {
  for (const projectName of projectsToRebuild) {
    const projectDir = join(rootDir, 'projects', projectName)
    
    try {
      console.log(`🔨 Rebuilding ${projectName}`)
      execSync('npm run build', { stdio: 'inherit', cwd: projectDir })
      console.log(`✅ ${projectName}: Rebuilt successfully`)
    } catch (error) {
      console.error(`❌ ${projectName}: Rebuild failed - ${error.message}`)
    }
  }
}

console.log('\n🎉 Update Complete!\n')

// Summary
const summary = {
  updated: Object.values(updateResults).filter(status => status === 'updated').length,
  upToDate: Object.values(updateResults).filter(status => status === 'up-to-date').length,
  failed: Object.values(updateResults).filter(status => status === 'failed').length,
  missing: Object.values(updateResults).filter(status => status === 'missing').length
}

console.log('📋 Summary:')
console.log(`   • Updated: ${summary.updated}`)
console.log(`   • Up to date: ${summary.upToDate}`)
console.log(`   • Failed: ${summary.failed}`)
console.log(`   • Missing: ${summary.missing}`)

if (summary.updated > 0) {
  console.log('\n🚀 Recommended next steps:')
  console.log('   • npm test          # Run tests to verify updates')
  console.log('   • npm run status    # Check project status')
}

if (summary.failed > 0 || summary.missing > 0) {
  console.log('\n⚠️  Some repositories had issues. Run "npm run setup" to fix missing repos.')
  process.exit(1)
}

console.log('\n✨ All repositories up to date!')