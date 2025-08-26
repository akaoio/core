#!/usr/bin/env node

/**
 * Integration Battle Test for @akaoio/core Workspace
 * Tests the entire workspace orchestration with Battle framework
 */

const { Battle } = require('./projects/battle/dist/index.cjs')
const path = require('path')
const fs = require('fs')

async function testWorkspaceSetup() {
  const battle = new Battle({
    name: 'workspace-setup-test',
    timeout: 120000, // 2 minutes for setup
    logLevel: 'info'
  })

  return await battle.run(async (b) => {
    console.log('🚀 Testing workspace setup...')
    
    b.spawn('npm', ['run', 'setup'], {
      cwd: process.cwd(),
      env: { ...process.env, CI: 'true' }
    })
    
    // Wait for setup to complete
    await b.expect('Setup completed successfully', 120000)
    
    // Verify projects directory
    if (!fs.existsSync('projects')) {
      throw new Error('Projects directory not created')
    }
    
    console.log('✅ Workspace setup test passed')
  })
}

async function testWorkspaceBuild() {
  const battle = new Battle({
    name: 'workspace-build-test',
    timeout: 180000, // 3 minutes for build
    logLevel: 'info'
  })

  return await battle.run(async (b) => {
    console.log('🔨 Testing workspace build...')
    
    b.spawn('npm', ['run', 'build'], {
      cwd: process.cwd(),
      env: { ...process.env, CI: 'true' }
    })
    
    // Wait for build to complete
    await b.expect('Build completed', 180000)
    
    // Verify dist directories exist
    const projects = ['battle', 'builder', 'composer', 'air']
    for (const project of projects) {
      const distPath = path.join('projects', project, 'dist')
      if (fs.existsSync(path.join('projects', project)) && !fs.existsSync(distPath)) {
        throw new Error(`Build artifacts missing for ${project}`)
      }
    }
    
    console.log('✅ Workspace build test passed')
  })
}

async function testBattleSelfTest() {
  const battle = new Battle({
    name: 'battle-self-test',
    timeout: 60000, // 1 minute
    logLevel: 'info'
  })

  return await battle.run(async (b) => {
    console.log('⚔️ Testing Battle self-test...')
    
    b.spawn('npm', ['test'], {
      cwd: path.join(process.cwd(), 'projects', 'battle'),
      env: { ...process.env, CI: 'true' }
    })
    
    // Battle should run its own tests
    await b.expect('Test passed', 60000)
    
    console.log('✅ Battle self-test passed')
  })
}

async function testWorkspaceStatus() {
  const battle = new Battle({
    name: 'workspace-status-test',
    timeout: 30000, // 30 seconds
    logLevel: 'info'
  })

  return await battle.run(async (b) => {
    console.log('📊 Testing workspace status...')
    
    b.spawn('npm', ['run', 'status'], {
      cwd: process.cwd(),
      env: { ...process.env, CI: 'true' }
    })
    
    // Should show status of all repositories
    await b.expect('Status check complete', 30000)
    
    console.log('✅ Workspace status test passed')
  })
}

async function testCrossProjectDependencies() {
  const battle = new Battle({
    name: 'cross-project-deps-test',
    timeout: 60000, // 1 minute
    logLevel: 'info'
  })

  return await battle.run(async (b) => {
    console.log('🔗 Testing cross-project dependencies...')
    
    // Test that composer can use battle
    if (fs.existsSync('projects/composer')) {
      b.spawn('npm', ['run', 'build'], {
        cwd: path.join(process.cwd(), 'projects', 'composer'),
        env: { ...process.env, CI: 'true' }
      })
      
      await b.expect('Build complete', 60000)
    }
    
    console.log('✅ Cross-project dependencies test passed')
  })
}

async function runAllTests() {
  console.log('🎯 Starting @akaoio/core workspace integration tests\n')
  
  const tests = [
    { name: 'Workspace Setup', fn: testWorkspaceSetup },
    { name: 'Workspace Build', fn: testWorkspaceBuild },
    { name: 'Battle Self-Test', fn: testBattleSelfTest },
    { name: 'Workspace Status', fn: testWorkspaceStatus },
    { name: 'Cross-Project Dependencies', fn: testCrossProjectDependencies }
  ]
  
  const results = []
  
  for (const test of tests) {
    try {
      console.log(`\n▶️ Running ${test.name}...`)
      const result = await test.fn()
      results.push({ name: test.name, status: 'passed', result })
      console.log(`✅ ${test.name} PASSED`)
    } catch (error) {
      results.push({ name: test.name, status: 'failed', error: error.message })
      console.error(`❌ ${test.name} FAILED:`, error.message)
    }
  }
  
  // Summary
  console.log('\n📋 Test Summary:')
  console.log('================')
  
  const passed = results.filter(r => r.status === 'passed').length
  const failed = results.filter(r => r.status === 'failed').length
  
  results.forEach(result => {
    const icon = result.status === 'passed' ? '✅' : '❌'
    console.log(`${icon} ${result.name}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
  
  if (failed > 0) {
    console.log('\n💡 Check the Battle replay files for detailed failure analysis')
    process.exit(1)
  } else {
    console.log('\n🎉 All integration tests passed!')
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Integration test runner failed:', error)
    process.exit(1)
  })
}

module.exports = { runAllTests }