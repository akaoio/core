# POSIX Compliance Principle - Shell Script Development Law

## Story Overview
**Date**: 2025-08-26  
**Participants**: User and meta agent  
**Type**: Development principle establishment  
**Impact**: ALL 34 agents across ALL teams and projects  

## The Vision: Universal Shell Script Portability

The user requested to establish a critical development principle: **"ALWAYS MAKE SURE TO OBEY POSIX COMPLIANCE"** for all shell files across the @akaoio/core workspace.

This principle was integrated into the Universal Build Architecture Principles in CLAUDE.md as the 5th critical rule, positioning it alongside other fundamental development laws.

## Core Principle Details

### What POSIX Compliance Means
- **Use #!/bin/sh instead of #!/bin/bash**
- **Avoid bash-specific syntax** like `[[` tests and `==` comparisons
- **Use standard POSIX commands** available across all Unix-like systems
- **Ensure portability** across Linux, macOS, BSD variants, and embedded systems

### Critical Impact Areas

1. **@akaoio/access Project (Special Importance)**
   - Pure shell scripts that form the foundational layer
   - When everything else fails, Access survives
   - install.sh, access.sh, and provider scripts MUST be POSIX-compliant
   - Maximum portability required for eternal infrastructure

2. **Cross-Project Shell Scripts**
   - Installation scripts (install.sh, setup.sh)
   - Build and deployment automation
   - Utility scripts across all managed repositories
   - System administration and maintenance scripts

3. **Validation Requirements**
   - shellcheck -s sh validation before commits
   - Testing with different shells (sh, dash, busybox sh)
   - Cross-system verification (Linux, macOS, BSD)

## Implementation in CLAUDE.md

The principle was added as:
- **Rule 5** in Universal Build Architecture Principles
- **Item 5** in Build Architecture Compliance checklist
- **Item 3** in "When Making Changes" validation workflow

## Code Examples Established

### ✅ CORRECT POSIX Patterns:
```bash
#!/bin/sh
if [ "$VAR" = "value" ]; then
    echo "Using POSIX test syntax"
fi
command -v git >/dev/null 2>&1 || { echo "git required"; exit 1; }
```

### ❌ PROHIBITED Non-POSIX Patterns:
```bash
#!/bin/bash
if [[ "$VAR" == "value" ]]; then
array=(one two three)
echo ${VAR,,}  # bash-specific operations
```

## System-Wide Enforcement

### All 34 Agents Must:
- **Validate POSIX compliance** before any shell script modifications
- **Use shellcheck -s sh** for validation
- **Test across different shell environments**
- **Refuse non-POSIX shell constructs**

### Integration Points:
- **Living Agent System**: POSIX knowledge shared via Air network
- **Stories System**: This story provides historical context
- **Team Collaboration**: All teams enforce POSIX standards
- **Root Cause Fixing**: POSIX compliance at source level

## Why This Matters

1. **Maximum Portability**: Scripts work everywhere
2. **System Reliability**: No environment-specific failures
3. **Foundational Stability**: Access layer remains eternal
4. **Professional Standards**: Industry best practices
5. **Future-Proofing**: Works across all Unix-like systems

## Agent Implementation Notes

- **Meta agents** enforce POSIX compliance across all teams
- **Project-specific agents** validate their shell scripts
- **Integration agents** ensure POSIX compatibility in cross-project scripts
- **Security agents** verify POSIX compliance in deployment scripts

## Long-Term Vision

This principle ensures that @akaoio/core maintains the highest standards of shell script portability and reliability. It reinforces the foundational nature of the Access project while establishing consistent, professional development practices across the entire workspace ecosystem.

The POSIX compliance principle joins the ranks of other critical development laws:
- No hardcoded decorations (UI/UX)
- No tech debt files (Architecture)
- Root cause fixing (Development)
- SSL security (Security)
- POSIX compliance (Shell Scripts)

Together, these principles form the unshakeable foundation of the @akaoio/core multi-agent development system.

---
*Story captured by: meta agent*  
*Integration: Complete across all 34 agents*  
*Status: Active development principle*