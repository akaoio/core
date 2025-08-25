#!/usr/bin/env node

/**
 * Sync script to keep ~/core/projects and ~/Projects directories synchronized
 * This ensures the workspace orchestrator stays in sync with active development folders
 */

import { execSync, spawn } from 'child_process'
import { existsSync, statSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import { homedir } from 'os'

const HOME = homedir()
const CORE_PROJECTS = resolve(HOME, 'core/projects')
const PROJECTS = resolve(HOME, 'Projects')

class DirectorySync {
  constructor() {
    this.dryRun = process.argv.includes('--dry-run')
    this.verbose = process.argv.includes('--verbose') || process.argv.includes('-v')
    this.direction = this.getDirection()
  }

  getDirection() {
    if (process.argv.includes('--to-core')) return 'to-core'
    if (process.argv.includes('--to-projects')) return 'to-projects'
    return 'auto' // Sync based on modification times
  }

  log(message, force = false) {
    if (this.verbose || force) {
      console.log(`[SYNC] ${message}`)
    }
  }

  error(message) {
    console.error(`[ERROR] ${message}`)
  }

  async checkDirectories() {
    if (!existsSync(CORE_PROJECTS)) {
      this.error(`Core projects directory not found: ${CORE_PROJECTS}`)
      return false
    }

    if (!existsSync(PROJECTS)) {
      this.error(`Projects directory not found: ${PROJECTS}`)
      return false
    }

    return true
  }

  getProjectDirs() {
    const coreProjects = new Set()
    const projects = new Set()

    if (existsSync(CORE_PROJECTS)) {
      readdirSync(CORE_PROJECTS).forEach(dir => {
        const fullPath = join(CORE_PROJECTS, dir)
        if (statSync(fullPath).isDirectory()) {
          coreProjects.add(dir)
        }
      })
    }

    if (existsSync(PROJECTS)) {
      readdirSync(PROJECTS).forEach(dir => {
        const fullPath = join(PROJECTS, dir)
        if (statSync(fullPath).isDirectory() && !dir.startsWith('.')) {
          projects.add(dir)
        }
      })
    }

    return { coreProjects, projects }
  }

  getLastModified(dirPath) {
    try {
      // Get the most recent modification time in the directory
      const result = execSync(`find "${dirPath}" -type f -name "*.ts" -o -name "*.js" -o -name "*.json" | xargs ls -t | head -1 | xargs stat -c %Y 2>/dev/null || echo 0`, 
        { encoding: 'utf8' }).trim()
      return parseInt(result) || 0
    } catch {
      return 0
    }
  }

  async syncProject(projectName, fromDir, toDir, reason) {
    const source = join(fromDir, projectName)
    const target = join(toDir, projectName)

    this.log(`${reason}: ${projectName} (${source} → ${target})`, true)

    if (this.dryRun) {
      this.log(`DRY RUN: Would sync ${projectName}`)
      return
    }

    try {
      // Use rsync for efficient synchronization
      const cmd = [
        'rsync', '-av', 
        '--exclude=.git',
        '--exclude=node_modules',
        '--exclude=dist',
        '--exclude=.claude',
        '--exclude=logs',
        '--exclude=tmp',
        '--delete',
        `${source}/`,
        `${target}/`
      ]

      if (this.verbose) {
        cmd.push('--progress')
      } else {
        cmd.push('--quiet')
      }

      const result = execSync(cmd.join(' '), { encoding: 'utf8' })
      if (this.verbose && result) {
        console.log(result)
      }

      this.log(`✓ Synced ${projectName}`)
    } catch (error) {
      this.error(`Failed to sync ${projectName}: ${error.message}`)
    }
  }

  async syncAll() {
    if (!(await this.checkDirectories())) {
      process.exit(1)
    }

    const { coreProjects, projects } = this.getProjectDirs()
    const allProjects = new Set([...coreProjects, ...projects])

    this.log(`Found projects: ${Array.from(allProjects).join(', ')}`, true)

    for (const project of allProjects) {
      const coreProjectPath = join(CORE_PROJECTS, project)
      const projectPath = join(PROJECTS, project)

      const coreExists = existsSync(coreProjectPath)
      const projectExists = existsSync(projectPath)

      if (!coreExists && !projectExists) {
        continue // Skip if neither exists
      }

      let syncDirection = this.direction

      if (syncDirection === 'auto') {
        if (!coreExists) {
          syncDirection = 'to-core'
        } else if (!projectExists) {
          syncDirection = 'to-projects'
        } else {
          // Both exist, compare modification times
          const coreTime = this.getLastModified(coreProjectPath)
          const projectTime = this.getLastModified(projectPath)

          if (projectTime > coreTime) {
            syncDirection = 'to-core'
          } else if (coreTime > projectTime) {
            syncDirection = 'to-projects'
          } else {
            this.log(`${project}: No sync needed (same modification time)`)
            continue
          }
        }
      }

      // Perform sync based on direction
      if (syncDirection === 'to-core') {
        if (projectExists) {
          await this.syncProject(project, PROJECTS, CORE_PROJECTS, 'Projects → Core')
        }
      } else if (syncDirection === 'to-projects') {
        if (coreExists) {
          await this.syncProject(project, CORE_PROJECTS, PROJECTS, 'Core → Projects')
        }
      }
    }

    this.log('Sync completed', true)
  }

  async watch() {
    const chokidar = await import('chokidar')
    
    this.log('Starting file system watcher...', true)
    this.log('Watching for changes in both directories', true)

    let syncing = false

    const sync = async () => {
      if (syncing) return
      syncing = true
      
      try {
        await this.syncAll()
      } catch (error) {
        this.error(`Sync error: ${error.message}`)
      }
      
      syncing = false
    }

    // Watch only specific file types to reduce file watcher usage
    const watcher = chokidar.watch([CORE_PROJECTS, PROJECTS], {
      ignored: /(node_modules|\.git|dist|logs|tmp|\.claude|coverage|build|target)\/|.*\.(o|so|a|dylib|dll|exe|bin)$/,
      ignoreInitial: true,
      depth: 3
    })

    watcher
      .on('change', path => {
        this.log(`File changed: ${path}`)
        sync()
      })
      .on('add', path => {
        this.log(`File added: ${path}`)
        sync()
      })
      .on('unlink', path => {
        this.log(`File removed: ${path}`)
        sync()
      })

    // Initial sync
    await sync()

    // Keep the process running
    process.on('SIGINT', () => {
      this.log('Stopping watcher...', true)
      watcher.close()
      process.exit(0)
    })

    this.log('Watcher started. Press Ctrl+C to stop.', true)
  }

  showHelp() {
    console.log(`
Directory Sync Tool - Keep ~/core/projects and ~/Projects synchronized

Usage: node scripts/sync.js [options]

Options:
  --help              Show this help message
  --dry-run          Show what would be synced without making changes
  --verbose, -v      Show detailed output
  --to-core          Force sync from Projects to core/projects
  --to-projects      Force sync from core/projects to Projects
  --watch            Start file system watcher for continuous sync

Examples:
  node scripts/sync.js                    # Auto-sync based on modification times
  node scripts/sync.js --dry-run          # See what would be synced
  node scripts/sync.js --to-core          # Force sync to core directory
  node scripts/sync.js --watch --verbose  # Start watcher with detailed output

Notes:
  - Auto-sync compares file modification times to determine direction
  - Excludes .git, node_modules, dist, logs, tmp, .claude directories
  - Uses rsync for efficient synchronization
  - Safe to run multiple times
`)
  }
}

async function main() {
  const sync = new DirectorySync()

  if (process.argv.includes('--help')) {
    sync.showHelp()
    return
  }

  if (process.argv.includes('--watch')) {
    await sync.watch()
  } else {
    await sync.syncAll()
  }
}

main().catch(error => {
  console.error('Sync failed:', error)
  process.exit(1)
})