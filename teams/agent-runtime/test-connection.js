/**
 * Simple test to verify Air/GUN connectivity for the agent runtime system
 */

console.log('🔗 Testing Air/GUN connection for Agent Runtime System...')

// Test basic HTTP connectivity first
const testHttp = async () => {
  try {
    const response = await fetch('http://localhost:8765')
    console.log(`✅ Air HTTP server accessible: ${response.status}`)
    return true
  } catch (error) {
    console.log(`❌ Air HTTP server not accessible: ${error.message}`)
    return false
  }
}

// Test GUN database connectivity
const testGun = async () => {
  try {
    // Import GUN (handling both browser and node environments)
    let Gun
    try {
      Gun = (await import('gun')).default
    } catch (e) {
      Gun = require('gun')
    }
    
    const gun = Gun(['http://localhost:8765/gun'])
    
    // Test write/read cycle
    const testData = {
      timestamp: Date.now(),
      message: 'Agent runtime connection test',
      from: 'test-script'
    }
    
    console.log('📝 Testing GUN write operation...')
    gun.get('test/agent-runtime').put(testData)
    
    // Test read operation
    return new Promise((resolve) => {
      setTimeout(() => {
        gun.get('test/agent-runtime').once((data) => {
          if (data && data.timestamp === testData.timestamp) {
            console.log('✅ GUN database read/write successful')
            resolve(true)
          } else {
            console.log('❌ GUN database read/write failed')
            resolve(false)
          }
        })
      }, 1000)
    })
    
  } catch (error) {
    console.log(`❌ GUN database connection failed: ${error.message}`)
    return false
  }
}

// Run tests
const runTests = async () => {
  console.log('🧪 Running Air connectivity tests...')
  console.log('')
  
  const httpOk = await testHttp()
  const gunOk = await testGun()
  
  console.log('')
  console.log('📊 Test Results:')
  console.log(`   HTTP Server: ${httpOk ? '✅ OK' : '❌ FAILED'}`)
  console.log(`   GUN Database: ${gunOk ? '✅ OK' : '❌ FAILED'}`)
  
  if (httpOk && gunOk) {
    console.log('')
    console.log('🎉 All tests passed! Agent runtime system ready.')
    console.log('🚀 You can now start living agents with: npm run agents:start')
    process.exit(0)
  } else {
    console.log('')
    console.log('❌ Tests failed. Please ensure Air is running:')
    console.log('   cd projects/air && npm start')
    process.exit(1)
  }
}

runTests().catch(console.error)