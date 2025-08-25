#!/usr/bin/env node
/**
 * @akaoio/core Build Script
 * Builds all projects in dependency order
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

console.log('🏗️  @akaoio/core Build Starting...\n')

// Load repository configuration
const reposConfig = JSON.parse(readFileSync(join(rootDir, 'config', 'repos.json'), 'utf-8'))
const { repositories, build_order } = reposConfig

// Parse command line arguments
const args = process.argv.slice(2)
const projectFilter = args.length > 0 ? args : build_order
const isClean = args.includes('--clean')

if (isClean) {
  console.log('🧹 Clean build requested\n')
}

// Build projects in dependency order
const buildResults = {}

for (const projectName of build_order) {
  // Skip if not in filter
  if (!projectFilter.includes(projectName) && projectFilter !== build_order) {
    console.log(`⏭️  ${projectName}: Skipped (not in filter)`)
    continue
  }

  const projectDir = join(rootDir, 'projects', projectName)
  
  if (!existsSync(projectDir)) {
    console.log(`⚠️  ${projectName}: Directory not found, skipping`)
    buildResults[projectName] = 'missing'
    continue
  }

  const packageJsonPath = join(projectDir, 'package.json')
  if (!existsSync(packageJsonPath)) {
    console.log(`⚠️  ${projectName}: package.json not found, skipping`)
    buildResults[projectName] = 'no-package'
    continue
  }

  try {
    console.log(`🔨 Building ${projectName}`)
    
    // Clean build if requested
    if (isClean) {
      try {
        execSync('npm run clean', { cwd: projectDir, stdio: 'pipe' })
        console.log(`   🧹 Cleaned ${projectName}`)
      } catch (error) {
        // Ignore clean errors - not all projects have clean script
      }
    }

    // Check if build script exists
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    if (!packageJson.scripts?.build) {
      console.log(`⏭️  ${projectName}: No build script, skipping`)
      buildResults[projectName] = 'no-build-script'
      continue
    }

    // Build the project
    const startTime = Date.now()
    execSync('npm run build', { stdio: 'inherit', cwd: projectDir })
    const duration = Date.now() - startTime
    
    console.log(`✅ ${projectName}: Built successfully (${duration}ms)`)
    buildResults[projectName] = 'success'
    
  } catch (error) {
    console.error(`❌ ${projectName}: Build failed - ${error.message}`)
    buildResults[projectName] = 'failed'
    
    // Continue building other projects unless this is a core dependency
    const config = repositories[projectName]
    if (config?.core) {
      console.error(`💀 ${projectName} is a core technology - stopping build`)
      process.exit(1)
    }
  }
}

console.log('\n🎉 Build Complete!\n')

// Summary
const summary = {
  success: Object.values(buildResults).filter(status => status === 'success').length,
  failed: Object.values(buildResults).filter(status => status === 'failed').length,
  missing: Object.values(buildResults).filter(status => status === 'missing').length,
  noBuildScript: Object.values(buildResults).filter(status => status === 'no-build-script').length,
  skipped: build_order.length - Object.keys(buildResults).length
}

console.log('📋 Build Summary:')
console.log(`   • Successful: ${summary.success}`)
console.log(`   • Failed: ${summary.failed}`)
console.log(`   • Missing: ${summary.missing}`)
console.log(`   • No build script: ${summary.noBuildScript}`)
console.log(`   • Skipped: ${summary.skipped}`)

// Show detailed results
if (Object.keys(buildResults).length > 0) {
  console.log('\n📋 Detailed Results:')
  for (const [project, status] of Object.entries(buildResults)) {
    const emoji = {
      'success': '✅',
      'failed': '❌', 
      'missing': '⚠️',
      'no-build-script': '⏭️',
      'no-package': '⚠️'
    }[status] || '❓'
    
    console.log(`   ${emoji} ${project}: ${status}`)
  }
}

if (summary.failed > 0) {
  console.log('\n⚠️  Some builds failed. Check the error messages above.')
  process.exit(1)
}

if (summary.missing > 0) {
  console.log('\n💡 Run "npm run setup" to clone missing repositories.')
}

console.log('\n✨ All builds completed successfully!')