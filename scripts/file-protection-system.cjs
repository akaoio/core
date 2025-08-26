#!/usr/bin/env node

/**
 * File Protection System for @akaoio/core
 * Prevents accidental deletion of critical infrastructure files
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

class FileProtectionSystem {
  constructor() {
    this.manifestPath = path.join(__dirname, 'file-protection-manifest.json')
    this.manifest = this.loadManifest()
    this.logPath = path.join(__dirname, '../tmp/file-protection.log')
    
    // Ensure log directory exists
    const logDir = path.dirname(this.logPath)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
  }

  loadManifest() {
    try {
      const content = fs.readFileSync(this.manifestPath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      console.error('❌ Failed to load file protection manifest:', error.message)
      process.exit(1)
    }
  }

  log(message) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}\n`
    
    console.log(message)
    
    try {
      fs.appendFileSync(this.logPath, logEntry)
    } catch (error) {
      console.warn('⚠️ Failed to write to protection log:', error.message)
    }
  }

  /**
   * Check if a file is protected
   * @param {string} filePath - Absolute path to file
   * @returns {Object} Protection status and rules
   */
  isProtected(filePath) {
    const relativePath = path.relative(process.cwd(), filePath)
    const protection = {
      isProtected: false,
      category: null,
      rules: [],
      reasons: []
    }

    // Check against patterns in each category
    for (const [categoryName, category] of Object.entries(this.manifest.critical_infrastructure_files.categories)) {
      for (const pattern of category.patterns) {
        if (this.matchesPattern(relativePath, pattern) || this.matchesPattern(filePath, pattern)) {
          protection.isProtected = true
          protection.category = categoryName
          protection.reasons.push(`Matches pattern: ${pattern}`)
          break
        }
      }

      // Check direct file matches
      if (category.files && category.files.includes(filePath)) {
        protection.isProtected = true
        protection.category = categoryName
        protection.reasons.push('Direct file match')
      }
    }

    // Check protection rules
    const rules = this.manifest.critical_infrastructure_files.protection_rules
    for (const [ruleName, rule] of Object.entries(rules)) {
      for (const pattern of rule.patterns) {
        if (this.matchesPattern(relativePath, pattern) || this.matchesPattern(filePath, pattern)) {
          protection.rules.push(ruleName)
        }
      }
    }

    return protection
  }

  matchesPattern(filePath, pattern) {
    const glob = require('glob')
    try {
      // Use glob's minimatch for accurate pattern matching
      const minimatch = require('minimatch')
      return minimatch(filePath, pattern) || minimatch(path.basename(filePath), pattern)
    } catch (error) {
      // Fallback to simple string matching
      if (pattern.includes('**')) {
        // Handle recursive patterns
        const regexPattern = pattern
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*')
          .replace(/\./g, '\\.')
        
        const regex = new RegExp(regexPattern)
        return regex.test(filePath)
      } else {
        // Simple glob matching
        return filePath.includes(pattern.replace(/\*/g, ''))
      }
    }
  }

  /**
   * Validate deletion request
   * @param {string|string[]} files - File path(s) to delete
   * @returns {Object} Validation result
   */
  validateDeletion(files) {
    const fileArray = Array.isArray(files) ? files : [files]
    const results = {
      allowed: [],
      blocked: [],
      needsConfirmation: [],
      summary: {
        totalFiles: fileArray.length,
        blockedCount: 0,
        allowedCount: 0,
        confirmationCount: 0
      }
    }

    for (const filePath of fileArray) {
      const absolutePath = path.resolve(filePath)
      const protection = this.isProtected(absolutePath)

      if (protection.isProtected && protection.rules.includes('never_delete')) {
        results.blocked.push({
          file: filePath,
          protection,
          reason: 'File is marked as never delete'
        })
        results.summary.blockedCount++
        
        this.log(`🚫 BLOCKED DELETION: ${filePath} - ${protection.reasons.join(', ')}`)
        
      } else if (protection.isProtected && protection.rules.includes('confirm_before_delete')) {
        results.needsConfirmation.push({
          file: filePath,
          protection,
          reason: 'File requires confirmation before deletion'
        })
        results.summary.confirmationCount++
        
        this.log(`⚠️ CONFIRMATION REQUIRED: ${filePath} - ${protection.reasons.join(', ')}`)
        
      } else {
        results.allowed.push({
          file: filePath,
          protection: protection.isProtected ? protection : null
        })
        results.summary.allowedCount++
        
        if (protection.isProtected) {
          this.log(`✅ DELETION ALLOWED: ${filePath} - Protected but not restricted`)
        }
      }
    }

    return results
  }

  /**
   * Create backup before modification
   * @param {string} filePath - Path to file to backup
   * @returns {string|null} Backup file path or null if failed
   */
  createBackup(filePath) {
    const protection = this.isProtected(filePath)
    
    if (protection.isProtected && protection.rules.includes('backup_before_modify')) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupPath = `${filePath}.backup.${timestamp}`
        
        fs.copyFileSync(filePath, backupPath)
        
        this.log(`💾 BACKUP CREATED: ${filePath} → ${backupPath}`)
        return backupPath
        
      } catch (error) {
        this.log(`❌ BACKUP FAILED: ${filePath} - ${error.message}`)
        return null
      }
    }
    
    return null
  }

  /**
   * Scan workspace for critical files and update manifest
   */
  async scanAndUpdate() {
    this.log('🔍 Scanning workspace for critical files...')
    
    const workspaceRoot = process.cwd()
    const discoveredFiles = {
      battle_tests: [],
      config_files: [],
      package_files: []
    }

    // Scan for battle test files
    const battleFiles = glob.sync('**/*.battle.*', { 
      cwd: workspaceRoot,
      ignore: ['node_modules/**', 'tmp/**', 'logs/**']
    })
    
    discoveredFiles.battle_tests = battleFiles.map(f => path.resolve(workspaceRoot, f))

    // Scan for config files
    const configFiles = glob.sync('**/*config.*', {
      cwd: workspaceRoot,
      ignore: ['node_modules/**', 'tmp/**', 'logs/**']
    })
    
    discoveredFiles.config_files = configFiles.map(f => path.resolve(workspaceRoot, f))

    // Scan for package files
    const packageFiles = glob.sync('**/package.json', {
      cwd: workspaceRoot,
      ignore: ['node_modules/**', 'tmp/**']
    })
    
    discoveredFiles.package_files = packageFiles.map(f => path.resolve(workspaceRoot, f))

    this.log(`📊 Discovered ${discoveredFiles.battle_tests.length} battle test files`)
    this.log(`📊 Discovered ${discoveredFiles.config_files.length} config files`)
    this.log(`📊 Discovered ${discoveredFiles.package_files.length} package files`)

    return discoveredFiles
  }

  /**
   * Generate protection report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      manifest_version: this.manifest.critical_infrastructure_files.version,
      protected_files_count: 0,
      categories: {}
    }

    // Count protected files by category
    for (const [categoryName, category] of Object.entries(this.manifest.critical_infrastructure_files.categories)) {
      const fileCount = category.files ? category.files.length : 0
      const patternCount = category.patterns ? category.patterns.length : 0
      
      report.categories[categoryName] = {
        description: category.description,
        file_count: fileCount,
        pattern_count: patternCount,
        files: category.files || []
      }
      
      report.protected_files_count += fileCount
    }

    return report
  }

  /**
   * Install protection hooks for common operations
   */
  installHooks() {
    this.log('🔧 Installing file protection hooks...')
    
    // Create wrapper scripts for dangerous operations
    const hookScripts = {
      'rm-safe': this.createRmSafeScript(),
      'cleanup-safe': this.createCleanupSafeScript()
    }

    const hooksDir = path.join(__dirname, '../scripts/hooks')
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true })
    }

    for (const [scriptName, scriptContent] of Object.entries(hookScripts)) {
      const scriptPath = path.join(hooksDir, scriptName)
      fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 })
      this.log(`📝 Created hook script: ${scriptPath}`)
    }

    this.log('✅ File protection hooks installed')
  }

  createRmSafeScript() {
    return `#!/bin/bash

# Safe rm wrapper with file protection
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROTECTION_SCRIPT="\$SCRIPT_DIR/../file-protection-system.js"

echo "🛡️ Checking file protection before deletion..."

# Validate files with protection system
node "\$PROTECTION_SCRIPT" validate-deletion "\$@"
VALIDATION_RESULT=\$?

if [ \$VALIDATION_RESULT -eq 0 ]; then
  echo "✅ Proceeding with deletion..."
  /bin/rm "\$@"
else
  echo "❌ Deletion blocked by file protection system"
  exit 1
fi
`
  }

  createCleanupSafeScript() {
    return `#!/bin/bash

# Safe cleanup with file protection
echo "🛡️ Running protected cleanup..."

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROTECTION_SCRIPT="\$SCRIPT_DIR/../file-protection-system.js"

# Always run protection scan before cleanup
node "\$PROTECTION_SCRIPT" scan

# Common safe cleanup operations
find tmp/ -name "*.log" -mtime +7 -type f -delete 2>/dev/null || true
find logs/ -name "*.log" -mtime +30 -type f -delete 2>/dev/null || true

echo "✅ Protected cleanup completed"
`
  }
}

// CLI Interface
if (require.main === module) {
  const protectionSystem = new FileProtectionSystem()
  const command = process.argv[2]
  const args = process.argv.slice(3)

  switch (command) {
    case 'check':
      if (args.length === 0) {
        console.error('Usage: file-protection-system.js check <file-path>')
        process.exit(1)
      }
      
      for (const filePath of args) {
        const protection = protectionSystem.isProtected(path.resolve(filePath))
        console.log(`\n📁 File: ${filePath}`)
        console.log(`🛡️ Protected: ${protection.isProtected ? '✅' : '❌'}`)
        if (protection.isProtected) {
          console.log(`📂 Category: ${protection.category}`)
          console.log(`🔒 Rules: ${protection.rules.join(', ') || 'None'}`)
          console.log(`📋 Reasons: ${protection.reasons.join(', ')}`)
        }
      }
      break

    case 'validate-deletion':
      if (args.length === 0) {
        console.error('Usage: file-protection-system.js validate-deletion <file-path> [file-path...]')
        process.exit(1)
      }
      
      const validation = protectionSystem.validateDeletion(args)
      
      console.log(`\n📊 Deletion Validation Results:`)
      console.log(`   Total files: ${validation.summary.totalFiles}`)
      console.log(`   ✅ Allowed: ${validation.summary.allowedCount}`)
      console.log(`   ⚠️ Need confirmation: ${validation.summary.confirmationCount}`)
      console.log(`   🚫 Blocked: ${validation.summary.blockedCount}`)

      if (validation.blocked.length > 0) {
        console.log(`\n🚫 BLOCKED FILES:`)
        validation.blocked.forEach(item => {
          console.log(`   - ${item.file}: ${item.reason}`)
        })
        process.exit(1)
      }

      if (validation.needsConfirmation.length > 0) {
        console.log(`\n⚠️ CONFIRMATION REQUIRED:`)
        validation.needsConfirmation.forEach(item => {
          console.log(`   - ${item.file}: ${item.reason}`)
        })
        process.exit(2)
      }

      console.log('\n✅ All deletions validated')
      break

    case 'backup':
      if (args.length === 0) {
        console.error('Usage: file-protection-system.js backup <file-path>')
        process.exit(1)
      }
      
      for (const filePath of args) {
        const backupPath = protectionSystem.createBackup(path.resolve(filePath))
        if (backupPath) {
          console.log(`💾 Backup created: ${backupPath}`)
        } else {
          console.log(`ℹ️ No backup needed for: ${filePath}`)
        }
      }
      break

    case 'scan':
      protectionSystem.scanAndUpdate().then(discovered => {
        console.log('\n🔍 Workspace scan completed')
        console.log(`📊 Battle tests: ${discovered.battle_tests.length}`)
        console.log(`📊 Config files: ${discovered.config_files.length}`)
        console.log(`📊 Package files: ${discovered.package_files.length}`)
      }).catch(error => {
        console.error('❌ Scan failed:', error.message)
        process.exit(1)
      })
      break

    case 'report':
      const report = protectionSystem.generateReport()
      console.log('\n📋 File Protection Report')
      console.log('=' * 50)
      console.log(`Timestamp: ${report.timestamp}`)
      console.log(`Manifest Version: ${report.manifest_version}`)
      console.log(`Protected Files: ${report.protected_files_count}`)
      console.log('\nCategories:')
      
      for (const [category, info] of Object.entries(report.categories)) {
        console.log(`  ${category}: ${info.file_count} files, ${info.pattern_count} patterns`)
      }
      break

    case 'install-hooks':
      protectionSystem.installHooks()
      break

    default:
      console.log('File Protection System for @akaoio/core')
      console.log('Usage: file-protection-system.js <command> [args...]')
      console.log('')
      console.log('Commands:')
      console.log('  check <file>              Check if file is protected')
      console.log('  validate-deletion <files> Validate deletion request')
      console.log('  backup <file>             Create backup if required')
      console.log('  scan                      Scan workspace for critical files')
      console.log('  report                    Generate protection report')
      console.log('  install-hooks            Install protection hook scripts')
      break
  }
}

module.exports = FileProtectionSystem