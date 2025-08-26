/**
 * LiveAgent - Core runtime for living agents that communicate via Air/GUN
 * 
 * This transforms static Claude agents into persistent processes that:
 * - Connect to Air/GUN database for real-time communication
 * - Listen for task assignments and coordinate with other agents
 * - Provide real-time status updates to dashboard
 * - Execute autonomous operations
 */

import Gun from 'gun'
import { EventEmitter } from 'events'

interface AgentConfig {
  teamId: string
  role: string
  instanceId: string
  specialization: string
  model: string
  airEndpoint?: string
}

interface Task {
  id: string
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  data: any
  assigned_to?: string
  created_at: number
  deadline?: number
}

interface AgentStatus {
  status: 'initializing' | 'active' | 'idle' | 'busy' | 'offline' | 'error'
  current_task?: string
  capabilities: string[]
  heartbeat: number
  performance_metrics?: {
    tasks_completed: number
    avg_completion_time: number
    success_rate: number
  }
}

export class LiveAgent extends EventEmitter {
  private gun: any
  private agentPath: string
  private config: AgentConfig
  private status: AgentStatus
  private heartbeatInterval: NodeJS.Timeout | null = null
  private taskQueue: Task[] = []
  private isProcessingTask = false

  constructor(config: AgentConfig) {
    super()
    this.config = config
    this.agentPath = `agents/${config.teamId}/${config.role}/${config.instanceId}`
    
    // Initialize status
    this.status = {
      status: 'initializing',
      capabilities: this.getCapabilities(),
      heartbeat: Date.now(),
      performance_metrics: {
        tasks_completed: 0,
        avg_completion_time: 0,
        success_rate: 100
      }
    }
    
    // Connect to Air/GUN
    this.connectToAir()
  }

  /**
   * Connect to Air/GUN database
   */
  private connectToAir() {
    const endpoint = this.config.airEndpoint || 'http://localhost:8765/gun'
    console.log(`🔗 Agent ${this.config.instanceId} connecting to Air at ${endpoint}`)
    
    try {
      this.gun = Gun([endpoint])
      this.setupGunListeners()
      this.registerAgent()
      this.startHeartbeat()
      this.updateStatus('active')
      
      console.log(`✅ Agent ${this.config.instanceId} connected and active!`)
      this.emit('connected')
    } catch (error) {
      console.error(`❌ Agent ${this.config.instanceId} failed to connect:`, error)
      this.updateStatus('error')
      this.emit('error', error)
    }
  }

  /**
   * Setup GUN event listeners for real-time communication
   */
  private setupGunListeners() {
    // Listen for task assignments
    this.gun.get('task_queue').on((data: any, key: string) => {
      if (data && data.assigned_to === this.config.instanceId && data.status === 'pending') {
        console.log(`📨 Agent ${this.config.instanceId} received task: ${data.id}`)
        this.enqueueTask(data)
      }
    })

    // Listen for coordination messages
    this.gun.get(`coordination/${this.config.teamId}`).on((data: any, key: string) => {
      if (data && data.target === this.config.instanceId) {
        console.log(`🤝 Agent ${this.config.instanceId} received coordination message:`, data.type)
        this.handleCoordinationMessage(data)
      }
    })

    // Listen for system commands
    this.gun.get(`commands/${this.config.instanceId}`).on((data: any, key: string) => {
      if (data && data.timestamp > Date.now() - 5000) { // Only recent commands
        console.log(`⚡ Agent ${this.config.instanceId} received command:`, data.command)
        this.handleCommand(data)
      }
    })

    // Listen for shutdown signals
    this.gun.get('system/shutdown').on((data: any) => {
      if (data && data.timestamp > Date.now() - 5000) {
        console.log(`🛑 Agent ${this.config.instanceId} received shutdown signal`)
        this.gracefulShutdown()
      }
    })
  }

  /**
   * Register this agent in the GUN graph
   */
  private registerAgent() {
    const agentData = {
      ...this.status,
      config: {
        teamId: this.config.teamId,
        role: this.config.role,
        instanceId: this.config.instanceId,
        specialization: this.config.specialization,
        model: this.config.model
      },
      registered_at: Date.now()
    }

    this.gun.get(this.agentPath).put(agentData)
    
    // Also register in team roster
    this.gun.get(`teams/${this.config.teamId}/members`).set(this.config.instanceId)
    
    console.log(`📋 Agent ${this.config.instanceId} registered in system`)
  }

  /**
   * Get capabilities based on agent role and specialization
   */
  private getCapabilities(): string[] {
    const baseCapabilities = ['task_execution', 'status_reporting', 'coordination']
    const roleCapabilities: { [key: string]: string[] } = {
      coordinator: ['planning', 'task_allocation', 'team_management'],
      fixer: ['bug_fixing', 'test_repair', 'code_correction'],
      integrator: ['package_integration', 'dependency_resolution'],
      developer: ['feature_implementation', 'code_development'],
      orchestrator: ['system_coordination', 'cross_team_management'],
      inspector: ['code_analysis', 'integrity_verification'],
      enforcer: ['quality_enforcement', 'standard_policing']
    }
    
    return [...baseCapabilities, ...(roleCapabilities[this.config.role] || [])]
  }

  /**
   * Start heartbeat to indicate agent is alive
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.status.heartbeat = Date.now()
      this.gun.get(`${this.agentPath}/heartbeat`).put(this.status.heartbeat)
      
      // Update dashboard metrics
      this.gun.get('dashboard/agents').get(this.config.instanceId).put({
        last_seen: this.status.heartbeat,
        status: this.status.status,
        current_task: this.status.current_task || null
      })
    }, 5000) // Heartbeat every 5 seconds
  }

  /**
   * Update agent status and propagate to GUN
   */
  private updateStatus(newStatus: AgentStatus['status']) {
    this.status.status = newStatus
    this.status.heartbeat = Date.now()
    
    // Update in GUN
    this.gun.get(this.agentPath).put(this.status)
    
    // Emit local event
    this.emit('statusChanged', newStatus)
    
    console.log(`📊 Agent ${this.config.instanceId} status: ${newStatus}`)
  }

  /**
   * Add task to queue and start processing if idle
   */
  private enqueueTask(task: Task) {
    this.taskQueue.push(task)
    this.emit('taskQueued', task)
    
    if (!this.isProcessingTask && this.status.status === 'active') {
      this.processNextTask()
    }
  }

  /**
   * Process the next task in queue
   */
  private async processNextTask() {
    if (this.taskQueue.length === 0 || this.isProcessingTask) {
      return
    }

    const task = this.taskQueue.shift()!
    this.isProcessingTask = true
    this.updateStatus('busy')
    this.status.current_task = task.id

    const startTime = Date.now()
    
    try {
      console.log(`🚀 Agent ${this.config.instanceId} starting task: ${task.id}`)
      
      // Update task status to in_progress
      this.gun.get(`tasks/${task.id}`).put({
        status: 'in_progress',
        started_at: startTime,
        assigned_to: this.config.instanceId
      })

      // Execute the actual task
      const result = await this.executeTask(task)
      
      const completionTime = Date.now() - startTime
      
      // Update task as completed
      this.gun.get(`tasks/${task.id}`).put({
        status: 'completed',
        completed_at: Date.now(),
        result: result,
        execution_time: completionTime
      })

      // Update performance metrics
      this.updatePerformanceMetrics(completionTime, true)
      
      console.log(`✅ Agent ${this.config.instanceId} completed task: ${task.id} (${completionTime}ms)`)
      this.emit('taskCompleted', task, result)
      
    } catch (error) {
      console.error(`❌ Agent ${this.config.instanceId} failed task: ${task.id}`, error)
      
      // Update task as failed
      this.gun.get(`tasks/${task.id}`).put({
        status: 'failed',
        failed_at: Date.now(),
        error: error.message,
        execution_time: Date.now() - startTime
      })

      this.updatePerformanceMetrics(Date.now() - startTime, false)
      this.emit('taskFailed', task, error)
    } finally {
      this.isProcessingTask = false
      this.status.current_task = undefined
      this.updateStatus(this.taskQueue.length > 0 ? 'active' : 'idle')
      
      // Process next task if available
      if (this.taskQueue.length > 0) {
        setTimeout(() => this.processNextTask(), 100)
      }
    }
  }

  /**
   * Execute a specific task (to be overridden by specific agent implementations)
   */
  protected async executeTask(task: Task): Promise<any> {
    // Default implementation - specific agents should override this
    console.log(`🔧 Agent ${this.config.instanceId} processing task type: ${task.type}`)
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500))
    
    return {
      success: true,
      message: `Task ${task.id} processed by ${this.config.role}`,
      processed_at: Date.now()
    }
  }

  /**
   * Handle coordination messages from other agents
   */
  private handleCoordinationMessage(message: any) {
    switch (message.type) {
      case 'task_delegation':
        if (message.task) {
          this.enqueueTask(message.task)
        }
        break
      case 'status_request':
        this.sendCoordinationResponse(message.from, 'status_response', this.status)
        break
      case 'collaboration_request':
        this.handleCollaborationRequest(message)
        break
      default:
        console.log(`🤔 Agent ${this.config.instanceId} received unknown coordination message: ${message.type}`)
    }
  }

  /**
   * Send coordination message to other agents
   */
  public sendCoordinationMessage(targetTeam: string, targetAgent: string, type: string, data: any) {
    const message = {
      from: this.config.instanceId,
      target: targetAgent,
      type: type,
      data: data,
      timestamp: Date.now()
    }
    
    this.gun.get(`coordination/${targetTeam}`).put(message)
    console.log(`📤 Agent ${this.config.instanceId} sent ${type} to ${targetAgent}`)
  }

  /**
   * Send coordination response
   */
  private sendCoordinationResponse(targetAgent: string, type: string, data: any) {
    const response = {
      from: this.config.instanceId,
      target: targetAgent,
      type: type,
      data: data,
      timestamp: Date.now()
    }
    
    this.gun.get(`coordination/${this.config.teamId}`).put(response)
  }

  /**
   * Handle collaboration requests
   */
  private handleCollaborationRequest(message: any) {
    console.log(`🤝 Agent ${this.config.instanceId} received collaboration request from ${message.from}`)
    this.emit('collaborationRequest', message)
  }

  /**
   * Handle system commands
   */
  private handleCommand(command: any) {
    switch (command.command) {
      case 'pause':
        this.updateStatus('idle')
        break
      case 'resume':
        this.updateStatus('active')
        if (this.taskQueue.length > 0) {
          this.processNextTask()
        }
        break
      case 'status':
        this.gun.get(`responses/${this.config.instanceId}`).put({
          status: this.status,
          timestamp: Date.now()
        })
        break
      case 'shutdown':
        this.gracefulShutdown()
        break
      default:
        console.log(`❓ Agent ${this.config.instanceId} received unknown command: ${command.command}`)
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(executionTime: number, success: boolean) {
    const metrics = this.status.performance_metrics!
    metrics.tasks_completed++
    
    // Update average completion time
    metrics.avg_completion_time = 
      (metrics.avg_completion_time * (metrics.tasks_completed - 1) + executionTime) / metrics.tasks_completed
    
    // Update success rate
    const totalTasks = metrics.tasks_completed
    const successfulTasks = success ? totalTasks : totalTasks - 1
    metrics.success_rate = (successfulTasks / totalTasks) * 100
    
    // Update in GUN
    this.gun.get(`${this.agentPath}/performance_metrics`).put(metrics)
  }

  /**
   * Graceful shutdown
   */
  public async gracefulShutdown() {
    console.log(`🛑 Agent ${this.config.instanceId} initiating graceful shutdown...`)
    
    this.updateStatus('offline')
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    // Wait for current task to complete
    if (this.isProcessingTask) {
      console.log(`⏳ Agent ${this.config.instanceId} waiting for current task to complete...`)
      await new Promise(resolve => {
        const checkComplete = () => {
          if (!this.isProcessingTask) {
            resolve(void 0)
          } else {
            setTimeout(checkComplete, 100)
          }
        }
        checkComplete()
      })
    }
    
    // Clear task queue and reassign tasks
    this.taskQueue.forEach(task => {
      this.gun.get(`tasks/${task.id}`).put({
        status: 'pending',
        assigned_to: null,
        reassigned_reason: 'agent_shutdown'
      })
    })
    
    console.log(`👋 Agent ${this.config.instanceId} shutdown complete`)
    this.emit('shutdown')
    process.exit(0)
  }

  /**
   * Get current agent status
   */
  public getStatus(): AgentStatus {
    return { ...this.status }
  }

  /**
   * Get current task queue length
   */
  public getQueueLength(): number {
    return this.taskQueue.length
  }
}

export default LiveAgent