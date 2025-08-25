#!/usr/bin/env node
/**
 * @akaoio/core Clean Script
 * Cleans build artifacts and temporary files
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

console.log('🧹 @akaoio/core Clean Starting...\n')

// Load repository configuration
const reposConfig = JSON.parse(readFileSync(join(rootDir, 'config', 'repos.json'), 'utf-8'))
const { repositories, build_order } = reposConfig

// Parse command line arguments
const args = process.argv.slice(2)
const isDeep = args.includes('--deep')
const isDryRun = args.includes('--dry-run')

if (isDryRun) {
  console.log('🔍 Dry run mode - no files will be deleted\n')
}

// Clean each project
console.log('🗑️  Cleaning projects...\n')

const cleanResults = {}

for (const projectName of build_order) {
  const projectDir = join(rootDir, 'projects', projectName)
  
  if (!existsSync(projectDir)) {
    console.log(`⏭️  ${projectName}: Directory not found, skipping`)
    continue
  }

  console.log(`🧹 Cleaning ${projectName}`)
  
  try {
    let cleanedItems = []

    // Standard clean targets
    const standardTargets = [
      'dist',
      'build', 
      'lib',
      'tmp',
      'temp',
      '.tmp',
      'coverage',
      '.nyc_output',
      '*.tgz',
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'lerna-debug.log*'
    ]

    // Deep clean targets (more aggressive)
    const deepTargets = [
      'node_modules',
      'package-lock.json',
      'yarn.lock',
      '.cache',
      '.parcel-cache',
      '.eslintcache'
    ]

    const targets = isDeep ? [...standardTargets, ...deepTargets] : standardTargets

    for (const target of targets) {
      const targetPath = join(projectDir, target)
      
      if (existsSync(targetPath)) {
        if (!isDryRun) {
          rmSync(targetPath, { recursive: true, force: true })
        }
        cleanedItems.push(target)
      }
    }

    // Try to run project's clean script if it exists
    const packageJsonPath = join(projectDir, 'package.json')
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      
      if (packageJson.scripts?.clean) {
        try {
          if (!isDryRun) {
            execSync('npm run clean', { cwd: projectDir, stdio: 'pipe' })
          }
          cleanedItems.push('npm clean script')
        } catch (error) {
          // Ignore clean script errors
        }
      }
    }

    if (cleanedItems.length > 0) {
      console.log(`   ✅ Cleaned: ${cleanedItems.join(', ')}`)
      cleanResults[projectName] = 'cleaned'
    } else {
      console.log(`   ✅ Already clean`)
      cleanResults[projectName] = 'already-clean'
    }
    
  } catch (error) {
    console.error(`   ❌ Error cleaning: ${error.message}`)
    cleanResults[projectName] = 'error'
  }
}

// Clean workspace root
console.log('\n🧹 Cleaning workspace root...')

try {
  const rootTargets = [
    'node_modules',
    'package-lock.json', 
    'tmp',
    'temp',
    '.tmp',
    'coverage',
    '*.log',
    'npm-debug.log*'
  ]

  let rootCleaned = []
  
  for (const target of rootTargets) {
    const targetPath = join(rootDir, target)
    
    if (existsSync(targetPath)) {
      if (!isDryRun) {
        rmSync(targetPath, { recursive: true, force: true })
      }
      rootCleaned.push(target)
    }
  }

  if (rootCleaned.length > 0) {
    console.log(`   ✅ Cleaned: ${rootCleaned.join(', ')}`)
  } else {
    console.log(`   ✅ Already clean`)
  }
  
} catch (error) {
  console.error(`   ❌ Error cleaning workspace: ${error.message}`)
}

console.log('\n🎉 Clean Complete!\n')

// Summary
const summary = {
  cleaned: Object.values(cleanResults).filter(status => status === 'cleaned').length,
  alreadyClean: Object.values(cleanResults).filter(status => status === 'already-clean').length,
  errors: Object.values(cleanResults).filter(status => status === 'error').length
}

console.log('📋 Clean Summary:')
console.log(`   • Cleaned: ${summary.cleaned}`)
console.log(`   • Already clean: ${summary.alreadyClean}`)
console.log(`   • Errors: ${summary.errors}`)

if (isDryRun) {
  console.log('\n💡 This was a dry run. Use without --dry-run to actually delete files.')
} else {
  console.log('\n💡 To reinstall dependencies, run "npm install"')
  
  if (isDeep) {
    console.log('💡 Deep clean performed. Run "npm run setup" to restore everything.')
  }
}

if (summary.errors > 0) {
  process.exit(1)
}

console.log('\n✨ Workspace cleaned successfully!')