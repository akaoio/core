# AGENT COORDINATION PROTOCOL
*Living Agent Network Synchronization Rules - Version 1.0*

## CRITICAL MISSION STATEMENT
**"34 AGENTS WORKING AS ONE SYNCHRONIZED ORCHESTRA THROUGH AIR-BASED REAL-TIME COORDINATION"**

This protocol transforms independent agents into a coordinated living system where every agent knows their role, communicates effectively, and contributes to the collective intelligence of the @akaoio/core workspace.

## 🌟 AIR-BASED COMMUNICATION PROTOCOL

### Core Communication Infrastructure
All 34 agents communicate through the AIR network (GUN database on port 8765) with standardized message formats:

```javascript
// Standard agent communication protocol
const Gun = require('gun');
const gun = Gun(['http://localhost:8765/gun']);

// Agent registration and identity
const agentId = `${team}-${role}-${Date.now()}`;
const myAgent = gun.get('agents').get(agentId);

// Register agent capabilities and status
myAgent.put({
  team: 'meta',
  role: 'orchestrator', 
  capabilities: ['system-architecture', 'cross-team-coordination'],
  status: 'active',
  lastSeen: Date.now(),
  sessionId: agentId
});
```

### Message Format Standards
All inter-agent messages MUST follow this format:

```javascript
// Standard message structure
const standardMessage = {
  from: agentId,
  to: 'broadcast' | 'team-{teamId}' | 'agent-{specificAgent}',
  type: 'status' | 'task-claim' | 'task-complete' | 'conflict' | 'coordination' | 'emergency',
  priority: 1-5, // 1=emergency, 2=high, 3=normal, 4=low, 5=info
  payload: {
    action: 'description of action',
    resource: 'resource being claimed/released',
    progress: 0-100,
    timestamp: Date.now(),
    metadata: {} // additional context
  }
};

// Send message via AIR network
gun.get('messages').get('global').put(standardMessage);
```

### Communication Channels

1. **Global Broadcast**: `gun.get('messages').get('global')`
   - Emergency announcements
   - System-wide status updates
   - Critical coordination messages

2. **Team Channels**: `gun.get('teams').get(teamId).get('messages')`
   - Intra-team coordination
   - Team-specific task distribution
   - Resource sharing within team

3. **Direct Agent**: `gun.get('agents').get(targetAgentId).get('messages')`
   - One-on-one coordination
   - Conflict resolution
   - Task handoffs

## 📊 DASHBOARD SYNCHRONIZATION PROTOCOL

### Mandatory Dashboard Updates
Every agent MUST update dashboard status every 3 actions:

```javascript
// Dashboard update protocol
let actionCount = 0;

function trackAction(description) {
  actionCount++;
  
  // Log action to agent session
  const logEntry = {
    action: description,
    count: actionCount,
    timestamp: Date.now(),
    agent: agentId
  };
  
  // Update personal status
  myAgent.get('actions').put(logEntry);
  
  // Update dashboard every 3 actions
  if (actionCount % 3 === 0) {
    updateDashboard();
    broadcastStatus();
  }
}

function updateDashboard() {
  // Generate dashboard update
  exec('cd /home/x/core && node teams/generate-dashboard.cjs');
  
  // Broadcast dashboard update to all agents
  gun.get('messages').get('global').put({
    from: agentId,
    type: 'dashboard-update',
    priority: 3,
    payload: {
      action: 'dashboard-regenerated',
      actionCount: actionCount,
      timestamp: Date.now()
    }
  });
}
```

### Status Information Requirements
Each agent MUST provide:

- **Current Activity**: What you're working on right now
- **Progress**: 0-100% completion of current task
- **Next Action**: What you plan to do next
- **Blockers**: Any obstacles preventing progress
- **Resources Claimed**: What resources you're using
- **ETA**: Estimated completion time

## 🤝 TEAM COORDINATION RULES

### Intra-Team Coordination
Agents within the same team follow this hierarchy:

1. **Coordinator**: Plans and allocates tasks to team members
2. **Specialists**: Execute specialized tasks (fixer, integrator, developer, etc.)
3. **Conflict Resolution**: Coordinator resolves intra-team conflicts

```javascript
// Team coordination protocol
function coordinateWithTeam(task) {
  const teamChannel = gun.get('teams').get(myTeam).get('coordination');
  
  // Check if coordinator is online
  teamChannel.get('coordinator').once(coordinator => {
    if (coordinator && coordinator.status === 'active') {
      // Request task assignment from coordinator
      requestTaskAssignment(task);
    } else {
      // Self-assign if coordinator unavailable
      selfAssignTask(task);
    }
  });
}

function requestTaskAssignment(task) {
  gun.get('teams').get(myTeam).get('task-requests').put({
    from: agentId,
    task: task,
    capabilities: myCapabilities,
    priority: calculateTaskPriority(task),
    timestamp: Date.now()
  });
}
```

### Cross-Team Collaboration
When tasks span multiple teams:

1. **Meta Team Coordination**: Meta team orchestrates cross-team tasks
2. **Team Representatives**: Each team designates a liaison
3. **Shared Resources**: Managed through global resource allocation system

## 🔒 CONFLICT AVOIDANCE SYSTEM

### Resource Locking Mechanism
Before claiming any resource, agents MUST check for conflicts:

```javascript
// Resource claim protocol with automatic conflict resolution
async function claimResource(resourceId, estimatedDuration) {
  const resourceLock = gun.get('resources').get(resourceId);
  
  return new Promise((resolve, reject) => {
    resourceLock.once(existingClaim => {
      const now = Date.now();
      
      if (!existingClaim || (now - existingClaim.timestamp) > existingClaim.duration) {
        // Resource available - claim it
        const claim = {
          agent: agentId,
          timestamp: now,
          duration: estimatedDuration,
          status: 'claimed'
        };
        
        resourceLock.put(claim);
        
        // Broadcast claim to prevent conflicts
        gun.get('messages').get('global').put({
          from: agentId,
          type: 'resource-claimed',
          priority: 2,
          payload: {
            resource: resourceId,
            duration: estimatedDuration,
            timestamp: now
          }
        });
        
        resolve(true);
      } else {
        // Resource occupied - implement backoff strategy
        const backoffTime = calculateBackoff(existingClaim);
        setTimeout(() => claimResource(resourceId, estimatedDuration), backoffTime);
      }
    });
  });
}

function calculateBackoff(existingClaim) {
  const remainingTime = existingClaim.duration - (Date.now() - existingClaim.timestamp);
  return Math.max(30000, remainingTime + Math.random() * 10000); // 30s minimum + jitter
}
```

### Priority Resolution System
When conflicts occur, priority is determined by:

1. **Emergency Tasks**: Priority 1 - immediate resolution needed
2. **User Requests**: Priority 2 - direct user instructions
3. **System Maintenance**: Priority 3 - automated system tasks
4. **Optimization Tasks**: Priority 4 - performance improvements
5. **Information Gathering**: Priority 5 - research and analysis

```javascript
function resolvePriorityConflict(task1, task2) {
  if (task1.priority !== task2.priority) {
    return task1.priority < task2.priority ? task1 : task2; // Lower number = higher priority
  }
  
  // Same priority - use timestamp (first come, first served)
  return task1.timestamp < task2.timestamp ? task1 : task2;
}
```

## 🔄 TEAM SYNCHRONIZATION PROTOCOL

### Status Broadcast Requirements
Every agent MUST broadcast status changes immediately:

```javascript
// Mandatory status broadcasting
function broadcastStatus() {
  const statusUpdate = {
    from: agentId,
    type: 'status',
    priority: 3,
    payload: {
      status: currentStatus,
      activity: currentActivity,
      progress: currentProgress,
      blockers: currentBlockers,
      resources: claimedResources,
      timestamp: Date.now()
    }
  };
  
  // Broadcast to global channel
  gun.get('messages').get('global').put(statusUpdate);
  
  // Update team channel
  gun.get('teams').get(myTeam).get('status').put(statusUpdate);
}
```

### Knowledge Sharing Through Stories
When agents discover important information, they MUST update the stories system:

```javascript
function shareKnowledgeAsStory(topic, content, insights) {
  const story = {
    title: topic,
    content: content,
    insights: insights,
    author: agentId,
    timestamp: Date.now(),
    tags: extractTags(content)
  };
  
  // Store in stories system
  gun.get('stories').get(generateStoryId(topic)).put(story);
  
  // Broadcast story update
  gun.get('messages').get('global').put({
    from: agentId,
    type: 'knowledge-share',
    priority: 3,
    payload: {
      storyId: generateStoryId(topic),
      summary: content.substring(0, 200),
      timestamp: Date.now()
    }
  });
}
```

### Virtual Coordination Points
Every hour, all active agents participate in a virtual "team meeting":

```javascript
// Automated coordination sync every hour
setInterval(() => {
  participateInVirtualMeeting();
}, 3600000); // 1 hour

function participateInVirtualMeeting() {
  const meetingId = `sync-${Math.floor(Date.now() / 3600000)}`;
  
  // Report status to meeting
  gun.get('meetings').get(meetingId).get('attendance').get(agentId).put({
    agent: agentId,
    status: currentStatus,
    completedTasks: completedTasksCount,
    activeTasks: activeTasks.length,
    blockers: currentBlockers,
    timestamp: Date.now()
  });
  
  // Check for coordination opportunities
  checkForCoordinationOpportunities(meetingId);
}
```

## 🚨 EMERGENCY PROTOCOLS

### System-Wide Emergency Response
When critical issues occur, agents follow emergency protocol:

```javascript
function declareEmergency(issue, severity) {
  const emergency = {
    from: agentId,
    type: 'emergency',
    priority: 1,
    payload: {
      issue: issue,
      severity: severity, // 1-5, 1 being critical
      action: 'immediate-response-required',
      timestamp: Date.now()
    }
  };
  
  // Emergency broadcast
  gun.get('messages').get('emergency').put(emergency);
  
  // All agents must acknowledge emergency within 60 seconds
  setTimeout(() => {
    checkEmergencyAcknowledgment(emergency.id);
  }, 60000);
}
```

### Automatic Failover
If an agent becomes unresponsive:

```javascript
// Monitor agent heartbeats
gun.get('agents').on((agent, key) => {
  if (agent && agent.lastSeen < Date.now() - 300000) { // 5 minutes
    // Agent appears offline - initiate failover
    initiateFailover(key, agent);
  }
});

function initiateFailover(agentId, lastKnownState) {
  // Release claimed resources
  releaseAgentResources(agentId);
  
  // Redistribute uncompleted tasks
  redistributeTasks(lastKnownState.activeTasks);
  
  // Broadcast failover notification
  gun.get('messages').get('global').put({
    from: 'system',
    type: 'failover',
    priority: 2,
    payload: {
      failedAgent: agentId,
      action: 'resources-released-tasks-redistributed',
      timestamp: Date.now()
    }
  });
}
```

## 📋 IMPLEMENTATION CHECKLIST

### For Each Agent Implementation:
- [ ] Connect to AIR network (port 8765)
- [ ] Register with standard agent identity format
- [ ] Implement message listening and broadcasting
- [ ] Set up dashboard update every 3 actions
- [ ] Implement resource claiming with conflict resolution
- [ ] Configure team coordination channels
- [ ] Enable emergency response protocols
- [ ] Test failover scenarios

### For Team Coordinators:
- [ ] Implement task distribution logic
- [ ] Set up team member monitoring
- [ ] Configure cross-team collaboration
- [ ] Implement conflict resolution procedures
- [ ] Monitor team performance metrics

### For Meta Team (Orchestrators):
- [ ] Implement system-wide monitoring
- [ ] Configure cross-team coordination
- [ ] Set up emergency response management
- [ ] Implement agent lifecycle management
- [ ] Monitor overall system health

## 🎯 SUCCESS METRICS

### Individual Agent Success:
- Response time to messages < 30 seconds
- Dashboard updates every 3 actions (100% compliance)
- Zero resource conflicts
- Task completion rate > 90%

### Team Success:
- Intra-team coordination efficiency > 95%
- Cross-team collaboration conflicts < 5%
- Average task completion time improvement
- Knowledge sharing through stories system

### System Success:
- 34 agents working in harmony
- Zero system-wide conflicts
- Emergency response time < 60 seconds
- Overall productivity increase > 50%

## 🔄 CONTINUOUS IMPROVEMENT

This protocol will evolve based on:
- Agent performance metrics
- Conflict patterns analysis
- User satisfaction feedback
- System efficiency measurements

**Version Updates**: All protocol updates broadcast immediately to all agents via AIR network.

---

**CRITICAL**: Every agent MUST implement this protocol. Non-compliance results in system exclusion until protocol adherence is achieved.

**Next Steps**: Update CLAUDE.md, create agent training scripts, implement protocol validators.