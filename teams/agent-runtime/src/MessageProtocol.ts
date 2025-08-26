/**
 * MessageProtocol - Real-time message passing system for Air-based agents
 * 
 * This system provides:
 * - Structured message types and protocols
 * - Event-driven communication patterns
 * - Message queuing and delivery confirmation
 * - Inter-team coordination primitives
 */

export enum MessageType {
  // Task Management
  TASK_ASSIGNMENT = 'task_assignment',
  TASK_UPDATE = 'task_update',
  TASK_COMPLETION = 'task_completion',
  TASK_FAILURE = 'task_failure',
  TASK_DELEGATION = 'task_delegation',
  
  // Coordination
  COORDINATION_REQUEST = 'coordination_request',
  COORDINATION_RESPONSE = 'coordination_response',
  COLLABORATION_REQUEST = 'collaboration_request',
  STATUS_REQUEST = 'status_request',
  STATUS_RESPONSE = 'status_response',
  
  // System Events
  AGENT_ONLINE = 'agent_online',
  AGENT_OFFLINE = 'agent_offline',
  SYSTEM_ALERT = 'system_alert',
  HEARTBEAT = 'heartbeat',
  
  // Dashboard Updates
  DASHBOARD_UPDATE = 'dashboard_update',
  METRICS_UPDATE = 'metrics_update',
  LOG_EVENT = 'log_event',
  
  // Emergency
  EMERGENCY_STOP = 'emergency_stop',
  SYSTEM_SHUTDOWN = 'system_shutdown'
}

export enum Priority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
  EMERGENCY = 5
}

export interface Message {
  id: string
  type: MessageType
  from: string // sender agent ID
  to?: string // target agent ID (optional for broadcasts)
  team?: string // target team (for team-wide messages)
  priority: Priority
  timestamp: number
  ttl?: number // time to live in milliseconds
  data: any
  requires_confirmation?: boolean
  correlation_id?: string // for request/response pairs
}

export interface MessageConfirmation {
  message_id: string
  agent_id: string
  status: 'received' | 'processed' | 'failed'
  timestamp: number
  error?: string
}

/**
 * MessageProtocol - Handles structured messaging between agents via Air/GUN
 */
export class MessageProtocol {
  private gun: any
  private agentId: string
  private messageHandlers: Map<MessageType, (message: Message) => Promise<void>> = new Map()
  private pendingConfirmations: Map<string, NodeJS.Timeout> = new Map()
  private messageQueue: Message[] = []
  private processingQueue = false

  constructor(gun: any, agentId: string) {
    this.gun = gun
    this.agentId = agentId
    this.setupListeners()
  }

  /**
   * Setup GUN listeners for real-time messaging
   */
  private setupListeners() {
    // Listen for direct messages
    this.gun.get(`messages/direct/${this.agentId}`).on((data: any, key: string) => {
      if (data && this.isValidMessage(data)) {
        this.handleIncomingMessage(data as Message)
      }
    })

    // Listen for team broadcasts
    const teamId = this.agentId.split('-')[0]
    this.gun.get(`messages/teams/${teamId}`).on((data: any, key: string) => {
      if (data && this.isValidMessage(data) && data.from !== this.agentId) {
        this.handleIncomingMessage(data as Message)
      }
    })

    // Listen for system-wide broadcasts
    this.gun.get('messages/system').on((data: any, key: string) => {
      if (data && this.isValidMessage(data) && data.from !== this.agentId) {
        this.handleIncomingMessage(data as Message)
      }
    })

    console.log(`📡 Message protocol initialized for agent: ${this.agentId}`)
  }

  /**
   * Validate incoming message structure
   */
  private isValidMessage(data: any): boolean {
    return (
      data &&
      typeof data.id === 'string' &&
      typeof data.type === 'string' &&
      typeof data.from === 'string' &&
      typeof data.priority === 'number' &&
      typeof data.timestamp === 'number' &&
      data.timestamp > Date.now() - 300000 // Not older than 5 minutes
    )
  }

  /**
   * Handle incoming messages
   */
  private async handleIncomingMessage(message: Message) {
    console.log(`📨 Agent ${this.agentId} received ${message.type} from ${message.from}`)
    
    // Check TTL
    if (message.ttl && Date.now() - message.timestamp > message.ttl) {
      console.log(`⏰ Message ${message.id} expired, ignoring`)
      return
    }

    // Send confirmation if required
    if (message.requires_confirmation) {
      this.sendConfirmation(message.id, message.from, 'received')
    }

    // Add to processing queue
    this.messageQueue.push(message)
    this.processMessageQueue()
  }

  /**
   * Process message queue
   */
  private async processMessageQueue() {
    if (this.processingQueue || this.messageQueue.length === 0) {
      return
    }

    this.processingQueue = true

    try {
      // Sort by priority (highest first)
      this.messageQueue.sort((a, b) => b.priority - a.priority)

      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift()!
        await this.processMessage(message)
      }
    } finally {
      this.processingQueue = false
    }
  }

  /**
   * Process individual message
   */
  private async processMessage(message: Message) {
    try {
      const handler = this.messageHandlers.get(message.type)
      if (handler) {
        await handler(message)
        
        // Send processing confirmation if required
        if (message.requires_confirmation) {
          this.sendConfirmation(message.id, message.from, 'processed')
        }
      } else {
        console.log(`⚠️ No handler for message type: ${message.type}`)
        
        if (message.requires_confirmation) {
          this.sendConfirmation(message.id, message.from, 'failed', 'No message handler')
        }
      }
    } catch (error) {
      console.error(`❌ Error processing message ${message.id}:`, error)
      
      if (message.requires_confirmation) {
        this.sendConfirmation(message.id, message.from, 'failed', error.message)
      }
    }
  }

  /**
   * Register message handler
   */
  public onMessage(type: MessageType, handler: (message: Message) => Promise<void>) {
    this.messageHandlers.set(type, handler)
    console.log(`📋 Handler registered for message type: ${type}`)
  }

  /**
   * Send direct message to specific agent
   */
  public async sendDirectMessage(
    to: string,
    type: MessageType,
    data: any,
    priority: Priority = Priority.MEDIUM,
    options: {
      requiresConfirmation?: boolean
      ttl?: number
      correlationId?: string
    } = {}
  ): Promise<void> {
    const message: Message = {
      id: this.generateMessageId(),
      type,
      from: this.agentId,
      to,
      priority,
      timestamp: Date.now(),
      data,
      ...options
    }

    // Send via GUN
    this.gun.get(`messages/direct/${to}`).put(message)
    
    console.log(`📤 Agent ${this.agentId} sent ${type} to ${to}`)

    // Setup confirmation timeout if required
    if (options.requiresConfirmation) {
      this.setupConfirmationTimeout(message.id, to)
    }
  }

  /**
   * Send team broadcast message
   */
  public async sendTeamMessage(
    team: string,
    type: MessageType,
    data: any,
    priority: Priority = Priority.MEDIUM,
    options: {
      requiresConfirmation?: boolean
      ttl?: number
      correlationId?: string
    } = {}
  ): Promise<void> {
    const message: Message = {
      id: this.generateMessageId(),
      type,
      from: this.agentId,
      team,
      priority,
      timestamp: Date.now(),
      data,
      ...options
    }

    // Send via GUN
    this.gun.get(`messages/teams/${team}`).put(message)
    
    console.log(`📤 Agent ${this.agentId} sent ${type} to team ${team}`)
  }

  /**
   * Send system-wide broadcast
   */
  public async sendSystemMessage(
    type: MessageType,
    data: any,
    priority: Priority = Priority.HIGH,
    options: {
      requiresConfirmation?: boolean
      ttl?: number
      correlationId?: string
    } = {}
  ): Promise<void> {
    const message: Message = {
      id: this.generateMessageId(),
      type,
      from: this.agentId,
      priority,
      timestamp: Date.now(),
      data,
      ...options
    }

    // Send via GUN
    this.gun.get('messages/system').put(message)
    
    console.log(`📤 Agent ${this.agentId} sent system ${type}`)
  }

  /**
   * Send task assignment message
   */
  public async assignTask(
    targetAgent: string,
    task: any,
    priority: Priority = Priority.MEDIUM
  ): Promise<void> {
    await this.sendDirectMessage(
      targetAgent,
      MessageType.TASK_ASSIGNMENT,
      { task },
      priority,
      { requiresConfirmation: true }
    )
  }

  /**
   * Send collaboration request
   */
  public async requestCollaboration(
    targetAgent: string,
    collaborationType: string,
    details: any
  ): Promise<void> {
    await this.sendDirectMessage(
      targetAgent,
      MessageType.COLLABORATION_REQUEST,
      { collaborationType, details },
      Priority.MEDIUM,
      { requiresConfirmation: true }
    )
  }

  /**
   * Send coordination request to team
   */
  public async requestTeamCoordination(
    team: string,
    request: any
  ): Promise<void> {
    await this.sendTeamMessage(
      team,
      MessageType.COORDINATION_REQUEST,
      request,
      Priority.HIGH,
      { requiresConfirmation: true }
    )
  }

  /**
   * Send emergency alert
   */
  public async sendEmergencyAlert(
    alertType: string,
    details: any
  ): Promise<void> {
    await this.sendSystemMessage(
      MessageType.SYSTEM_ALERT,
      { alertType, details, severity: 'emergency' },
      Priority.EMERGENCY,
      { ttl: 60000 } // 1 minute TTL for emergencies
    )
  }

  /**
   * Send confirmation
   */
  private sendConfirmation(
    messageId: string,
    to: string,
    status: MessageConfirmation['status'],
    error?: string
  ) {
    const confirmation: MessageConfirmation = {
      message_id: messageId,
      agent_id: this.agentId,
      status,
      timestamp: Date.now(),
      error
    }

    this.gun.get(`confirmations/${to}`).put(confirmation)
  }

  /**
   * Setup confirmation timeout
   */
  private setupConfirmationTimeout(messageId: string, targetAgent: string) {
    const timeout = setTimeout(() => {
      console.log(`⚠️ Confirmation timeout for message ${messageId} to ${targetAgent}`)
      this.pendingConfirmations.delete(messageId)
      // Could trigger retry logic here
    }, 30000) // 30 second timeout

    this.pendingConfirmations.set(messageId, timeout)

    // Listen for confirmation
    this.gun.get(`confirmations/${this.agentId}`).on((confirmation: MessageConfirmation) => {
      if (confirmation && confirmation.message_id === messageId) {
        console.log(`✅ Received confirmation for message ${messageId}: ${confirmation.status}`)
        
        const pendingTimeout = this.pendingConfirmations.get(messageId)
        if (pendingTimeout) {
          clearTimeout(pendingTimeout)
          this.pendingConfirmations.delete(messageId)
        }
      }
    })
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${this.agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Create request/response pair
   */
  public async sendRequest(
    to: string,
    type: MessageType,
    data: any,
    timeout: number = 30000
  ): Promise<any> {
    const correlationId = this.generateMessageId()
    
    // Setup response listener
    const responsePromise = new Promise((resolve, reject) => {
      const responseTimeout = setTimeout(() => {
        reject(new Error(`Request timeout for ${type} to ${to}`))
      }, timeout)

      // Listen for response
      this.gun.get(`messages/direct/${this.agentId}`).on((message: Message) => {
        if (message && message.correlation_id === correlationId) {
          clearTimeout(responseTimeout)
          resolve(message.data)
        }
      })
    })

    // Send request
    await this.sendDirectMessage(to, type, data, Priority.HIGH, {
      correlationId,
      requiresConfirmation: true
    })

    return responsePromise
  }

  /**
   * Send response to a request
   */
  public async sendResponse(
    to: string,
    correlationId: string,
    responseData: any
  ): Promise<void> {
    await this.sendDirectMessage(
      to,
      MessageType.COORDINATION_RESPONSE,
      responseData,
      Priority.HIGH,
      { correlationId }
    )
  }

  /**
   * Setup standard message handlers for LiveAgent
   */
  public setupStandardHandlers(agent: any) {
    // Task assignment handler
    this.onMessage(MessageType.TASK_ASSIGNMENT, async (message) => {
      if (message.data.task && agent.enqueueTask) {
        agent.enqueueTask(message.data.task)
      }
    })

    // Coordination request handler
    this.onMessage(MessageType.COORDINATION_REQUEST, async (message) => {
      console.log(`🤝 Coordination request received: ${message.data.type}`)
      // Handle based on coordination type
      if (message.correlation_id) {
        await this.sendResponse(message.from, message.correlation_id, {
          success: true,
          agent_status: agent.getStatus()
        })
      }
    })

    // Status request handler
    this.onMessage(MessageType.STATUS_REQUEST, async (message) => {
      if (message.correlation_id) {
        await this.sendResponse(message.from, message.correlation_id, {
          status: agent.getStatus(),
          queue_length: agent.getQueueLength()
        })
      }
    })

    // Emergency stop handler
    this.onMessage(MessageType.EMERGENCY_STOP, async (message) => {
      console.log(`🚨 Emergency stop received: ${message.data.reason}`)
      if (agent.gracefulShutdown) {
        await agent.gracefulShutdown()
      }
    })

    // System shutdown handler
    this.onMessage(MessageType.SYSTEM_SHUTDOWN, async (message) => {
      console.log(`🛑 System shutdown received`)
      if (agent.gracefulShutdown) {
        setTimeout(() => agent.gracefulShutdown(), message.data.delay || 0)
      }
    })
  }

  /**
   * Cleanup resources
   */
  public cleanup() {
    // Clear pending confirmation timeouts
    for (const timeout of this.pendingConfirmations.values()) {
      clearTimeout(timeout)
    }
    this.pendingConfirmations.clear()

    // Clear message handlers
    this.messageHandlers.clear()

    // Clear message queue
    this.messageQueue = []

    console.log(`🧹 Message protocol cleanup completed for ${this.agentId}`)
  }
}

export default MessageProtocol