#!/usr/bin/env tsx

/**
 * Air-based Living Agent System Demonstration
 * 
 * This script demonstrates the revolutionary transformation from static agents to living processes:
 * 1. Connects to Air/GUN database
 * 2. Creates example tasks and coordination scenarios
 * 3. Shows real-time agent communication
 * 4. Demonstrates autonomous coordination
 */

import Gun from 'gun'
import { MessageType, Priority } from './src/MessageProtocol.js'

// Configuration
const AIR_ENDPOINT = 'http://localhost:8765/gun'

class AgentSystemDemo {
  private gun: any
  private demoTasks: any[] = []
  private demoAgents: string[] = []

  constructor() {
    this.gun = Gun([AIR_ENDPOINT])
  }

  async runDemo(): Promise<void> {
    console.log('🚀 Air-based Living Agent System Demonstration')
    console.log('===============================================')
    console.log('')

    try {
      await this.checkAirConnection()
      await this.setupDemoData()
      await this.demonstrateFeatures()
      await this.cleanup()
      
      console.log('✅ Demo completed successfully!')
      
    } catch (error) {
      console.error('❌ Demo failed:', error)
      throw error
    }
  }

  private async checkAirConnection(): Promise<void> {
    console.log('🔗 Checking Air/GUN connection...')
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Air connection timeout'))
      }, 5000)
      
      this.gun.get('demo/ping').put({ 
        timestamp: Date.now(),
        from: 'demo'
      }, (ack: any) => {
        clearTimeout(timeout)
        if (ack.err) {
          reject(new Error(`Air connection error: ${ack.err}`))
        } else {
          console.log('✅ Connected to Air successfully!')
          resolve(void 0)
        }
      })
    })
  }

  private async setupDemoData(): Promise<void> {
    console.log('📋 Setting up demonstration data...')
    
    // Create demo agents
    this.demoAgents = [
      'core-fix-coordinator-1',
      'core-fix-fixer-1', 
      'core-fix-fixer-2',
      'integration-coordinator-1',
      'feature-dev-developer-1',
      'meta-orchestrator-1'
    ]
    
    // Register demo agents in GUN
    for (const agentId of this.demoAgents) {
      const [teamId, role, instance] = agentId.split('-')
      const agentData = {
        config: {
          teamId,
          role,
          instanceId: agentId,
          specialization: this.getSpecialization(role),
          model: 'claude-3-5-sonnet-20241022'
        },
        status: 'active',
        heartbeat: Date.now(),
        capabilities: this.getCapabilities(role),
        registered_at: Date.now()
      }
      
      this.gun.get(`agents/${teamId}/${role}/${agentId}`).put(agentData)
    }
    
    // Create demo tasks
    this.demoTasks = [
      {
        id: 'task-syntax-error-1',
        type: 'analyze_error',
        priority: Priority.HIGH,
        data: {
          error_type: 'syntax_error',
          affected_files: ['src/utils.ts', 'src/main.ts'],
          description: 'Missing semicolons and bracket mismatch',
          blocks_build: true
        },
        status: 'pending',
        created_at: Date.now()
      },
      {
        id: 'task-dependency-issue-1',
        type: 'coordinate_fix',
        priority: Priority.MEDIUM,
        data: {
          error_type: 'dependency_error',
          affected_files: ['package.json'],
          description: 'Version conflict in TypeScript dependencies',
          estimated_effort: 30
        },
        status: 'pending',
        created_at: Date.now()
      },
      {
        id: 'task-integration-test-1',
        type: 'integration_check',
        priority: Priority.LOW,
        data: {
          packages: ['composer', 'battle', 'builder'],
          test_type: 'cross_compatibility',
          description: 'Verify package integration after updates'
        },
        status: 'pending',
        created_at: Date.now()
      }
    ]
    
    // Store tasks in GUN
    for (const task of this.demoTasks) {
      this.gun.get(`tasks/${task.id}`).put(task)
    }
    
    console.log(`✅ Demo data setup complete:`)
    console.log(`   - ${this.demoAgents.length} demo agents registered`)
    console.log(`   - ${this.demoTasks.length} demo tasks created`)
  }

  private async demonstrateFeatures(): Promise<void> {
    console.log('')
    console.log('🎯 Demonstrating Revolutionary Features:')
    console.log('========================================')
    
    await this.demonstrateRealTimeMessaging()
    await this.demonstrateTaskAssignment()
    await this.demonstrateCoordination()
    await this.demonstrateDashboardUpdates()
    await this.demonstrateEmergencyResponse()
  }

  private async demonstrateRealTimeMessaging(): Promise<void> {
    console.log('')
    console.log('💬 Feature 1: Real-time Agent Messaging')
    console.log('----------------------------------------')
    
    // Send a coordination request from coordinator to fixers
    const coordinationMessage = {
      id: `msg-${Date.now()}`,
      type: MessageType.COORDINATION_REQUEST,
      from: 'core-fix-coordinator-1',
      team: 'core-fix',
      priority: Priority.HIGH,
      timestamp: Date.now(),
      data: {
        request_type: 'status_report',
        urgency: 'immediate'
      }
    }
    
    console.log(`📤 Sending coordination request from coordinator to team...`)
    this.gun.get('messages/teams/core-fix').put(coordinationMessage)
    
    // Simulate responses from fixers
    setTimeout(() => {
      const responses = [
        {
          id: `resp-${Date.now()}-1`,
          type: MessageType.COORDINATION_RESPONSE,
          from: 'core-fix-fixer-1',
          to: 'core-fix-coordinator-1',
          priority: Priority.MEDIUM,
          timestamp: Date.now(),
          data: {
            status: 'available',
            current_workload: 0,
            specializations: ['syntax_errors', 'type_errors']
          }
        },
        {
          id: `resp-${Date.now()}-2`,
          type: MessageType.COORDINATION_RESPONSE,
          from: 'core-fix-fixer-2',
          to: 'core-fix-coordinator-1',
          priority: Priority.MEDIUM,
          timestamp: Date.now(),
          data: {
            status: 'busy',
            current_workload: 2,
            eta_available: Date.now() + 300000 // 5 minutes
          }
        }
      ]
      
      responses.forEach(response => {
        console.log(`📨 Response from ${response.from}: ${response.data.status}`)
        this.gun.get(`messages/direct/${response.to}`).put(response)
      })
      
    }, 1000)
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('✅ Real-time messaging demonstrated!')
  }

  private async demonstrateTaskAssignment(): Promise<void> {
    console.log('')
    console.log('📋 Feature 2: Intelligent Task Assignment')
    console.log('------------------------------------------')
    
    const task = this.demoTasks[0] // syntax error task
    
    // Assign task to available fixer
    const assignmentMessage = {
      id: `assign-${Date.now()}`,
      type: MessageType.TASK_ASSIGNMENT,
      from: 'core-fix-coordinator-1',
      to: 'core-fix-fixer-1',
      priority: Priority.HIGH,
      timestamp: Date.now(),
      data: {
        task: task,
        assignment_reason: 'Best match for syntax error specialization',
        deadline: Date.now() + 3600000 // 1 hour
      },
      requires_confirmation: true
    }
    
    console.log(`📤 Assigning ${task.type} task to core-fix-fixer-1...`)
    this.gun.get('messages/direct/core-fix-fixer-1').put(assignmentMessage)
    
    // Update task status
    this.gun.get(`tasks/${task.id}`).put({
      ...task,
      status: 'assigned',
      assigned_to: 'core-fix-fixer-1',
      assigned_at: Date.now()
    })
    
    // Simulate task progress updates
    setTimeout(() => {
      console.log('📊 Task progress update: 25% complete')
      this.gun.get(`tasks/${task.id}`).put({
        status: 'in_progress',
        progress: 25,
        last_update: Date.now()
      })
    }, 1500)
    
    setTimeout(() => {
      console.log('📊 Task progress update: 75% complete')
      this.gun.get(`tasks/${task.id}`).put({
        status: 'in_progress',
        progress: 75,
        last_update: Date.now()
      })
    }, 2500)
    
    setTimeout(() => {
      console.log('✅ Task completed successfully!')
      this.gun.get(`tasks/${task.id}`).put({
        status: 'completed',
        progress: 100,
        completed_at: Date.now(),
        result: {
          success: true,
          changes_made: ['Fixed missing semicolons', 'Corrected bracket matching'],
          files_modified: task.data.affected_files
        }
      })
    }, 3500)
    
    await new Promise(resolve => setTimeout(resolve, 4000))
    console.log('✅ Task assignment and execution demonstrated!')
  }

  private async demonstrateCoordination(): Promise<void> {
    console.log('')
    console.log('🤝 Feature 3: Cross-Team Coordination')
    console.log('--------------------------------------')
    
    // Simulate a cross-team coordination scenario
    const coordinationRequest = {
      id: `coord-${Date.now()}`,
      type: MessageType.COLLABORATION_REQUEST,
      from: 'core-fix-coordinator-1',
      to: 'integration-coordinator-1',
      priority: Priority.HIGH,
      timestamp: Date.now(),
      data: {
        collaboration_type: 'cross_team_fix',
        issue: 'Fix affects multiple packages',
        packages_affected: ['composer', 'builder'],
        requires_integration_testing: true
      }
    }
    
    console.log('📤 Requesting cross-team collaboration...')
    this.gun.get('messages/direct/integration-coordinator-1').put(coordinationRequest)
    
    // Simulate response
    setTimeout(() => {
      const response = {
        id: `coord-resp-${Date.now()}`,
        type: MessageType.COORDINATION_RESPONSE,
        from: 'integration-coordinator-1',
        to: 'core-fix-coordinator-1',
        priority: Priority.HIGH,
        timestamp: Date.now(),
        data: {
          collaboration_accepted: true,
          integration_test_scheduled: Date.now() + 1800000, // 30 minutes
          resource_allocation: ['integration-tester-1'],
          estimated_completion: Date.now() + 3600000 // 1 hour
        }
      }
      
      console.log('📨 Collaboration accepted by integration team!')
      this.gun.get('messages/direct/core-fix-coordinator-1').put(response)
    }, 1000)
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('✅ Cross-team coordination demonstrated!')
  }

  private async demonstrateDashboardUpdates(): Promise<void> {
    console.log('')
    console.log('📊 Feature 4: Real-time Dashboard Updates')
    console.log('------------------------------------------')
    
    // Update dashboard with system metrics
    const dashboardUpdate = {
      timestamp: Date.now(),
      system_health: {
        total_agents: this.demoAgents.length,
        active_agents: this.demoAgents.length - 1, // One busy
        total_tasks: this.demoTasks.length,
        completed_tasks: 1,
        pending_tasks: this.demoTasks.length - 1
      },
      team_status: {
        'core-fix': { active: 3, busy: 1, available: 2 },
        'integration': { active: 1, busy: 0, available: 1 },
        'feature-dev': { active: 1, busy: 0, available: 1 }
      },
      live_metrics: {
        messages_per_minute: 15,
        avg_response_time: 250,
        success_rate: 96.5,
        system_uptime: Date.now() - (Date.now() - 3600000) // 1 hour
      }
    }
    
    console.log('📈 Updating dashboard with live metrics...')
    this.gun.get('dashboard/live_metrics').put(dashboardUpdate)
    
    // Add activity log entries
    const activities = [
      'Task syntax-error-1 assigned to core-fix-fixer-1',
      'Cross-team collaboration requested between core-fix and integration',
      'Integration test scheduled for 30 minutes',
      'System health check completed - all agents responsive'
    ]
    
    activities.forEach((activity, index) => {
      setTimeout(() => {
        const logEntry = {
          id: `log-${Date.now()}-${index}`,
          timestamp: Date.now(),
          level: 'info',
          message: activity,
          source: 'system'
        }
        
        console.log(`📝 Activity logged: ${activity}`)
        this.gun.get('logs/activity').put(logEntry)
      }, index * 500)
    })
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    console.log('✅ Dashboard updates demonstrated!')
  }

  private async demonstrateEmergencyResponse(): Promise<void> {
    console.log('')
    console.log('🚨 Feature 5: Emergency Response System')
    console.log('----------------------------------------')
    
    // Simulate critical system alert
    const emergencyAlert = {
      id: `emergency-${Date.now()}`,
      type: MessageType.SYSTEM_ALERT,
      from: 'meta-orchestrator-1',
      priority: Priority.EMERGENCY,
      timestamp: Date.now(),
      data: {
        severity: 'critical',
        alert_type: 'system_failure',
        description: 'Air database connection lost',
        requires_immediate_attention: true,
        affected_systems: ['agent-communication', 'task-queue', 'dashboard']
      }
    }
    
    console.log('🚨 EMERGENCY: Critical system alert triggered!')
    this.gun.get('messages/system').put(emergencyAlert)
    
    // Simulate emergency response
    setTimeout(() => {
      console.log('⚡ Emergency response: All agents notified')
      console.log('⚡ Emergency response: Self-healing initiated')
      console.log('⚡ Emergency response: Backup communication channel activated')
    }, 500)
    
    setTimeout(() => {
      const recoveryMessage = {
        id: `recovery-${Date.now()}`,
        type: MessageType.SYSTEM_ALERT,
        from: 'meta-orchestrator-1',
        priority: Priority.HIGH,
        timestamp: Date.now(),
        data: {
          severity: 'resolved',
          alert_type: 'system_recovery',
          description: 'Air database connection restored',
          recovery_time: 30, // seconds
          affected_systems_restored: ['agent-communication', 'task-queue', 'dashboard']
        }
      }
      
      console.log('✅ RECOVERY: System restored to normal operation')
      this.gun.get('messages/system').put(recoveryMessage)
    }, 2000)
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    console.log('✅ Emergency response system demonstrated!')
  }

  private async cleanup(): Promise<void> {
    console.log('')
    console.log('🧹 Cleaning up demonstration data...')
    
    // Clean up demo agents
    for (const agentId of this.demoAgents) {
      const [teamId, role] = agentId.split('-')
      this.gun.get(`agents/${teamId}/${role}/${agentId}`).put(null)
    }
    
    // Clean up demo tasks
    for (const task of this.demoTasks) {
      this.gun.get(`tasks/${task.id}`).put(null)
    }
    
    console.log('✅ Cleanup completed')
  }

  private getSpecialization(role: string): string {
    const specializations = {
      'coordinator': 'error analysis, fix planning, and task coordination',
      'fixer': 'bug fixes, test repairs, and code corrections',
      'integrator': 'package integration and dependency resolution',
      'developer': 'feature implementation and code development',
      'orchestrator': 'system architecture understanding and multi-agent orchestration'
    }
    
    return specializations[role] || 'general purpose agent'
  }

  private getCapabilities(role: string): string[] {
    const capabilities = {
      'coordinator': ['planning', 'task_allocation', 'team_management', 'error_analysis'],
      'fixer': ['bug_fixing', 'test_repair', 'code_correction', 'syntax_fixing'],
      'integrator': ['package_integration', 'dependency_resolution', 'compatibility_testing'],
      'developer': ['feature_implementation', 'code_development', 'architecture_design'],
      'orchestrator': ['system_coordination', 'cross_team_management', 'strategic_planning']
    }
    
    return capabilities[role] || ['task_execution', 'status_reporting']
  }
}

// CLI interface
async function main() {
  const demo = new AgentSystemDemo()
  
  try {
    await demo.runDemo()
  } catch (error) {
    console.error('❌ Demo failed:', error.message)
    console.log('')
    console.log('💡 Make sure Air is running:')
    console.log('   cd projects/air && npm start')
    process.exit(1)
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Air-based Living Agent System Demo')
  console.log('')
  console.log('Usage: tsx demo.ts')
  console.log('')
  console.log('This demo shows:')
  console.log('• Real-time agent messaging via Air/GUN')
  console.log('• Intelligent task assignment and tracking')
  console.log('• Cross-team coordination protocols')
  console.log('• Live dashboard updates')
  console.log('• Emergency response systems')
  console.log('')
  console.log('Requirements:')
  console.log('• Air server running on port 8765')
  console.log('• GUN database accessible')
  process.exit(0)
}

// Run demo
main().catch(console.error)