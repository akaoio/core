# Multi-Agent System Architecture - Living Ecosystem Design

## System Overview
The @akaoio/core multi-agent system is a revolutionary approach to software development featuring 34 specialized agents across 13 teams, all connected through an Air-based Living Agent System.

## Team Structure
- **meta**: System understanding and orchestration (meta agent)
- **core-fix**: Bug fixes and error resolution (fix, repair agents)
- **integration**: Cross-package compatibility (link, bridge agents)
- **feature-dev**: New feature development (feat, build agents)
- **security**: Security analysis and hardening (audit, shield agents)
- **integrity**: Code quality enforcement (guard, enforce, check, watch agents)
- **Project teams**: Specialized teams for each core technology (access, composer, battle, builder, air, tui, ui)

## Agent Generation Process
1. Configuration in `.claude/team.config.yaml` defines teams and roles
2. Template `teams/templates/agent-composer.hbs` defines agent structure
3. Generation script `teams/generate-with-composer.cjs` processes templates using @akaoio/composer
4. Enhanced Composer Template engine with Handlebars helpers creates agents
5. Output agents are saved to `.claude/agents/` directory

## Self-Referential Nature
- Meta agent understands the system that created it
- Meta agent can explain how other agents work
- Meta agent knows the template system and can help modify it
- Meta agent is the system's self-awareness component

## Air-Based Living Agent System
Revolutionary features:
- **Real-Time Communication**: Direct agent-to-agent messaging via GUN database (port 8765)
- **Autonomous Processing**: Independent task execution with real-time updates
- **Distributed Memory**: Shared persistent state via GUN distributed database
- **Event-Driven Architecture**: React to real-time events from other agents

## Stories System Integration
- **Knowledge Preservation**: Stories capture collective insights and principles
- **Meta Agent Primary Responsibility**: Story management and organization
- **All Agents Aware**: Stories provide context for decisions across the ecosystem
- **Conversation Integration**: Every discussion updates or creates stories

## Vision
This architecture represents a paradigm shift toward truly collaborative AI systems where specialized agents work together autonomously, preserve collective knowledge, and evolve the system continuously. The self-referential nature ensures the system can understand, modify, and improve itself.

The stories system ensures continuity of vision and prevents loss of critical insights, making this a truly learning and evolving ecosystem.

---
*Story captured from system architecture discussions and multi-agent coordination design*