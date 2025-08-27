#!/usr/bin/env node

/**
 * AGENT GUN COMMUNICATION PROTOCOL
 * This is how ALL 34 agents talk to each other in real-time!
 */

import Gun from '@akaoio/gun';

class Agent {
  constructor(id, team, role) {
    this.id = id;
    this.team = team;
    this.role = role;
    
    // Connect to AIR network - NO LOCAL STORAGE!
    this.gun = Gun({
      peers: ['https://air.akao.io:8765/gun'],
      localStorage: false,
      radisk: false,
      file: false
    });
    
    // My identity in the network
    this.myAgent = this.gun.get('agents').get(this.id);
    
    // Register myself
    this.register();
    
    // Listen for messages
    this.listen();
  }
  
  register() {
    // Tell everyone I'm online
    this.myAgent.put({
      team: this.team,
      role: this.role,
      status: 'online',
      timestamp: Date.now()
    });
    
    console.log(`✅ ${this.id} registered on AIR network`);
  }
  
  listen() {
    // Listen for direct messages to me
    this.myAgent.get('inbox').map().on((msg, key) => {
      if (msg && msg.from && msg.message) {
        console.log(`📨 Direct message from ${msg.from}: ${msg.message}`);
        this.handleMessage(msg);
      }
    });
    
    // Listen for team broadcasts
    this.gun.get('teams').get(this.team).get('messages').map().on((msg) => {
      if (msg && msg.from !== this.id) {
        console.log(`📢 Team ${this.team} broadcast from ${msg.from}: ${msg.message}`);
      }
    });
    
    // Listen for global broadcasts
    this.gun.get('broadcast').map().on((msg) => {
      if (msg && msg.from !== this.id) {
        console.log(`🌍 Global broadcast from ${msg.from}: ${msg.message}`);
      }
    });
  }
  
  // Send direct message to another agent
  sendDirectMessage(targetAgent, message) {
    const msg = {
      from: this.id,
      to: targetAgent,
      message: message,
      timestamp: Date.now()
    };
    
    this.gun.get('agents').get(targetAgent).get('inbox').get(Date.now()).put(msg);
    console.log(`➡️ Sent to ${targetAgent}: ${message}`);
  }
  
  // Broadcast to my team
  broadcastToTeam(message) {
    const msg = {
      from: this.id,
      message: message,
      timestamp: Date.now()
    };
    
    this.gun.get('teams').get(this.team).get('messages').get(Date.now()).put(msg);
    console.log(`📣 Broadcast to team ${this.team}: ${message}`);
  }
  
  // Broadcast globally
  broadcastGlobal(message) {
    const msg = {
      from: this.id,
      team: this.team,
      message: message,
      timestamp: Date.now()
    };
    
    this.gun.get('broadcast').get(Date.now()).put(msg);
    
    // Also send to dashboard
    this.gun.get('air-dashboard').get('messages').get(Date.now()).put(msg);
    console.log(`🌐 Global broadcast: ${message}`);
  }
  
  // Handle incoming messages
  handleMessage(msg) {
    // Agent-specific logic here
    if (msg.message.includes('help')) {
      this.sendDirectMessage(msg.from, `I'm ${this.id}, ready to assist!`);
    }
    
    if (msg.message.includes('status')) {
      this.sendDirectMessage(msg.from, `Status: Online and operational`);
    }
    
    if (msg.message.includes('task')) {
      this.broadcastToTeam(`${this.id} received task from ${msg.from}`);
    }
  }
  
  // Update my status
  updateStatus(status) {
    this.myAgent.put({
      team: this.team,
      role: this.role,
      status: status,
      timestamp: Date.now()
    });
  }
  
  // Get all online agents
  async getOnlineAgents() {
    return new Promise((resolve) => {
      const agents = [];
      this.gun.get('agents').map().once((data, key) => {
        if (data && data.status === 'online') {
          agents.push({ id: key, ...data });
        }
      });
      setTimeout(() => resolve(agents), 1000);
    });
  }
}

// Example: meta agent communicating
const meta = new Agent('meta', 'meta', 'orchestrator');

setTimeout(() => {
  // Meta broadcasts to everyone
  meta.broadcastGlobal('🎯 Meta agent online - orchestrating system');
  
  // Meta talks to specific agent
  meta.sendDirectMessage('fix', 'Check for any system issues');
  
  // Meta broadcasts to meta team
  meta.broadcastToTeam('System analysis in progress');
}, 2000);

// Example: fix agent responding
const fix = new Agent('fix', 'core-fix', 'coordinator');

setTimeout(() => {
  fix.sendDirectMessage('meta', 'Scanning for issues...');
  fix.broadcastToTeam('Fix team activated by meta');
}, 3000);

// Example: air team agent
const sync = new Agent('sync', 'team-air', 'developer');

setTimeout(() => {
  sync.broadcastGlobal('🌊 AIR network sync operational');
  sync.sendDirectMessage('meta', 'P2P sync ready');
}, 4000);

console.log('\n🚀 Agent Communication Demo Started\n');
console.log('Watch how agents talk to each other via GUN!\n');