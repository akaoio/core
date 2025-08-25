#!/usr/bin/env node
/**
 * @akaoio/core Status Script
 * Shows status of all repositories
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

console.log('📊 @akaoio/core Status Report\n')

// Load repository configuration
const reposConfig = JSON.parse(readFileSync(join(rootDir, 'config', 'repos.json'), 'utf-8'))
const { repositories } = reposConfig

// Check each repository status
console.log('📁 Repository Status:\n')

const statusData = {}

for (const [name, config] of Object.entries(repositories)) {
  const targetDir = join(rootDir, config.directory)
  
  process.stdout.write(`${name.padEnd(12)} `)
  
  if (!existsSync(targetDir)) {
    console.log('❌ Not cloned')
    statusData[name] = { status: 'missing' }
    continue
  }

  try {
    // Get git information
    const branch = execSync('git branch --show-current', { 
      cwd: targetDir, 
      encoding: 'utf-8' 
    }).trim()
    
    const lastCommit = execSync('git log -1 --format="%h %s"', { 
      cwd: targetDir, 
      encoding: 'utf-8' 
    }).trim()

    // Check if there are uncommitted changes
    let hasChanges = false
    try {
      const gitStatus = execSync('git status --porcelain', { 
        cwd: targetDir, 
        encoding: 'utf-8' 
      }).trim()
      hasChanges = gitStatus.length > 0
    } catch (error) {
      // Ignore git status errors
    }

    // Check if behind remote
    let behindCount = 0
    try {
      execSync('git fetch origin --dry-run', { cwd: targetDir, stdio: 'pipe' })
      const behindOutput = execSync('git rev-list HEAD..origin/' + branch + ' --count', { 
        cwd: targetDir, 
        encoding: 'utf-8' 
      }).trim()
      behindCount = parseInt(behindOutput) || 0
    } catch (error) {
      // Ignore fetch errors
    }

    // Check build status
    const distDir = join(targetDir, 'dist')
    const hasBuild = existsSync(distDir)
    let buildTime = null
    
    if (hasBuild) {
      const buildStat = statSync(distDir)
      buildTime = buildStat.mtime
    }

    // Check if package.json has test script
    const packageJsonPath = join(targetDir, 'package.json')
    let hasTests = false
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      hasTests = !!packageJson.scripts?.test
    }

    // Determine overall status
    let status = '✅'
    let statusText = 'OK'
    
    if (!hasBuild) {
      status = '⚠️'
      statusText = 'No build'
    } else if (hasChanges) {
      status = '🔄'
      statusText = 'Uncommitted'
    } else if (behindCount > 0) {
      status = '📥'
      statusText = `${behindCount} behind`
    }

    console.log(`${status} ${statusText.padEnd(12)} ${branch} (${lastCommit})`)
    
    statusData[name] = {
      status: statusText,
      branch,
      lastCommit,
      hasChanges,
      behindCount,
      hasBuild,
      buildTime,
      hasTests
    }
    
  } catch (error) {
    console.log(`❌ Git error: ${error.message}`)
    statusData[name] = { status: 'error', error: error.message }
  }
}

// Summary statistics
console.log('\n📊 Summary:\n')

const summary = {
  total: Object.keys(repositories).length,
  cloned: Object.values(statusData).filter(s => s.status !== 'missing').length,
  built: Object.values(statusData).filter(s => s.hasBuild).length,
  upToDate: Object.values(statusData).filter(s => s.behindCount === 0 && s.status !== 'missing').length,
  withChanges: Object.values(statusData).filter(s => s.hasChanges).length,
  withTests: Object.values(statusData).filter(s => s.hasTests).length
}

console.log(`Total repositories:     ${summary.total}`)
console.log(`Cloned locally:         ${summary.cloned}`)
console.log(`With builds:            ${summary.built}`)
console.log(`Up to date:             ${summary.upToDate}`)
console.log(`With uncommitted:       ${summary.withChanges}`)
console.log(`With test scripts:      ${summary.withTests}`)

// Health check
console.log('\n🏥 Health Check:\n')

const issues = []
const missing = Object.entries(statusData).filter(([name, data]) => data.status === 'missing')
if (missing.length > 0) {
  issues.push(`❌ Missing repositories: ${missing.map(([name]) => name).join(', ')}`)
}

const unbuilt = Object.entries(statusData).filter(([name, data]) => data.status !== 'missing' && !data.hasBuild)
if (unbuilt.length > 0) {
  issues.push(`⚠️  Unbuilt projects: ${unbuilt.map(([name]) => name).join(', ')}`)
}

const behind = Object.entries(statusData).filter(([name, data]) => data.behindCount > 0)
if (behind.length > 0) {
  issues.push(`📥 Behind remote: ${behind.map(([name]) => name).join(', ')}`)
}

const uncommitted = Object.entries(statusData).filter(([name, data]) => data.hasChanges)
if (uncommitted.length > 0) {
  issues.push(`🔄 Uncommitted changes: ${uncommitted.map(([name]) => name).join(', ')}`)
}

if (issues.length === 0) {
  console.log('✅ All repositories are healthy!')
} else {
  console.log('Issues found:')
  issues.forEach(issue => console.log(`   ${issue}`))
  
  console.log('\n💡 Recommended actions:')
  if (missing.length > 0) console.log('   • Run "npm run setup" to clone missing repos')
  if (unbuilt.length > 0) console.log('   • Run "npm run build" to build projects')
  if (behind.length > 0) console.log('   • Run "npm run update" to pull latest changes')
  if (uncommitted.length > 0) console.log('   • Review and commit changes in affected projects')
}

console.log('\n✨ Status report complete!')