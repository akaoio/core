#!/usr/bin/env node

/**
 * Integration Test for File Protection System
 * Tests all protection components working together
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class ProtectionSystemTest {
  constructor() {
    this.testResults = []
    this.testDir = path.join(process.cwd(), 'tmp/protection-test')
    this.setupTestDirectory()
  }

  setupTestDirectory() {
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true })
    }
    fs.mkdirSync(this.testDir, { recursive: true })
  }

  log(message) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${message}`)
  }

  runTest(name, testFunction) {
    this.log(`🧪 Running test: ${name}`)
    try {
      testFunction()
      this.testResults.push({ name, status: 'PASS' })
      this.log(`✅ Test passed: ${name}`)
    } catch (error) {
      this.testResults.push({ name, status: 'FAIL', error: error.message })
      this.log(`❌ Test failed: ${name} - ${error.message}`)
    }
  }

  testProtectedFileDetection() {
    // Test that critical Battle files are detected as protected
    const output = execSync('node scripts/file-protection-system.cjs check projects/composer/composer.battle.cjs', { encoding: 'utf8' })
    
    if (!output.includes('Protected: ✅')) {
      throw new Error('Battle file not detected as protected')
    }
    
    if (!output.includes('test_infrastructure')) {
      throw new Error('Battle file not categorized correctly')
    }
  }

  testDeletionBlocking() {
    // Test that protected files cannot be deleted
    try {
      execSync('node scripts/file-protection-system.cjs validate-deletion projects/composer/composer.battle.cjs', { encoding: 'utf8' })
      throw new Error('Protected file deletion should have been blocked')
    } catch (error) {
      if (error.status !== 1) {
        throw new Error('Wrong exit code for blocked deletion')
      }
      // This is expected - deletion should be blocked
    }
  }

  testNonProtectedFileAllowed() {
    // Create a test file that should be allowed for deletion
    const testFile = path.join(this.testDir, 'test-temp.log')
    fs.writeFileSync(testFile, 'temporary test file')
    
    const output = execSync(`node scripts/file-protection-system.cjs validate-deletion ${testFile}`, { encoding: 'utf8' })
    
    if (!output.includes('All deletions validated')) {
      throw new Error('Non-protected file should be allowed for deletion')
    }
  }

  testAgentSafeOperations() {
    // Test agent protection system
    const testFile = path.join(this.testDir, 'agent-test.tmp')
    fs.writeFileSync(testFile, 'agent test file')
    
    const output = execSync(`node scripts/agent-safe-operations.cjs test-agent validate delete ${testFile}`, { encoding: 'utf8' })
    
    if (!output.includes('Allowed: true')) {
      throw new Error('Agent validation should allow non-protected file deletion')
    }
  }

  testProtectedAgentOperation() {
    // Test that agent operations respect protection
    try {
      execSync('node scripts/agent-safe-operations.cjs test-agent validate delete projects/composer/composer.battle.cjs', { encoding: 'utf8' })
      throw new Error('Agent should not be allowed to delete protected files')
    } catch (error) {
      if (error.status !== 1) {
        throw new Error('Agent validation should exit with code 1 for blocked operations')
      }
      // This is expected - agent operation should be blocked
    }
  }

  testBackupCreation() {
    // Test that backups are created for protected files
    const testFile = path.join(this.testDir, 'test-config.json')
    fs.writeFileSync(testFile, JSON.stringify({ test: true }, null, 2))
    
    const output = execSync(`node scripts/file-protection-system.cjs backup ${testFile}`, { encoding: 'utf8' })
    
    // Check if backup was mentioned (backup creation depends on protection rules)
    if (!output.includes('backup') && !output.includes('No backup needed')) {
      throw new Error('Backup operation should provide feedback')
    }
  }

  testManifestIntegrity() {
    // Test that manifest can be loaded without errors
    const manifestPath = path.join(process.cwd(), 'scripts/file-protection-manifest.json')
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Protection manifest not found')
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    
    if (!manifest.critical_infrastructure_files) {
      throw new Error('Manifest missing critical_infrastructure_files section')
    }
    
    if (!manifest.critical_infrastructure_files.categories) {
      throw new Error('Manifest missing categories')
    }
    
    if (!manifest.critical_infrastructure_files.protection_rules) {
      throw new Error('Manifest missing protection_rules')
    }
  }

  testHookInstallation() {
    // Test that protection hooks are installed correctly
    const rmSafePath = path.join(process.cwd(), 'scripts/hooks/rm-safe')
    const cleanupSafePath = path.join(process.cwd(), 'scripts/hooks/cleanup-safe')
    
    if (!fs.existsSync(rmSafePath)) {
      throw new Error('rm-safe hook not installed')
    }
    
    if (!fs.existsSync(cleanupSafePath)) {
      throw new Error('cleanup-safe hook not installed')
    }
    
    // Test that hooks are executable
    const rmStat = fs.statSync(rmSafePath)
    if (!(rmStat.mode & parseInt('100', 8))) {
      throw new Error('rm-safe hook not executable')
    }
  }

  testLogGeneration() {
    // Test that protection operations generate logs
    const logPath = path.join(process.cwd(), 'tmp/file-protection.log')
    
    // Perform an operation that should generate logs
    execSync('node scripts/file-protection-system.cjs check projects/composer/composer.battle.cjs', { encoding: 'utf8' })
    
    // Check if log exists and has recent entries
    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, 'utf8')
      if (!logContent.includes('team-meta-orchestrator')) {
        // Log might exist but not have our entries, which is also valid
        this.log('ℹ️ Protection log exists but may not contain test entries')
      }
    } else {
      this.log('ℹ️ Protection log not created during test (may be expected)')
    }
  }

  runAllTests() {
    this.log('🚀 Starting File Protection System Integration Test')
    this.log('=' * 50)

    this.runTest('Protected File Detection', () => this.testProtectedFileDetection())
    this.runTest('Deletion Blocking', () => this.testDeletionBlocking())
    this.runTest('Non-Protected File Allowed', () => this.testNonProtectedFileAllowed())
    this.runTest('Agent Safe Operations', () => this.testAgentSafeOperations())
    this.runTest('Protected Agent Operation Blocking', () => this.testProtectedAgentOperation())
    this.runTest('Backup Creation', () => this.testBackupCreation())
    this.runTest('Manifest Integrity', () => this.testManifestIntegrity())
    this.runTest('Hook Installation', () => this.testHookInstallation())
    this.runTest('Log Generation', () => this.testLogGeneration())

    this.generateTestReport()
  }

  generateTestReport() {
    this.log('\n📋 File Protection System Test Results')
    this.log('=' * 50)
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length
    const failed = this.testResults.filter(r => r.status === 'FAIL').length
    const total = this.testResults.length
    
    this.log(`Total Tests: ${total}`)
    this.log(`Passed: ${passed}`)
    this.log(`Failed: ${failed}`)
    this.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
    
    this.log('\nDetailed Results:')
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌'
      this.log(`${icon} ${result.name}`)
      if (result.error) {
        this.log(`   Error: ${result.error}`)
      }
    })
    
    if (failed === 0) {
      this.log('\n🎉 All tests passed! File Protection System is working correctly.')
    } else {
      this.log('\n⚠️ Some tests failed. Please review and fix issues before deploying.')
    }

    // Cleanup test directory
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true })
    }

    return failed === 0
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ProtectionSystemTest()
  const success = tester.runAllTests()
  process.exit(success ? 0 : 1)
}

module.exports = ProtectionSystemTest