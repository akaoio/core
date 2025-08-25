#!/usr/bin/env node
/**
 * @akaoio/core Setup Script
 * Clones all repositories and sets up the workspace
 */

import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

console.log('🚀 @akaoio/core Setup Starting...\n')

// Load repository configuration
const reposConfig = JSON.parse(readFileSync(join(rootDir, 'config', 'repos.json'), 'utf-8'))
const { repositories, build_order, core_technologies } = reposConfig

// Ensure projects directory exists
const projectsDir = join(rootDir, 'projects')
if (!existsSync(projectsDir)) {
  mkdirSync(projectsDir, { recursive: true })
  console.log('📁 Created projects/ directory')
}

// Clone repositories
console.log('📥 Cloning repositories...\n')

for (const [name, config] of Object.entries(repositories)) {
  const targetDir = join(rootDir, config.directory)
  
  if (existsSync(targetDir)) {
    console.log(`⏭️  ${name}: Already exists, skipping clone`)
    continue
  }

  try {
    console.log(`🔄 Cloning ${name} from ${config.url}`)
    execSync(`git clone --branch ${config.branch} ${config.url} ${targetDir}`, {
      stdio: 'inherit',
      cwd: rootDir
    })
    console.log(`✅ ${name}: Cloned successfully`)
  } catch (error) {
    console.error(`❌ ${name}: Clone failed - ${error.message}`)
    process.exit(1)
  }
}

console.log('\n📦 Installing dependencies...\n')

// Install root workspace dependencies
try {
  console.log('🔄 Installing workspace dependencies')
  execSync('npm install', { stdio: 'inherit', cwd: rootDir })
  console.log('✅ Workspace dependencies installed')
} catch (error) {
  console.error(`❌ Workspace install failed - ${error.message}`)
  process.exit(1)
}

// Setup workspace package.json in each project to use workspace:* 
console.log('\n🔧 Configuring workspace dependencies...\n')

for (const projectName of core_technologies) {
  const projectDir = join(rootDir, 'projects', projectName)
  const packageJsonPath = join(projectDir, 'package.json')
  
  if (!existsSync(packageJsonPath)) {
    console.log(`⚠️  ${projectName}: package.json not found, skipping`)
    continue
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    let modified = false

    // Update devDependencies to use workspace:*
    if (packageJson.devDependencies) {
      for (const dep of Object.keys(packageJson.devDependencies)) {
        if (dep.startsWith('@akaoio/') && core_technologies.includes(dep.replace('@akaoio/', ''))) {
          packageJson.devDependencies[dep] = 'workspace:*'
          modified = true
        }
      }
    }

    if (modified) {
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
      console.log(`✅ ${projectName}: Updated to use workspace:* dependencies`)
    } else {
      console.log(`⏭️  ${projectName}: No workspace dependencies to update`)
    }
  } catch (error) {
    console.error(`❌ ${projectName}: Failed to update package.json - ${error.message}`)
  }
}

// Install all project dependencies
console.log('\n📦 Installing project dependencies...\n')

try {
  console.log('🔄 Installing all project dependencies')
  execSync('npm install', { stdio: 'inherit', cwd: rootDir })
  console.log('✅ All dependencies installed')
} catch (error) {
  console.error(`❌ Dependencies install failed - ${error.message}`)
  process.exit(1)
}

console.log('\n🏗️  Building projects in dependency order...\n')

// Build projects in dependency order
for (const projectName of build_order) {
  const projectDir = join(rootDir, 'projects', projectName)
  
  if (!existsSync(projectDir)) {
    console.log(`⚠️  ${projectName}: Directory not found, skipping build`)
    continue
  }

  try {
    console.log(`🔨 Building ${projectName}`)
    execSync('npm run build', { stdio: 'inherit', cwd: projectDir })
    console.log(`✅ ${projectName}: Built successfully`)
  } catch (error) {
    console.error(`❌ ${projectName}: Build failed - ${error.message}`)
    // Continue with other projects
  }
}

console.log('\n🎉 Setup Complete!\n')

console.log('📋 Summary:')
console.log(`   • Cloned ${Object.keys(repositories).length} repositories`)
console.log(`   • Configured ${core_technologies.length} core technologies`)
console.log(`   • Built ${build_order.length} projects`)

console.log('\n🚀 Next steps:')
console.log('   • npm test          # Run all tests')
console.log('   • npm run status    # Check project status') 
console.log('   • npm run update    # Update all repositories')

console.log('\n💡 Core technologies available:')
for (const tech of core_technologies) {
  const config = repositories[tech]
  console.log(`   • ${tech.padEnd(12)} - ${config.description}`)
}

console.log('\n✨ Ready for development!')