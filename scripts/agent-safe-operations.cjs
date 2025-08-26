#!/usr/bin/env node

/**
 * Agent Safe Operations
 * Provides protected operations for the multi-agent team system
 */

const fs = require('fs')
const path = require('path')
const FileProtectionSystem = require('./file-protection-system.cjs')

class AgentSafeOperations {
  constructor(agentId) {
    this.agentId = agentId || 'unknown-agent'
    this.protectionSystem = new FileProtectionSystem()
    this.workspaceRoot = process.cwd()
    this.logPath = path.join(this.workspaceRoot, 'tmp/teams/agent-operations.log')
    
    this.ensureLogDirectory()
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logPath)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] [${this.agentId}] [${level}] ${message}`
    
    console.log(logEntry)
    
    try {
      fs.appendFileSync(this.logPath, logEntry + '\n')
    } catch (error) {
      console.warn(`⚠️ Failed to write to agent log: ${error.message}`)
    }
  }

  /**
   * Agent-safe file deletion with protection checks
   * @param {string|string[]} files - Files to delete
   * @param {string} reason - Reason for deletion
   * @returns {Promise<boolean>} Success status
   */
  async safeDelete(files, reason = 'Agent cleanup operation') {
    const fileArray = Array.isArray(files) ? files : [files]
    
    this.log(`🛡️ Agent requesting deletion of ${fileArray.length} files: ${reason}`)
    
    const validation = this.protectionSystem.validateDeletion(fileArray)
    
    if (validation.blocked.length > 0) {
      this.log(`🚫 BLOCKED: Cannot delete ${validation.blocked.length} protected files`, 'ERROR')
      validation.blocked.forEach(item => {
        this.log(`   - BLOCKED: ${item.file} (${item.protection.category})`, 'ERROR')
      })
      return false
    }

    if (validation.needsConfirmation.length > 0) {
      this.log(`⚠️ CAUTION: ${validation.needsConfirmation.length} files require human confirmation`, 'WARN')
      validation.needsConfirmation.forEach(item => {
        this.log(`   - NEEDS CONFIRMATION: ${item.file} (${item.protection.category})`, 'WARN')
      })
      
      // Agents cannot provide confirmation, must abort
      this.log('❌ Agent cannot proceed with files requiring human confirmation', 'ERROR')
      return false
    }

    // Proceed with allowed deletions
    let deletedCount = 0
    for (const allowedFile of validation.allowed) {
      try {
        if (fs.existsSync(allowedFile.file)) {
          // Create backup if file is protected but allowed to delete
          if (allowedFile.protection) {
            this.protectionSystem.createBackup(allowedFile.file)
          }
          
          fs.unlinkSync(allowedFile.file)
          this.log(`🗑️ Deleted: ${allowedFile.file}`)
          deletedCount++
        }
      } catch (error) {
        this.log(`❌ Failed to delete ${allowedFile.file}: ${error.message}`, 'ERROR')
      }
    }

    this.log(`✅ Agent deletion completed: ${deletedCount}/${fileArray.length} files deleted`)
    return deletedCount === validation.allowed.length
  }

  /**
   * Agent-safe file modification with backup
   * @param {string} filePath - File to modify
   * @param {string} content - New content
   * @param {string} reason - Reason for modification
   * @returns {Promise<boolean>} Success status
   */
  async safeModify(filePath, content, reason = 'Agent file modification') {
    this.log(`📝 Agent requesting modification of: ${filePath} - ${reason}`)
    
    const absolutePath = path.resolve(filePath)
    const protection = this.protectionSystem.isProtected(absolutePath)
    
    if (protection.isProtected) {
      this.log(`🛡️ File is protected (${protection.category}): ${protection.reasons.join(', ')}`)
      
      // Create backup before modification
      const backupPath = this.protectionSystem.createBackup(absolutePath)
      if (backupPath) {
        this.log(`💾 Backup created: ${backupPath}`)
      }
    }

    try {
      fs.writeFileSync(absolutePath, content)
      this.log(`✅ File modified successfully: ${filePath}`)
      return true
    } catch (error) {
      this.log(`❌ Failed to modify file: ${error.message}`, 'ERROR')
      return false
    }
  }

  /**
   * Agent workspace cleanup with protection
   * @param {string} workspaceDir - Agent workspace directory
   * @returns {Promise<boolean>} Success status
   */
  async cleanupWorkspace(workspaceDir) {
    this.log(`🧹 Agent cleaning workspace: ${workspaceDir}`)
    
    if (!fs.existsSync(workspaceDir)) {
      this.log(`ℹ️ Workspace doesn't exist: ${workspaceDir}`)
      return true
    }

    try {
      // Get all files in workspace
      const getAllFiles = (dir) => {
        const files = []
        const items = fs.readdirSync(dir, { withFileTypes: true })
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name)
          if (item.isDirectory()) {
            files.push(...getAllFiles(fullPath))
          } else {
            files.push(fullPath)
          }
        }
        return files
      }

      const workspaceFiles = getAllFiles(workspaceDir)
      
      if (workspaceFiles.length === 0) {
        this.log(`ℹ️ Workspace is empty: ${workspaceDir}`)
        return true
      }

      this.log(`📊 Found ${workspaceFiles.length} files in workspace`)
      
      // Use safe deletion with protection checks
      const result = await this.safeDelete(workspaceFiles, 'Agent workspace cleanup')
      
      // Remove empty directories
      try {
        const removeEmptyDirs = (dir) => {
          if (fs.existsSync(dir)) {
            const items = fs.readdirSync(dir)
            if (items.length === 0) {
              fs.rmdirSync(dir)
              this.log(`📁 Removed empty directory: ${dir}`)
            } else {
              // Try to remove subdirectories first
              items.forEach(item => {
                const itemPath = path.join(dir, item)
                if (fs.statSync(itemPath).isDirectory()) {
                  removeEmptyDirs(itemPath)
                }
              })
              
              // Check again if directory is now empty
              if (fs.readdirSync(dir).length === 0) {
                fs.rmdirSync(dir)
                this.log(`📁 Removed empty directory: ${dir}`)
              }
            }
          }
        }

        removeEmptyDirs(workspaceDir)
      } catch (error) {
        this.log(`⚠️ Failed to remove empty directories: ${error.message}`, 'WARN')
      }

      return result
      
    } catch (error) {
      this.log(`❌ Workspace cleanup failed: ${error.message}`, 'ERROR')
      return false
    }
  }

  /**
   * Validate agent operation before execution
   * @param {string} operation - Operation name
   * @param {Object} params - Operation parameters
   * @returns {Object} Validation result
   */
  validateOperation(operation, params) {
    this.log(`🔍 Validating agent operation: ${operation}`)
    
    const validation = {
      allowed: false,
      warnings: [],
      blockers: [],
      recommendations: []
    }

    switch (operation) {
      case 'delete':
        if (params.files) {
          const protectionCheck = this.protectionSystem.validateDeletion(params.files)
          
          if (protectionCheck.blocked.length > 0) {
            validation.blockers.push(`${protectionCheck.blocked.length} files are protected from deletion`)
            protectionCheck.blocked.forEach(item => {
              validation.blockers.push(`- ${item.file}: ${item.reason}`)
            })
          }

          if (protectionCheck.needsConfirmation.length > 0) {
            validation.warnings.push(`${protectionCheck.needsConfirmation.length} files require human confirmation`)
          }

          validation.allowed = protectionCheck.blocked.length === 0 && protectionCheck.needsConfirmation.length === 0
        }
        break

      case 'modify':
        if (params.file) {
          const protection = this.protectionSystem.isProtected(params.file)
          if (protection.isProtected) {
            validation.warnings.push(`File is protected: ${protection.reasons.join(', ')}`)
            validation.recommendations.push('Backup will be created automatically')
          }
          validation.allowed = true // Modifications are generally allowed with backup
        }
        break

      case 'cleanup':
        validation.allowed = true
        validation.recommendations.push('Workspace cleanup will use protected deletion')
        break

      default:
        validation.blockers.push(`Unknown operation: ${operation}`)
        validation.allowed = false
    }

    return validation
  }

  /**
   * Generate agent operation report
   * @returns {Object} Operation report
   */
  generateOperationReport() {
    const logContent = fs.existsSync(this.logPath) ? fs.readFileSync(this.logPath, 'utf8') : ''
    const logLines = logContent.split('\n').filter(line => line.trim())
    
    const report = {
      agent_id: this.agentId,
      timestamp: new Date().toISOString(),
      total_operations: 0,
      successful_operations: 0,
      failed_operations: 0,
      protected_files_encountered: 0,
      backups_created: 0,
      deletions_blocked: 0,
      recent_operations: []
    }

    // Parse log entries
    logLines.forEach(line => {
      if (line.includes('[INFO]') || line.includes('[WARN]') || line.includes('[ERROR]')) {
        const timestamp = line.match(/\[([\d-T:.Z]+)\]/)?.[1]
        const level = line.match(/\[(INFO|WARN|ERROR)\]/)?.[1]
        const message = line.split('] ').slice(3).join('] ')

        if (message.includes('Agent requesting')) {
          report.total_operations++
        }
        if (message.includes('completed successfully')) {
          report.successful_operations++
        }
        if (message.includes('failed') || level === 'ERROR') {
          report.failed_operations++
        }
        if (message.includes('protected') || message.includes('BLOCKED')) {
          report.protected_files_encountered++
        }
        if (message.includes('Backup created')) {
          report.backups_created++
        }
        if (message.includes('BLOCKED')) {
          report.deletions_blocked++
        }

        if (report.recent_operations.length < 10) {
          report.recent_operations.push({
            timestamp,
            level,
            message
          })
        }
      }
    })

    return report
  }
}

// CLI Interface
if (require.main === module) {
  const agentId = process.env.AGENT_ID || process.argv[2] || 'cli-agent'
  const operations = new AgentSafeOperations(agentId)
  
  const command = process.argv[3]
  const args = process.argv.slice(4)

  switch (command) {
    case 'delete':
      if (args.length === 0) {
        console.error('Usage: agent-safe-operations.js <agent-id> delete <file> [file...]')
        process.exit(1)
      }
      
      const reason = process.env.DELETE_REASON || 'CLI deletion request'
      operations.safeDelete(args, reason).then(success => {
        process.exit(success ? 0 : 1)
      }).catch(error => {
        console.error('❌ Safe deletion failed:', error.message)
        process.exit(1)
      })
      break

    case 'cleanup':
      if (args.length === 0) {
        console.error('Usage: agent-safe-operations.js <agent-id> cleanup <workspace-dir>')
        process.exit(1)
      }
      
      operations.cleanupWorkspace(args[0]).then(success => {
        process.exit(success ? 0 : 1)
      }).catch(error => {
        console.error('❌ Workspace cleanup failed:', error.message)
        process.exit(1)
      })
      break

    case 'validate':
      if (args.length < 2) {
        console.error('Usage: agent-safe-operations.js <agent-id> validate <operation> <params...>')
        process.exit(1)
      }
      
      const operation = args[0]
      const params = { files: args.slice(1) }
      
      const validation = operations.validateOperation(operation, params)
      
      console.log(`\n🔍 Validation Result for ${operation}:`)
      console.log(`✅ Allowed: ${validation.allowed}`)
      
      if (validation.warnings.length > 0) {
        console.log(`\n⚠️ Warnings:`)
        validation.warnings.forEach(warning => console.log(`  - ${warning}`))
      }
      
      if (validation.blockers.length > 0) {
        console.log(`\n🚫 Blockers:`)
        validation.blockers.forEach(blocker => console.log(`  - ${blocker}`))
      }
      
      if (validation.recommendations.length > 0) {
        console.log(`\n💡 Recommendations:`)
        validation.recommendations.forEach(rec => console.log(`  - ${rec}`))
      }

      process.exit(validation.allowed ? 0 : 1)
      break

    case 'report':
      const report = operations.generateOperationReport()
      console.log('\n📊 Agent Operations Report')
      console.log('=' * 50)
      console.log(`Agent ID: ${report.agent_id}`)
      console.log(`Timestamp: ${report.timestamp}`)
      console.log(`Total Operations: ${report.total_operations}`)
      console.log(`Successful: ${report.successful_operations}`)
      console.log(`Failed: ${report.failed_operations}`)
      console.log(`Protected Files Encountered: ${report.protected_files_encountered}`)
      console.log(`Backups Created: ${report.backups_created}`)
      console.log(`Deletions Blocked: ${report.deletions_blocked}`)
      break

    default:
      console.log('Agent Safe Operations for @akaoio/core')
      console.log('Usage: agent-safe-operations.js <agent-id> <command> [args...]')
      console.log('')
      console.log('Commands:')
      console.log('  delete <files...>         Safely delete files with protection checks')
      console.log('  cleanup <workspace-dir>   Cleanup agent workspace safely')
      console.log('  validate <op> <params>    Validate operation before execution')
      console.log('  report                    Generate agent operations report')
      break
  }
}

module.exports = AgentSafeOperations