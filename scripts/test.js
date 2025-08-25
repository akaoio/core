#!/usr/bin/env node
/**
 * @akaoio/core Test Script
 * Runs tests for all projects
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

console.log('🧪 @akaoio/core Test Suite Starting...\n')

// Load repository configuration
const reposConfig = JSON.parse(readFileSync(join(rootDir, 'config', 'repos.json'), 'utf-8'))
const { repositories, build_order } = reposConfig

// Parse command line arguments
const args = process.argv.slice(2)
const projectFilter = args.length > 0 ? args : build_order
const isVerbose = args.includes('--verbose')
const isFail = args.includes('--fail-fast')

// Run tests for each project
const testResults = {}

for (const projectName of build_order) {
  // Skip if not in filter
  if (!projectFilter.includes(projectName) && projectFilter !== build_order) {
    console.log(`⏭️  ${projectName}: Skipped (not in filter)`)
    continue
  }

  const projectDir = join(rootDir, 'projects', projectName)
  
  if (!existsSync(projectDir)) {
    console.log(`⚠️  ${projectName}: Directory not found, skipping`)
    testResults[projectName] = 'missing'
    continue
  }

  const packageJsonPath = join(projectDir, 'package.json')
  if (!existsSync(packageJsonPath)) {
    console.log(`⚠️  ${projectName}: package.json not found, skipping`)
    testResults[projectName] = 'no-package'
    continue
  }

  try {
    // Check if test script exists
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    if (!packageJson.scripts?.test) {
      console.log(`⏭️  ${projectName}: No test script, skipping`)
      testResults[projectName] = 'no-test-script'
      continue
    }

    console.log(`🧪 Testing ${projectName}`)
    
    const startTime = Date.now()
    const stdio = isVerbose ? 'inherit' : 'pipe'
    
    try {
      execSync('npm test', { stdio, cwd: projectDir })
      const duration = Date.now() - startTime
      console.log(`✅ ${projectName}: Tests passed (${duration}ms)`)
      testResults[projectName] = 'passed'
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ ${projectName}: Tests failed (${duration}ms)`)
      
      if (isVerbose || isFail) {
        console.error(error.stdout?.toString() || error.message)
      }
      
      testResults[projectName] = 'failed'
      
      if (isFail) {
        console.error(`💀 Fast fail requested - stopping tests`)
        process.exit(1)
      }
    }
    
  } catch (error) {
    console.error(`❌ ${projectName}: Test setup failed - ${error.message}`)
    testResults[projectName] = 'error'
    
    if (isFail) {
      process.exit(1)
    }
  }
}

console.log('\n🎉 Test Run Complete!\n')

// Summary
const summary = {
  passed: Object.values(testResults).filter(status => status === 'passed').length,
  failed: Object.values(testResults).filter(status => status === 'failed').length,
  error: Object.values(testResults).filter(status => status === 'error').length,
  missing: Object.values(testResults).filter(status => status === 'missing').length,
  noTestScript: Object.values(testResults).filter(status => status === 'no-test-script').length,
  skipped: build_order.length - Object.keys(testResults).length
}

console.log('📋 Test Summary:')
console.log(`   • Passed: ${summary.passed}`)
console.log(`   • Failed: ${summary.failed}`)
console.log(`   • Error: ${summary.error}`)
console.log(`   • Missing: ${summary.missing}`)
console.log(`   • No test script: ${summary.noTestScript}`)
console.log(`   • Skipped: ${summary.skipped}`)

// Show detailed results
if (Object.keys(testResults).length > 0) {
  console.log('\n📋 Detailed Results:')
  for (const [project, status] of Object.entries(testResults)) {
    const emoji = {
      'passed': '✅',
      'failed': '❌',
      'error': '💥', 
      'missing': '⚠️',
      'no-test-script': '⏭️',
      'no-package': '⚠️'
    }[status] || '❓'
    
    console.log(`   ${emoji} ${project}: ${status}`)
  }
}

if (summary.failed > 0 || summary.error > 0) {
  console.log('\n⚠️  Some tests failed. Use --verbose flag for detailed output.')
  console.log('💡 Fix failing tests or run with specific project: npm test composer')
  process.exit(1)
}

if (summary.missing > 0) {
  console.log('\n💡 Run "npm run setup" to clone missing repositories.')
}

console.log('\n✨ All tests passed!')