/**
 * AgentLauncher - Spawns and manages living agent processes
 * 
 * This system:
 * - Reads agent configurations from team.config.yaml
 * - Spawns agent processes with proper isolation
 * - Monitors agent health and auto-restarts failed agents
 * - Provides central management interface
 */

import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import Gun from 'gun'

interface AgentProcess {
  id: string
  teamId: string
  role: string
  instanceId: string
  process: ChildProcess
  startTime: number
  restartCount: number
  lastHeartbeat: number
  status: 'starting' | 'running' | 'stopped' | 'failed'
}

interface TeamConfig {
  teams: {
    [teamId: string]: {
      id: string
      description: string
      triggers: string[]
      conditions: string[]
      members: Array<{
        role: string
        model: string
        specialization: string
      }>
    }
  }
}

export class AgentLauncher extends EventEmitter {
  private agents: Map<string, AgentProcess> = new Map()
  private gun: any
  private config: TeamConfig
  private configPath: string
  private monitorInterval: NodeJS.Timeout | null = null
  private airEndpoint: string

  constructor(configPath: string, airEndpoint = 'http://localhost:8765/gun') {
    super()
    this.configPath = configPath
    this.airEndpoint = airEndpoint
    this.loadConfig()
    this.connectToAir()
  }

  /**
   * Load team configuration
   */
  private loadConfig() {
    try {
      const configFile = fs.readFileSync(this.configPath, 'utf8')
      this.config = yaml.load(configFile) as TeamConfig
      console.log(`📋 Loaded configuration for ${Object.keys(this.config.teams).length} teams`)
    } catch (error) {
      console.error('❌ Failed to load team configuration:', error)
      throw error
    }
  }

  /**
   * Connect to Air/GUN for system coordination
   */
  private connectToAir() {
    try {
      this.gun = Gun([this.airEndpoint])
      console.log(`🔗 AgentLauncher connected to Air at ${this.airEndpoint}`)
      
      // Listen for launcher commands
      this.gun.get('launcher/commands').on((data: any, key: string) => {
        if (data && data.timestamp > Date.now() - 5000) {
          this.handleLauncherCommand(data)
        }
      })
      
    } catch (error) {
      console.error('❌ Failed to connect to Air:', error)
      throw error
    }
  }

  /**
   * Launch all agents from configuration
   */
  public async launchAllAgents(): Promise<void> {
    console.log('🚀 Launching all agents...')
    
    const launchPromises: Promise<void>[] = []
    
    for (const [teamId, teamConfig] of Object.entries(this.config.teams)) {
      for (const member of teamConfig.members) {
        // Create multiple instances for load balancing if needed
        const instanceCount = this.getInstanceCount(teamId, member.role)
        
        for (let i = 1; i <= instanceCount; i++) {
          const instanceId = `${teamId}-${member.role}-${i}`
          launchPromises.push(this.launchAgent(teamId, member.role, instanceId, member))
        }
      }
    }
    
    await Promise.all(launchPromises)
    
    // Start monitoring
    this.startMonitoring()
    
    console.log(`✅ All agents launched! Total: ${this.agents.size} agents running`)
    this.updateSystemStatus()
  }

  /**
   * Launch a single agent
   */
  public async launchAgent(
    teamId: string, 
    role: string, 
    instanceId: string, 
    memberConfig: any
  ): Promise<void> {
    if (this.agents.has(instanceId)) {
      console.log(`⚠️ Agent ${instanceId} already running`)
      return
    }

    console.log(`🚀 Launching agent: ${instanceId}`)
    
    try {
      // Create agent script path
      const agentScriptPath = path.join(path.dirname(import.meta.url.replace('file://', '')), '..', 'agents', `${teamId}-${role}.js`)
      
      // Ensure agent script exists (create generic one if not)
      await this.ensureAgentScript(teamId, role, memberConfig)
      
      // Spawn agent process
      const childProcess = spawn('node', [agentScriptPath], {
        env: {
          ...process.env,
          AGENT_TEAM_ID: teamId,
          AGENT_ROLE: role,
          AGENT_INSTANCE_ID: instanceId,
          AGENT_SPECIALIZATION: memberConfig.specialization,
          AGENT_MODEL: memberConfig.model,
          AIR_ENDPOINT: this.airEndpoint
        },
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      // Create agent process record
      const agentProcess: AgentProcess = {
        id: `${teamId}-${role}`,
        teamId,
        role,
        instanceId,
        process: childProcess,
        startTime: Date.now(),
        restartCount: 0,
        lastHeartbeat: Date.now(),
        status: 'starting'
      }
      
      this.agents.set(instanceId, agentProcess)
      
      // Setup process event handlers
      this.setupProcessHandlers(agentProcess)
      
      // Wait for agent to be ready
      await this.waitForAgentReady(instanceId)
      
      console.log(`✅ Agent ${instanceId} launched successfully`)
      this.emit('agentLaunched', instanceId)
      
    } catch (error) {
      console.error(`❌ Failed to launch agent ${instanceId}:`, error)
      this.emit('agentLaunchFailed', instanceId, error)
      throw error
    }
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(agentProcess: AgentProcess) {
    const { process: childProcess, instanceId } = agentProcess
    
    // Handle process output
    childProcess.stdout?.on('data', (data) => {
      console.log(`[${instanceId}] ${data.toString().trim()}`)
    })
    
    childProcess.stderr?.on('data', (data) => {
      console.error(`[${instanceId}] ERROR: ${data.toString().trim()}`)
    })
    
    // Handle process exit
    childProcess.on('exit', (code, signal) => {
      console.log(`🔄 Agent ${instanceId} exited with code ${code} signal ${signal}`)
      agentProcess.status = code === 0 ? 'stopped' : 'failed'
      
      this.emit('agentExited', instanceId, code, signal)
      
      // Auto-restart if not intentional shutdown
      if (code !== 0 && agentProcess.restartCount < 5) {
        console.log(`🔄 Auto-restarting agent ${instanceId}...`)
        setTimeout(() => this.restartAgent(instanceId), 2000)
      } else if (agentProcess.restartCount >= 5) {
        console.error(`❌ Agent ${instanceId} failed too many times, giving up`)
        this.agents.delete(instanceId)
      }
    })
    
    // Handle process errors
    childProcess.on('error', (error) => {
      console.error(`❌ Agent ${instanceId} process error:`, error)
      agentProcess.status = 'failed'
      this.emit('agentError', instanceId, error)
    })
  }

  /**
   * Wait for agent to report ready status
   */
  private async waitForAgentReady(instanceId: string, timeout = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      const checkReady = () => {
        // Check if agent registered in GUN
        this.gun.get(`agents/${instanceId.split('-')[0]}/${instanceId.split('-')[1]}/${instanceId}`)
          .once((data: any) => {
            if (data && data.status === 'active') {
              const agentProcess = this.agents.get(instanceId)
              if (agentProcess) {
                agentProcess.status = 'running'
              }
              resolve()
            } else if (Date.now() - startTime > timeout) {
              reject(new Error(`Agent ${instanceId} failed to start within ${timeout}ms`))
            } else {
              setTimeout(checkReady, 500)
            }
          })
      }
      
      checkReady()
    })
  }

  /**
   * Ensure agent script exists
   */
  private async ensureAgentScript(teamId: string, role: string, memberConfig: any): Promise<void> {
    const agentScriptPath = path.join(path.dirname(import.meta.url.replace('file://', '')), '..', 'agents', `${teamId}-${role}.js`)
    const agentDir = path.dirname(agentScriptPath)
    
    // Create agents directory if not exists
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true })
    }
    
    // Check if specific agent script exists
    if (!fs.existsSync(agentScriptPath)) {
      // Create generic agent script
      const genericScript = this.generateAgentScript(teamId, role, memberConfig)
      fs.writeFileSync(agentScriptPath, genericScript)
      console.log(`📝 Created generic agent script: ${agentScriptPath}`)
    }
  }

  /**
   * Generate generic agent script
   */
  private generateAgentScript(teamId: string, role: string, memberConfig: any): string {
    return `
// Auto-generated agent script for ${teamId}-${role}
const { LiveAgent } = require('../LiveAgent.js')

const config = {
  teamId: process.env.AGENT_TEAM_ID,
  role: process.env.AGENT_ROLE,
  instanceId: process.env.AGENT_INSTANCE_ID,
  specialization: process.env.AGENT_SPECIALIZATION,
  model: process.env.AGENT_MODEL,
  airEndpoint: process.env.AIR_ENDPOINT
}

// Create specialized agent class
class ${teamId.charAt(0).toUpperCase() + teamId.slice(1)}${role.charAt(0).toUpperCase() + role.slice(1)}Agent extends LiveAgent {
  async executeTask(task) {
    console.log(\`🔧 \${this.config.role} processing \${task.type} task: \${task.id}\`)
    
    // Simulate specialized work based on role
    const processingTime = this.getProcessingTime(task.type)
    await new Promise(resolve => setTimeout(resolve, processingTime))
    
    return {
      success: true,
      message: \`Task \${task.id} completed by \${this.config.role}\`,
      specialization: \`\${this.config.specialization}\`,
      processed_at: Date.now(),
      processing_time: processingTime
    }
  }
  
  getProcessingTime(taskType) {
    const baseTimes = {
      'bug_fix': 3000,
      'feature_dev': 5000,
      'integration': 4000,
      'coordination': 1000,
      'analysis': 2000
    }
    return baseTimes[taskType] || 2000
  }
}

const agent = new ${teamId.charAt(0).toUpperCase() + teamId.slice(1)}${role.charAt(0).toUpperCase() + role.slice(1)}Agent(config)

// Graceful shutdown handling
process.on('SIGINT', () => agent.gracefulShutdown())
process.on('SIGTERM', () => agent.gracefulShutdown())

console.log(\`🤖 \${config.instanceId} started with specialization: \${config.specialization}\`)
`
  }

  /**
   * Get instance count for a team/role combination
   */
  private getInstanceCount(teamId: string, role: string): number {
    // Default to 1, but can be configured based on load requirements
    const instanceConfig: { [key: string]: number } = {
      'core-fix-coordinator': 1,
      'core-fix-fixer': 2, // More fixers for parallel work
      'integration-coordinator': 1,
      'integration-integrator': 1,
      'feature-dev-coordinator': 1,
      'feature-dev-developer': 2,
      'meta-orchestrator': 1, // Only one orchestrator needed
      'integrity-inspector': 1,
      'integrity-enforcer': 1
    }
    
    return instanceConfig[`${teamId}-${role}`] || 1
  }

  /**
   * Start health monitoring
   */
  private startMonitoring() {
    this.monitorInterval = setInterval(() => {
      this.monitorAgents()
    }, 10000) // Check every 10 seconds
    
    console.log('👁️ Started agent health monitoring')
  }

  /**
   * Monitor agent health
   */
  private monitorAgents() {
    const currentTime = Date.now()
    
    for (const [instanceId, agentProcess] of this.agents) {
      // Check if agent process is still running
      if (agentProcess.status === 'running') {
        // Check heartbeat from GUN
        this.gun.get(`agents/${agentProcess.teamId}/${agentProcess.role}/${instanceId}/heartbeat`)
          .once((heartbeat: number) => {
            if (heartbeat && currentTime - heartbeat > 30000) {
              console.log(`⚠️ Agent ${instanceId} missed heartbeat, restarting...`)
              this.restartAgent(instanceId)
            }
          })
      }
    }
    
    // Update system health metrics
    this.updateSystemStatus()
  }

  /**
   * Restart a specific agent
   */
  public async restartAgent(instanceId: string): Promise<void> {
    const agentProcess = this.agents.get(instanceId)
    if (!agentProcess) {
      console.error(`❌ Agent ${instanceId} not found for restart`)
      return
    }
    
    console.log(`🔄 Restarting agent: ${instanceId}`)
    
    // Kill existing process
    try {
      agentProcess.process.kill('SIGTERM')
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for graceful shutdown
    } catch (error) {
      console.error(`⚠️ Force killing agent ${instanceId}:`, error)
      agentProcess.process.kill('SIGKILL')
    }
    
    // Remove from agents map
    this.agents.delete(instanceId)
    
    // Find team config for this agent
    const [teamId, role] = instanceId.split('-').slice(0, 2)
    const teamConfig = this.config.teams[teamId]
    const memberConfig = teamConfig.members.find(m => m.role === role)
    
    if (memberConfig) {
      agentProcess.restartCount++
      await this.launchAgent(teamId, role, instanceId, memberConfig)
    }
  }

  /**
   * Stop a specific agent
   */
  public async stopAgent(instanceId: string): Promise<void> {
    const agentProcess = this.agents.get(instanceId)
    if (!agentProcess) {
      console.error(`❌ Agent ${instanceId} not found`)
      return
    }
    
    console.log(`🛑 Stopping agent: ${instanceId}`)
    
    try {
      agentProcess.process.kill('SIGTERM')
      agentProcess.status = 'stopped'
    } catch (error) {
      console.error(`⚠️ Error stopping agent ${instanceId}:`, error)
    }
    
    this.agents.delete(instanceId)
  }

  /**
   * Stop all agents
   */
  public async stopAllAgents(): Promise<void> {
    console.log('🛑 Stopping all agents...')
    
    const stopPromises = Array.from(this.agents.keys()).map(instanceId => 
      this.stopAgent(instanceId)
    )
    
    await Promise.all(stopPromises)
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
    }
    
    console.log('✅ All agents stopped')
  }

  /**
   * Update system status in GUN
   */
  private updateSystemStatus() {
    const status = {
      total_agents: this.agents.size,
      running_agents: Array.from(this.agents.values()).filter(a => a.status === 'running').length,
      failed_agents: Array.from(this.agents.values()).filter(a => a.status === 'failed').length,
      last_update: Date.now(),
      teams: {}
    }
    
    // Group by teams
    for (const [instanceId, agentProcess] of this.agents) {
      if (!status.teams[agentProcess.teamId]) {
        status.teams[agentProcess.teamId] = {
          agents: [],
          running_count: 0,
          total_count: 0
        }
      }
      
      status.teams[agentProcess.teamId].agents.push({
        instanceId,
        role: agentProcess.role,
        status: agentProcess.status,
        uptime: Date.now() - agentProcess.startTime,
        restart_count: agentProcess.restartCount
      })
      
      status.teams[agentProcess.teamId].total_count++
      if (agentProcess.status === 'running') {
        status.teams[agentProcess.teamId].running_count++
      }
    }
    
    this.gun.get('system/launcher_status').put(status)
  }

  /**
   * Handle launcher commands from GUN
   */
  private handleLauncherCommand(command: any) {
    console.log(`⚡ Launcher received command: ${command.command}`)
    
    switch (command.command) {
      case 'restart_agent':
        if (command.instanceId) {
          this.restartAgent(command.instanceId)
        }
        break
      case 'stop_agent':
        if (command.instanceId) {
          this.stopAgent(command.instanceId)
        }
        break
      case 'launch_agent':
        if (command.teamId && command.role && command.instanceId) {
          const teamConfig = this.config.teams[command.teamId]
          const memberConfig = teamConfig?.members.find(m => m.role === command.role)
          if (memberConfig) {
            this.launchAgent(command.teamId, command.role, command.instanceId, memberConfig)
          }
        }
        break
      case 'status':
        this.updateSystemStatus()
        break
    }
  }

  /**
   * Get launcher status
   */
  public getStatus() {
    return {
      total_agents: this.agents.size,
      agents: Array.from(this.agents.entries()).map(([instanceId, process]) => ({
        instanceId,
        teamId: process.teamId,
        role: process.role,
        status: process.status,
        uptime: Date.now() - process.startTime,
        restart_count: process.restartCount
      }))
    }
  }
}

export default AgentLauncher