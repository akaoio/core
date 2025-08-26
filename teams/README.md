# Multi-Team System for @akaoio/core

## Overview
This is a **composer-compatible** team collaboration system that generates Claude Code agents for coordinated development work.

## Architecture

```
teams/
├── components/       # Atomic building blocks (5-15 lines each)
│   ├── identity.md   # Agent identity template
│   ├── awareness.md  # System awareness instructions
│   ├── protocol.md   # Communication protocol
│   ├── coordination.md # Team coordination rules
│   └── activation.md # Activation context
├── roles/           # Role definitions (YAML)
│   ├── coordinator.yaml
│   ├── fixer.yaml
│   └── integrator.yaml
├── templates/       # Handlebars templates
│   └── agent.hbs    # Main agent template
├── composer.config.js # Composer configuration (ready for future)
└── generate-agents.cjs # Current generation script
```

## Key Features

✅ **100% Composer Compatible**
- All source files follow Composer conventions
- Handlebars template ready
- composer.config.js prepared for future migration

✅ **Atomic Components**
- Each component is extremely short (5-15 lines)
- But generates comprehensive agents (200+ lines)
- Reusable across different team configurations

✅ **Claude Code Compatible**
- Proper frontmatter with `description` field
- Uses `<example>` and `<commentary>` tags
- Follows Claude subagent standards

## Current Implementation

### Generate Agents (Current Method)
```bash
node teams/generate-agents.cjs
```

### Future Method (When Composer is Stable)
```bash
npx @akaoio/composer build --config teams/composer.config.js
```

## How It Works

1. **Components** are loaded from `teams/components/*.md`
2. **Roles** are loaded from `teams/roles/*.yaml`
3. **Team config** is loaded from `.claude/team.config.yaml`
4. **Template** processes all data to generate agents
5. **Agents** are saved to `.claude/agents/`

## Team Structure

### Core-Fix Team
- **Trigger**: "làm việc", "fix", "sửa"
- **Members**: coordinator + 2 fixers
- **Purpose**: Fix failing tests and build errors

### Integration Team
- **Trigger**: "tích hợp", "integrate"
- **Members**: coordinator + integrator + fixer
- **Purpose**: Cross-package compatibility

### Feature-Dev Team
- **Trigger**: "tính năng", "feature"
- **Members**: architect + developer + tester
- **Purpose**: New feature development

## Workspace Isolation

Each team works in isolated workspace:
```
tmp/teams/
├── core-fix-{timestamp}/
├── integration-{timestamp}/
└── feature-dev-{timestamp}/
```

## Activation Protocol

1. User says **"làm việc"**
2. System analyzes context
3. Appropriate team activates
4. All members work in parallel
5. Coordinate through status files

## Status Tracking

```
tmp/teams/
├── STATUS.md       # Global status
├── BLOCKERS.md     # Current blockers
└── DISCOVERIES.md  # Shared knowledge
```

## Testing Composer Compatibility

```bash
node teams/test-composer-compat.js
```

This verifies that all components are ready for Composer.

## Migration Path

When @akaoio/composer is stable:

1. Install composer: `npm install @akaoio/composer`
2. Run: `npx @akaoio/composer build --config teams/composer.config.js`
3. Delete: `teams/generate-agents.cjs` (no longer needed)

## Benefits

- **Zero coupling**: Works now with simple script
- **Future ready**: 100% compatible with Composer
- **Atomic design**: Components are tiny but powerful
- **Real implementation**: No fake logic, actual working agents
- **Claude compatible**: Follows all Claude Code standards

---

*This system is designed to work TODAY while being ready for TOMORROW when Composer is stable.*