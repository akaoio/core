#!/usr/bin/env node

/**
 * Protected Cleanup Script
 * Safely cleans temporary files while protecting critical infrastructure
 */

const fs = require('fs')
const path = require('path')
const FileProtectionSystem = require('./file-protection-system.cjs')

class ProtectedCleanup {
  constructor() {
    this.protectionSystem = new FileProtectionSystem()
    this.workspaceRoot = process.cwd()
  }

  log(message) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${message}`)
  }

  async safeDeletion(filePaths) {
    this.log('🛡️ Validating files before deletion...')
    
    const validation = this.protectionSystem.validateDeletion(filePaths)
    
    if (validation.blocked.length > 0) {
      this.log(`🚫 BLOCKED: ${validation.blocked.length} files are protected from deletion`)
      validation.blocked.forEach(item => {
        console.log(`   - ${item.file}: ${item.protection.reasons.join(', ')}`)
      })
      return false
    }

    if (validation.needsConfirmation.length > 0) {
      this.log(`⚠️ WARNING: ${validation.needsConfirmation.length} files require confirmation`)
      validation.needsConfirmation.forEach(item => {
        console.log(`   - ${item.file}: ${item.protection.reasons.join(', ')}`)
      })
      
      // In automated cleanup, skip files that need confirmation
      this.log('ℹ️ Skipping files that require confirmation in automated cleanup')
      return false
    }

    // Proceed with deletion of allowed files
    for (const allowedFile of validation.allowed) {
      try {
        if (fs.existsSync(allowedFile.file)) {
          fs.unlinkSync(allowedFile.file)
          this.log(`🗑️ Deleted: ${allowedFile.file}`)
        }
      } catch (error) {
        this.log(`❌ Failed to delete ${allowedFile.file}: ${error.message}`)
      }
    }

    return true
  }

  async cleanTemporaryFiles() {
    this.log('🧹 Starting protected temporary file cleanup...')

    const tempPatterns = [
      'tmp/**/*.log',
      'tmp/**/*.tmp',
      'tmp/**/*.temp',
      'logs/**/*.log',
      '**/*.backup.*',
      '**/node_modules/.cache/**',
      '**/.next/cache/**',
      '**/dist/cache/**'
    ]

    const filesToCheck = []
    
    // Collect files matching temp patterns
    const glob = require('glob')
    for (const pattern of tempPatterns) {
      try {
        const matches = glob.sync(pattern, { 
          cwd: this.workspaceRoot,
          absolute: true,
          ignore: ['**/node_modules/**']
        })
        filesToCheck.push(...matches)
      } catch (error) {
        this.log(`⚠️ Pattern matching failed for ${pattern}: ${error.message}`)
      }
    }

    // Filter old files (older than 7 days for logs, 1 day for temp files)
    const now = Date.now()
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
    const oneDayAgo = now - (24 * 60 * 60 * 1000)

    const oldFilesToDelete = []
    
    for (const file of filesToCheck) {
      try {
        const stat = fs.statSync(file)
        const isLogFile = file.includes('.log')
        const cutoffTime = isLogFile ? sevenDaysAgo : oneDayAgo
        
        if (stat.mtime.getTime() < cutoffTime) {
          oldFilesToDelete.push(file)
        }
      } catch (error) {
        // File doesn't exist or can't be accessed, skip it
        continue
      }
    }

    this.log(`📊 Found ${oldFilesToDelete.length} old temporary files to clean`)

    if (oldFilesToDelete.length > 0) {
      await this.safeDeletion(oldFilesToDelete)
    }

    this.log('✅ Protected temporary file cleanup completed')
  }

  async cleanupNodeModulesCache() {
    this.log('🧹 Cleaning node_modules cache files...')

    const cachePatterns = [
      '**/node_modules/.cache/**',
      '**/node_modules/**/.nyc_output/**',
      '**/node_modules/**/coverage/**'
    ]

    const glob = require('glob')
    const cacheFiles = []

    for (const pattern of cachePatterns) {
      try {
        const matches = glob.sync(pattern, { 
          cwd: this.workspaceRoot,
          absolute: true 
        })
        cacheFiles.push(...matches)
      } catch (error) {
        this.log(`⚠️ Cache pattern matching failed for ${pattern}: ${error.message}`)
      }
    }

    if (cacheFiles.length > 0) {
      this.log(`📊 Found ${cacheFiles.length} cache files`)
      
      // Cache files don't need protection validation, safe to delete
      for (const cacheFile of cacheFiles) {
        try {
          if (fs.statSync(cacheFile).isDirectory()) {
            fs.rmSync(cacheFile, { recursive: true, force: true })
          } else {
            fs.unlinkSync(cacheFile)
          }
          this.log(`🗑️ Deleted cache: ${path.relative(this.workspaceRoot, cacheFile)}`)
        } catch (error) {
          this.log(`⚠️ Failed to delete cache ${cacheFile}: ${error.message}`)
        }
      }
    }

    this.log('✅ Node modules cache cleanup completed')
  }

  async performSafeCleanup() {
    this.log('🚀 Starting comprehensive protected cleanup...')

    try {
      // First scan for critical files to update protection manifest
      await this.protectionSystem.scanAndUpdate()
      
      // Clean temporary files with protection
      await this.cleanTemporaryFiles()
      
      // Clean node_modules cache (safe, not protected)
      await this.cleanupNodeModulesCache()

      this.log('🎉 Protected cleanup completed successfully')
      
    } catch (error) {
      this.log(`❌ Cleanup failed: ${error.message}`)
      throw error
    }
  }
}

// CLI Interface
if (require.main === module) {
  const cleanup = new ProtectedCleanup()
  
  const command = process.argv[2] || 'full'
  
  switch (command) {
    case 'temp':
      cleanup.cleanTemporaryFiles().catch(error => {
        console.error('❌ Temporary file cleanup failed:', error.message)
        process.exit(1)
      })
      break
      
    case 'cache':
      cleanup.cleanupNodeModulesCache().catch(error => {
        console.error('❌ Cache cleanup failed:', error.message)
        process.exit(1)
      })
      break
      
    case 'full':
    default:
      cleanup.performSafeCleanup().catch(error => {
        console.error('❌ Protected cleanup failed:', error.message)
        process.exit(1)
      })
      break
  }
}

module.exports = ProtectedCleanup