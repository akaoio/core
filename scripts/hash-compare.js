#!/usr/bin/env node

/**
 * Hash-based directory comparison tool
 * Compares content hash of ~/core/projects vs ~/Projects directories
 */

import { createHash } from 'crypto'
import { execSync } from 'child_process'
import { existsSync, readdirSync, statSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { homedir } from 'os'

const HOME = homedir()
const CORE_PROJECTS = resolve(HOME, 'core/projects')
const PROJECTS = resolve(HOME, 'Projects')

class HashComparison {
  constructor() {
    this.verbose = process.argv.includes('--verbose') || process.argv.includes('-v')
    this.showDiff = process.argv.includes('--diff')
    this.projectFilter = process.argv.find(arg => arg.startsWith('--project='))?.split('=')[1]
  }

  log(message, force = false) {
    if (this.verbose || force) {
      console.log(`[HASH] ${message}`)
    }
  }

  /**
   * Calculate hash of directory contents (excluding ignored files)
   */
  getDirectoryHash(dirPath) {
    if (!existsSync(dirPath)) {
      return null
    }

    try {
      // Get all files recursively, excluding ignored patterns
      const files = execSync(`find "${dirPath}" -type f ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/logs/*" ! -path "*/tmp/*" ! -path "*/.claude/*" ! -name "*.o" ! -name "*.so" ! -name "*.a" | sort`, 
        { encoding: 'utf8' }).trim().split('\n').filter(f => f)

      if (files.length === 0) {
        return 'empty'
      }

      const hash = createHash('sha256')
      
      for (const file of files) {
        try {
          // Add relative path to hash
          const relativePath = file.replace(dirPath + '/', '')
          hash.update(relativePath)
          
          // Add file content to hash
          const content = readFileSync(file)
          hash.update(content)
          
          if (this.verbose) {
            console.log(`  📄 ${relativePath}`)
          }
        } catch (error) {
          // Skip files that can't be read
          this.log(`Skipping unreadable file: ${file}`)
        }
      }

      return hash.digest('hex')
    } catch (error) {
      this.log(`Error calculating hash for ${dirPath}: ${error.message}`)
      return null
    }
  }

  /**
   * Get file count and size info
   */
  getDirectoryInfo(dirPath) {
    if (!existsSync(dirPath)) {
      return { files: 0, size: 0 }
    }

    try {
      const result = execSync(`find "${dirPath}" -type f ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/logs/*" ! -path "*/tmp/*" ! -path "*/.claude/*" ! -name "*.o" ! -name "*.so" ! -name "*.a" | wc -l`, 
        { encoding: 'utf8' }).trim()
      const files = parseInt(result) || 0

      const sizeResult = execSync(`find "${dirPath}" -type f ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/logs/*" ! -path "*/tmp/*" ! -path "*/.claude/*" ! -name "*.o" ! -name "*.so" ! -name "*.a" -exec du -cb {} + 2>/dev/null | tail -1 | cut -f1 || echo 0`, 
        { encoding: 'utf8' }).trim()
      const size = parseInt(sizeResult) || 0

      return { files, size }
    } catch {
      return { files: 0, size: 0 }
    }
  }

  /**
   * Compare two directories using hash
   */
  compareDirectories(dir1, dir2, projectName) {
    this.log(`Comparing ${projectName}...`, true)
    
    const hash1 = this.getDirectoryHash(dir1)
    const hash2 = this.getDirectoryHash(dir2)
    const info1 = this.getDirectoryInfo(dir1)
    const info2 = this.getDirectoryInfo(dir2)

    const result = {
      project: projectName,
      coreExists: hash1 !== null,
      projectsExists: hash2 !== null,
      coreHash: hash1,
      projectsHash: hash2,
      identical: hash1 === hash2,
      coreInfo: info1,
      projectsInfo: info2
    }

    // Show comparison result
    if (hash1 === null && hash2 === null) {
      console.log(`❓ ${projectName}: Both directories missing`)
    } else if (hash1 === null) {
      console.log(`⬅️  ${projectName}: Only in Projects (${info2.files} files, ${this.formatSize(info2.size)})`)
    } else if (hash2 === null) {
      console.log(`➡️  ${projectName}: Only in Core (${info1.files} files, ${this.formatSize(info1.size)})`)
    } else if (hash1 === hash2) {
      console.log(`✅ ${projectName}: IDENTICAL (${info1.files} files, ${this.formatSize(info1.size)})`)
    } else {
      console.log(`❌ ${projectName}: DIFFERENT`)
      console.log(`   Core:     ${info1.files} files, ${this.formatSize(info1.size)} - ${hash1.substring(0, 12)}...`)
      console.log(`   Projects: ${info2.files} files, ${this.formatSize(info2.size)} - ${hash2.substring(0, 12)}...`)
    }

    return result
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  /**
   * Get all project directories
   */
  getProjects() {
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

    return new Set([...coreProjects, ...projects])
  }

  /**
   * Run comparison
   */
  async compare() {
    console.log('🔍 Hash-based Directory Comparison')
    console.log('==================================')
    console.log(`Core location: ${CORE_PROJECTS}`)
    console.log(`Projects location: ${PROJECTS}`)
    console.log('')

    const allProjects = this.getProjects()
    const results = []

    for (const project of Array.from(allProjects).sort()) {
      // Apply project filter if specified
      if (this.projectFilter && project !== this.projectFilter) {
        continue
      }

      const coreDir = join(CORE_PROJECTS, project)
      const projectsDir = join(PROJECTS, project)
      
      const result = this.compareDirectories(coreDir, projectsDir, project)
      results.push(result)
    }

    console.log('')
    this.showSummary(results)

    if (this.showDiff) {
      console.log('')
      this.showDetailedDifferences(results)
    }

    return results
  }

  showSummary(results) {
    const identical = results.filter(r => r.identical && r.coreExists && r.projectsExists).length
    const different = results.filter(r => !r.identical && r.coreExists && r.projectsExists).length
    const coreOnly = results.filter(r => r.coreExists && !r.projectsExists).length
    const projectsOnly = results.filter(r => !r.coreExists && r.projectsExists).length

    console.log('📊 SUMMARY')
    console.log('==========')
    console.log(`✅ Identical: ${identical}`)
    console.log(`❌ Different: ${different}`)
    console.log(`➡️  Core only: ${coreOnly}`)
    console.log(`⬅️  Projects only: ${projectsOnly}`)
    console.log(`📁 Total projects: ${results.length}`)

    const syncPercentage = results.length > 0 ? Math.round((identical / results.length) * 100) : 0
    console.log(`🎯 Sync status: ${syncPercentage}%`)
  }

  showDetailedDifferences(results) {
    const different = results.filter(r => !r.identical && r.coreExists && r.projectsExists)
    
    if (different.length === 0) {
      console.log('🎉 No differences found!')
      return
    }

    console.log('🔍 DETAILED DIFFERENCES')
    console.log('======================')

    for (const result of different) {
      console.log(`\n📁 ${result.project}:`)
      console.log(`   Core hash:     ${result.coreHash}`)
      console.log(`   Projects hash: ${result.projectsHash}`)
      
      // Try to identify what's different
      try {
        const coreDir = join(CORE_PROJECTS, result.project)
        const projectsDir = join(PROJECTS, result.project)
        
        console.log(`   🔄 Run this to see file differences:`)
        console.log(`      rsync -av --dry-run --delete "${projectsDir}/" "${coreDir}/"`);
      } catch (error) {
        console.log(`   ❌ Could not analyze differences: ${error.message}`)
      }
    }
  }

  showHelp() {
    console.log(`
Hash-based Directory Comparison Tool

Usage: node scripts/hash-compare.js [options]

Options:
  --help              Show this help message
  --verbose, -v       Show detailed file processing
  --diff              Show detailed differences for mismatched directories
  --project=NAME      Compare only specific project

Examples:
  node scripts/hash-compare.js                    # Compare all projects
  node scripts/hash-compare.js --verbose          # Show file-by-file processing
  node scripts/hash-compare.js --diff             # Show detailed differences
  node scripts/hash-compare.js --project=air      # Compare only air project

Hash Method:
  - Uses SHA-256 hash of all file contents + relative paths
  - Excludes: node_modules, .git, dist, logs, tmp, .claude, binary files
  - Deterministic: Same content always produces same hash
  - Sensitive: Even tiny changes result in different hash
`)
  }
}

async function main() {
  const comparison = new HashComparison()

  if (process.argv.includes('--help')) {
    comparison.showHelp()
    return
  }

  await comparison.compare()
}

main().catch(error => {
  console.error('Comparison failed:', error)
  process.exit(1)
})