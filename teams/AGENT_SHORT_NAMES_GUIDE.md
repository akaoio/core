# Agent Short Names Guide

## Overview
The @akaoio/core workspace now features short names for all 34 agents, making it much easier to invoke specific agents. Instead of typing long names like `team-team-composer-architect`, you can simply use `comp-arch`.

## Quick Reference - All Agents

### Core System Teams (7 agents)
| Short Name   | Full Name                    | Team      | Role         | Purpose                    |
|--------------|------------------------------|-----------|--------------|----------------------------|
| `meta-orch`  | team-meta-orchestrator      | meta      | orchestrator | System coordination        |
| `fix-coord`  | team-core-fix-coordinator   | core-fix  | coordinator  | Bug fix planning           |
| `fix-er`     | team-core-fix-fixer         | core-fix  | fixer        | Bug fixing & repairs       |
| `int-coord`  | team-integration-coordinator| integration| coordinator | Integration planning       |
| `int-er`     | team-integration-integrator | integration| integrator  | Package integration        |
| `feat-coord` | team-feature-dev-coordinator| feature-dev| coordinator | Feature planning           |
| `feat-dev`   | team-feature-dev-developer  | feature-dev| developer   | Feature implementation     |

### Security & Quality (6 agents)
| Short Name      | Full Name                  | Team      | Role      | Purpose                    |
|-----------------|---------------------------|-----------|-----------|----------------------------|
| `sec-audit`     | team-security-auditor     | security  | auditor   | Security analysis          |
| `sec-hard`      | team-security-hardener    | security  | hardener  | System hardening           |
| `guard-inspect` | team-integrity-inspector  | integrity | inspector | Code quality inspection    |
| `guard-enforce` | team-integrity-enforcer   | integrity | enforcer  | Quality enforcement        |
| `guard-valid`   | team-integrity-validator  | integrity | validator | Test validation            |
| `guard-watch`   | team-integrity-sentinel   | integrity | sentinel  | Continuous monitoring      |

### Project Technology Teams (21 agents)

#### Access Team (Eternal Infrastructure)
| Short Name    | Full Name                    | Role       | Purpose                    |
|---------------|------------------------------|------------|----------------------------|
| `access-keep` | team-team-access-maintainer | maintainer | Shell infrastructure       |
| `access-guard`| team-team-access-guardian   | guardian   | System stability           |
| `access-opt`  | team-team-access-optimizer  | optimizer  | Performance tuning         |

#### Composer Team (Documentation Engine)  
| Short Name   | Full Name                        | Role       | Purpose                    |
|--------------|----------------------------------|------------|----------------------------|
| `comp-arch`  | team-team-composer-architect    | architect  | Template engine design     |
| `comp-dev`   | team-team-composer-developer    | developer  | Feature implementation     |
| `comp-link`  | team-team-composer-integrator   | integrator | Atom integration           |

#### Battle Team (Testing Framework)
| Short Name  | Full Name                      | Role      | Purpose                    |
|-------------|--------------------------------|-----------|----------------------------|
| `bat-arch`  | team-team-battle-architect    | architect | PTY architecture           |
| `bat-dev`   | team-team-battle-developer    | developer | Test implementation        |
| `bat-test`  | team-team-battle-validator    | validator | Test coverage              |

#### Builder Team (Build Framework)
| Short Name   | Full Name                       | Role      | Purpose                    |
|--------------|--------------------------------|-----------|----------------------------|
| `build-arch` | team-team-builder-architect    | architect | Build system design        |
| `build-dev`  | team-team-builder-developer    | developer | Build features             |
| `build-opt`  | team-team-builder-optimizer    | optimizer | Build optimization         |

#### Air Team (P2P Database)
| Short Name   | Full Name                   | Role      | Purpose                    |
|--------------|----------------------------|-----------|----------------------------|
| `air-arch`   | team-team-air-architect    | architect | P2P architecture           |
| `air-dev`    | team-team-air-developer    | developer | Real-time sync             |
| `air-guard`  | team-team-air-guardian     | guardian  | Data integrity             |

#### TUI Team (Terminal UI)
| Short Name    | Full Name                      | Role          | Purpose                    |
|---------------|--------------------------------|---------------|----------------------------|
| `tui-design`  | team-team-tui-designer        | designer      | UI/UX design               |
| `tui-dev`     | team-team-tui-developer       | developer     | Component implementation   |
| `tui-access`  | team-team-tui-accessibility   | accessibility | Screen reader support      |

#### UI Team (Web Components)
| Short Name   | Full Name                    | Role      | Purpose                    |
|--------------|------------------------------|-----------|----------------------------|
| `ui-arch`    | team-team-ui-architect      | architect | Web Components design      |
| `ui-dev`     | team-team-ui-developer      | developer | Component development      |
| `ui-design`  | team-team-ui-designer       | designer  | Theming system             |

## How to Use Short Names

### Basic Invocation
Instead of:
```
I need the team-meta-orchestrator agent to help with system coordination
```

Use:
```  
I need meta-orch to help with system coordination
```

### Context-Based Activation
Short names work with context activation too:
```
fix-coord, I have multiple bugs that need coordination
comp-arch, I need help designing a new template system
guard-inspect, please scan the codebase for fake code
```

### Team-Based Requests
You can still use team triggers, but agents will identify with short names:
```
User: "I need composer help"
System: "Activating comp-arch (team-team-composer-architect) for composer tasks"
```

## Backward Compatibility

✅ **Full names still work**: All existing agent calls continue to function  
✅ **Team triggers work**: Team-based activation still routes to correct agents  
✅ **Context detection**: System still auto-detects which agent to use  
✅ **Mixed usage**: You can mix short names and full names in the same session  

## Design Principles

### Naming Convention
1. **Technology prefix** for project teams: `access-`, `comp-`, `bat-`, `build-`, `air-`, `tui-`, `ui-`
2. **Role suffix** abbreviated: `coord`, `dev`, `arch`, `opt`, `guard`, etc.
3. **Special prefixes**: `meta-` for system, `fix-` for core fixes, `guard-` for integrity
4. **Maximum 2-3 segments** for easy typing and remembering

### Role Abbreviations Guide
- `coord` = coordinator
- `dev` = developer
- `arch` = architect
- `er` = fixer/integrator (action roles)
- `orch` = orchestrator
- `audit` = auditor
- `hard` = hardener
- `inspect` = inspector
- `enforce` = enforcer
- `valid` = validator
- `watch` = sentinel
- `keep` = maintainer
- `guard` = guardian
- `opt` = optimizer
- `link` = integrator (for composer)
- `test` = validator/tester
- `design` = designer
- `access` = accessibility

## Technical Implementation

### Agent Files Updated
- All 34 agent files now include `shortName` metadata
- Agent templates include short name usage instructions
- Examples in agent descriptions use short names

### Configuration Files
- `/.claude/team.config.yaml`: Updated with `shortName` field for each member
- `/teams/agent-short-names.json`: Complete mapping system
- `/teams/generate-with-composer.cjs`: Enhanced to support short names
- `/teams/templates/agent-composer.hbs`: Template includes short name sections

### Mapping System
The mapping system provides:
- `shortToFull`: Quick lookup from short name to full name
- `fullToShort`: Reverse lookup for backward compatibility  
- `categories`: Organized by technology/team
- `agentList`: Complete agent metadata

## Examples by Use Case

### Bug Fixing
```
fix-coord   # Plan and coordinate bug fixes
fix-er      # Actually fix the bugs
```

### Feature Development
```
feat-coord  # Plan and coordinate new features
feat-dev    # Implement the features
```

### Integration Work  
```
int-coord   # Plan cross-package integration
int-er      # Handle the actual integration
```

### Composer Work
```
comp-arch   # Design template architecture
comp-dev    # Develop template features  
comp-link   # Handle atom integration
```

### Quality Assurance
```
guard-inspect  # Inspect code quality
guard-enforce  # Enforce standards
guard-valid    # Validate tests
guard-watch    # Monitor continuously  
```

### System Orchestration
```
meta-orch   # System-wide coordination and explanation
```

## Benefits

✅ **Faster typing**: 60-80% reduction in characters  
✅ **Better UX**: Much easier to remember and use  
✅ **Unique names**: No conflicts across all teams  
✅ **Intuitive**: Technology prefix + role makes sense  
✅ **Backward compatible**: Full names still work  
✅ **Organized**: Clear categorization by technology  
✅ **Professional**: Follows industry naming conventions  

## Migration Path

1. **Immediate**: Start using short names for new requests
2. **Gradual**: Mix short names with existing patterns  
3. **Full adoption**: Eventually prefer short names for efficiency
4. **Documentation**: Update any automation to use short names

The short name system is now fully deployed and ready for use across all 34 agents!