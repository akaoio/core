# 🤖 Air-based Living Agent Runtime System

## 🚀 Revolutionary Concept: From Static Files to Living Processes

This system transforms the Claude multi-agent architecture from **simulation** to **REALITY** by creating persistent agent processes that communicate through Air's real-time GUN database.

## 🔥 What Makes This Revolutionary

### Before: Static Simulation
- Agents were just markdown files in `.claude/agents/`
- No real communication between agents
- Manual coordination through file system
- Limited to single Claude instance

### After: Living Agent System
- **REAL PROCESSES**: Each agent runs as persistent Node.js process
- **REAL-TIME COMMUNICATION**: Agents communicate via Air/GUN database
- **AUTONOMOUS COORDINATION**: Agents coordinate tasks independently
- **SELF-HEALING**: Automatic restart and recovery
- **LIVE DASHBOARD**: Real-time monitoring and metrics

## 🏗️ Architecture Overview

```
┌─ Air/GUN Database (Port 8765) ──────────────────────────┐
│  Real-time P2P database for agent communication         │
└─────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌─ Agent Process ┐ ┌─ Agent Process ┐ ┌─ Agent Process ┐
        │  Team: core-fix │ │ Team: feature │ │  Team: meta    │
        │  Role: coord    │ │ Role: dev     │ │ Role: orch     │
        │  Status: active │ │ Status: busy  │ │ Status: idle   │
        └─────────────────┘ └───────────────┘ └────────────────┘
```

## ⚡ Key Features

### 1. Real-time Agent Communication
- Event-driven messaging via GUN's `.on()` listeners
- Message types: tasks, coordination, status, alerts
- Priority-based message queuing
- Delivery confirmation system

### 2. Intelligent Task Assignment
- Automatic workload distribution
- Specialization-based routing
- Progress tracking and updates
- Failed task reassignment

### 3. Cross-team Coordination
- Inter-team message passing
- Resource sharing protocols
- Conflict resolution
- Emergency coordination

### 4. Self-healing System
- Agent health monitoring
- Automatic restart on failure
- Graceful degradation
- System recovery protocols

### 5. Live Dashboard
- Real-time agent status
- Task queue monitoring
- Performance metrics
- Activity feed

## 🚀 Quick Start

### Prerequisites
1. **Air server running**: 
   ```bash
   cd projects/air && npm start
   ```
   (Should be running on port 8765)

2. **Node.js/npm installed**

### Installation & Setup
```bash
# Setup the agent runtime system
npm run agents:setup

# Start all living agents
npm run agents:start

# Check agent status
npm run agents:status

# Open dashboard (in browser)
npm run agents:dashboard
```

### Manual Setup
```bash
cd teams/agent-runtime
npm install
npm run setup
npm start
```

## 📊 Dashboard Access

Open `teams/agent-runtime/dashboard/LiveAgentDashboard.html` in your browser to see:
- Real-time agent status
- Live task queue
- System metrics
- Activity feed

## 🎯 Usage Examples

### Running the Demo
```bash
cd teams/agent-runtime
tsx demo.ts
```

This demonstrates:
- Real-time messaging between agents
- Task assignment and execution
- Cross-team coordination
- Emergency response systems

### Creating Tasks Manually
```javascript
// Connect to Air
const gun = Gun(['http://localhost:8765/gun'])

// Create a task
const task = {
  id: 'fix-syntax-error-1',
  type: 'execute_fix',
  priority: 'high',
  data: {
    error_type: 'syntax_error',
    affected_files: ['src/main.ts'],
    description: 'Missing semicolons'
  },
  assigned_to: 'core-fix-fixer-1',
  created_at: Date.now()
}

// Store in task queue
gun.get(`tasks/${task.id}`).put(task)
```

### Monitoring Agent Status
```javascript
// Listen for agent updates
gun.get('agents').map().on((data, key) => {
  if (data && data.status) {
    console.log(`Agent ${key}: ${data.status}`)
  }
})
```

## 🏢 Team Structure

The system automatically creates living processes for these teams:

### Core-Fix Team
- **Coordinator**: Plans and coordinates bug fixes
- **Fixer**: Executes fixes and repairs

### Integration Team  
- **Coordinator**: Manages cross-package integration
- **Integrator**: Handles dependency resolution

### Feature-Dev Team
- **Coordinator**: Plans feature development
- **Developer**: Implements new features

### Meta Team
- **Orchestrator**: System-wide coordination

## 🔧 Agent Specializations

Each agent has specialized capabilities:

### Core-Fix Coordinator
- Error analysis and severity assessment
- Fix strategy planning
- Resource allocation
- Team coordination

### Core-Fix Fixer
- Syntax error fixing
- Type error resolution
- Import/export corrections
- Dependency issue resolution
- Test failure fixes

### Integration Coordinator
- Cross-package compatibility
- Dependency conflict resolution
- Integration test coordination

### Meta Orchestrator
- System architecture understanding
- Cross-team coordination
- Emergency response
- System health monitoring

## 📡 Message Protocol

Agents communicate using structured messages:

```typescript
interface Message {
  id: string
  type: MessageType
  from: string
  to?: string
  team?: string
  priority: Priority
  timestamp: number
  data: any
  requires_confirmation?: boolean
}
```

### Message Types
- `TASK_ASSIGNMENT`: Assign tasks to agents
- `COORDINATION_REQUEST`: Request team coordination
- `STATUS_REQUEST`: Request agent status
- `SYSTEM_ALERT`: Emergency alerts
- `HEARTBEAT`: Agent health checks

## 📊 Monitoring & Metrics

### Agent Metrics
- Tasks completed
- Success rate
- Average response time
- Current workload

### System Metrics
- Total agents active
- Message throughput
- System uptime
- Error rates

### Health Monitoring
- Agent heartbeat tracking
- Automatic restart on failure
- Resource usage monitoring
- Performance optimization

## 🚨 Emergency Systems

### Alert Types
- **Critical**: System failures requiring immediate attention
- **High**: Important issues affecting functionality
- **Medium**: General notifications
- **Low**: Informational messages

### Emergency Response
1. Immediate notification to all agents
2. Emergency task prioritization  
3. Resource reallocation
4. System recovery procedures

## 🔄 Self-healing Capabilities

### Agent Restart Policy
- Maximum 5 restart attempts
- Exponential backoff delay
- Persistent failure handling
- Graceful degradation

### System Recovery
- Automatic service restart
- Task queue preservation
- State recovery
- Connection restoration

## 🛠️ Development

### Adding New Agent Types
1. Create specialized agent class extending `LiveAgent`
2. Implement task execution methods
3. Add to launcher configuration
4. Update team.config.yaml

### Custom Message Handlers
```typescript
agent.messageProtocol.onMessage(MessageType.CUSTOM, async (message) => {
  // Handle custom message type
})
```

### Extending Dashboard
The dashboard uses real-time GUN listeners to update automatically when data changes.

## 🔍 Troubleshooting

### Air Connection Issues
```bash
# Check if Air is running
curl http://localhost:8765/gun

# Restart Air if needed
cd projects/air && npm start
```

### Agent Not Starting
```bash
# Check agent logs
npm run agents:status

# Restart specific agent
npm run agents:stop && npm run agents:start
```

### Dashboard Not Updating
- Ensure Air is running on port 8765
- Check browser console for errors
- Verify GUN connection in dashboard

## 🎯 Benefits Summary

1. **REAL AGENTS**: Actual persistent processes, not simulation
2. **REAL-TIME**: Instant communication and coordination  
3. **AUTONOMOUS**: Agents work independently
4. **SCALABLE**: Add agents without system restart
5. **RESILIENT**: Self-healing and recovery
6. **TRANSPARENT**: Full visibility via dashboard
7. **REVOLUTIONARY**: Transform multi-agent systems from concept to reality

---

**This system represents a fundamental breakthrough in multi-agent architecture, moving from static coordination to living, breathing agent ecosystems powered by Air's real-time database infrastructure.**