#!/usr/bin/env tsx

/**
 * Agent Runtime Launcher
 * 
 * This script launches the revolutionary Air-based living agent system:
 * - Transforms static Claude agents into persistent processes
 * - Provides real-time communication via Air/GUN database
 * - Enables autonomous coordination and collaboration
 * - Integrates with existing team structure and workflows
 */

import path from 'path'
import fs from 'fs'
import { AgentLauncher } from './src/AgentLauncher.js'

// Configuration
const CONFIG_PATH = path.join(process.cwd(), '.claude/team.config.yaml')
const AIR_ENDPOINT = process.env.AIR_ENDPOINT || 'http://localhost:8765/gun'
const SETUP_MODE = process.argv.includes('--setup')
const STOP_MODE = process.argv.includes('--stop')
const STATUS_MODE = process.argv.includes('--status')

/**
 * Main launcher function
 */
async function main() {
  console.log('🚀 Air-based Living Agent System')
  console.log('===============================')
  console.log('')

  try {
    // Check if Air is running
    await checkAirConnection()
    
    // Initialize launcher
    const launcher = new AgentLauncher(CONFIG_PATH, AIR_ENDPOINT)
    
    // Handle different modes
    if (SETUP_MODE) {
      await setupMode(launcher)
    } else if (STOP_MODE) {
      await stopMode(launcher)
    } else if (STATUS_MODE) {
      await statusMode(launcher)
    } else {
      await launchMode(launcher)
    }
    
  } catch (error) {
    console.error('❌ Launcher failed:', error)
    process.exit(1)
  }
}

/**
 * Check Air/GUN connection
 */
async function checkAirConnection(): Promise<void> {
  console.log(`🔗 Checking Air connection at ${AIR_ENDPOINT}...`)
  
  try {
    const Gun = (await import('gun')).default
    const gun = Gun([AIR_ENDPOINT])
    
    // Test connection with a ping
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Air connection timeout'))
      }, 5000)
      
      gun.get('system/ping').put({ 
        timestamp: Date.now(),
        from: 'launcher'
      }, (ack) => {
        clearTimeout(timeout)
        if (ack.err) {
          reject(new Error(`Air connection error: ${ack.err}`))
        } else {
          resolve(void 0)
        }
      })
    })
    
    console.log('✅ Air connection successful!')
    
  } catch (error) {
    console.error('❌ Failed to connect to Air:', error.message)
    console.log('')
    console.log('💡 Make sure Air is running on port 8765:')
    console.log('   cd projects/air && npm start')
    console.log('')
    throw error
  }
}

/**
 * Setup mode - prepare the system
 */
async function setupMode(launcher: AgentLauncher): Promise<void> {
  console.log('⚙️ Setup Mode: Preparing living agent system...')
  console.log('')
  
  // Create necessary directories
  const runtimeDir = path.join(__dirname, 'src', 'agents')
  if (!fs.existsSync(runtimeDir)) {
    fs.mkdirSync(runtimeDir, { recursive: true })
    console.log(`📁 Created agents directory: ${runtimeDir}`)
  }
  
  // Build TypeScript files
  console.log('🔨 Compiling TypeScript files...')
  const { spawn } = await import('child_process')
  
  await new Promise((resolve, reject) => {
    const tsc = spawn('npx', ['tsc'], { 
      cwd: __dirname,
      stdio: 'inherit'
    })
    
    tsc.on('exit', (code) => {
      if (code === 0) {
        resolve(void 0)
      } else {
        reject(new Error(`TypeScript compilation failed with code ${code}`))
      }
    })
  })
  
  console.log('✅ Setup complete!')
  console.log('')
  console.log('🚀 Ready to launch agents with:')
  console.log('   npm run agents:start')
}

/**
 * Launch mode - start all agents
 */
async function launchMode(launcher: AgentLauncher): Promise<void> {
  console.log('🚀 Launch Mode: Starting all living agents...')
  console.log('')
  
  // Setup graceful shutdown
  setupGracefulShutdown(launcher)
  
  // Launch all agents
  await launcher.launchAllAgents()
  
  console.log('')
  console.log('✅ All agents are now LIVING and communicating via Air!')
  console.log('📊 Check status at: http://localhost:8765 (Air Dashboard)')
  console.log('')
  console.log('🎯 Agents are now:')
  console.log('   • Listening for tasks via GUN database')
  console.log('   • Coordinating in real-time')
  console.log('   • Self-healing and auto-restarting')
  console.log('   • Providing live metrics to dashboard')
  console.log('')
  console.log('Press Ctrl+C to gracefully shutdown all agents')
  
  // Keep process alive
  await new Promise(() => {}) // Never resolves, keeps process running
}

/**
 * Stop mode - stop all agents
 */
async function stopMode(launcher: AgentLauncher): Promise<void> {
  console.log('🛑 Stop Mode: Stopping all agents...')
  console.log('')
  
  await launcher.stopAllAgents()
  
  console.log('✅ All agents stopped')
  process.exit(0)
}

/**
 * Status mode - show current status
 */
async function statusMode(launcher: AgentLauncher): Promise<void> {
  console.log('📊 Status Mode: Current agent system status')
  console.log('')
  
  const status = launcher.getStatus()
  
  console.log(`Total Agents: ${status.total_agents}`)
  console.log('')
  
  if (status.agents.length === 0) {
    console.log('No agents currently running')
    console.log('')
    console.log('Start agents with:')
    console.log('   npm run agents:start')
  } else {
    console.log('Active Agents:')
    console.log('=============')
    
    const groupedByTeam = status.agents.reduce((acc, agent) => {
      if (!acc[agent.teamId]) {
        acc[agent.teamId] = []
      }
      acc[agent.teamId].push(agent)
      return acc
    }, {} as any)
    
    for (const [teamId, agents] of Object.entries(groupedByTeam)) {
      console.log(`\n${teamId.toUpperCase()} Team:`)
      for (const agent of agents as any[]) {
        const uptime = Math.round((Date.now() - agent.uptime) / 1000)
        const statusIcon = agent.status === 'running' ? '🟢' : 
                          agent.status === 'failed' ? '🔴' : '🟡'
        
        console.log(`  ${statusIcon} ${agent.instanceId}`)
        console.log(`     Status: ${agent.status}`)
        console.log(`     Role: ${agent.role}`) 
        console.log(`     Uptime: ${uptime}s`)
        console.log(`     Restarts: ${agent.restart_count}`)
      }
    }
  }
  
  process.exit(0)
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown(launcher: AgentLauncher): void {
  const shutdown = async (signal: string) => {
    console.log('')
    console.log(`🛑 Received ${signal}, initiating graceful shutdown...`)
    
    try {
      await launcher.stopAllAgents()
      console.log('✅ Graceful shutdown complete')
      process.exit(0)
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  }
  
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error)
    shutdown('UNCAUGHT_EXCEPTION')
  })
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason)
    shutdown('UNHANDLED_REJECTION')
  })
}

/**
 * Display usage information
 */
function showUsage(): void {
  console.log('Usage:')
  console.log('  npm run agents:setup    - Setup the living agent system')
  console.log('  npm run agents:start    - Launch all living agents')
  console.log('  npm run agents:stop     - Stop all living agents')
  console.log('  npm run agents:status   - Show current status')
  console.log('')
  console.log('Environment Variables:')
  console.log('  AIR_ENDPOINT            - Air/GUN endpoint (default: http://localhost:8765/gun)')
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage()
  process.exit(0)
}

// Run main function
main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})