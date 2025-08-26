# Root Cause Fixing Principle - Absolute Development Law

## Core Principle
**"FIX THE ROOT CAUSE IN THE SOURCE CODE, NOT THE SYMPTOMS IN GENERATED FILES."**

This is the foundational development principle that ALL 34 agents across ALL teams must follow.

## Universal Application
- **ALL teams**: meta, core-fix, integration, feature-dev, security, project teams
- **ALL projects**: access, air, battle, builder, composer, tui, ui
- **ALL fixes**: bugs, features, configurations, documentation, security issues

## Root Cause Analysis Protocol
Before ANY fix, agents must:
1. **Identify the symptom**: What appears broken
2. **Trace to root cause**: What actually caused the problem
3. **Fix at source level**: Address the underlying issue
4. **Verify systematic solution**: Ensure problem cannot recur

## Anti-Patterns (IMMEDIATELY REJECT)
- ❌ Editing generated files instead of source files
- ❌ Manual patches instead of systematic fixes  
- ❌ Workarounds that ignore root causes
- ❌ Quick fixes that mask underlying problems
- ❌ Symptom treatment instead of disease cure
- ❌ Surface-level corrections without source analysis

## Source-Level Fix Examples
```bash
# ✅ CORRECT: Fix template source
# Problem: Generated agent files have errors
# Solution: Fix teams/templates/agent-composer.hbs (source)
# NOT: Edit individual agent files (generated artifacts)

# ✅ CORRECT: Fix configuration source  
# Problem: Package name duplication in documentation
# Solution: Fix YAML atoms in teams/components/
# NOT: Manually edit README files

# ✅ CORRECT: Fix TypeScript source
# Problem: Runtime errors in built JavaScript
# Solution: Fix .ts source files and rebuild
# NOT: Edit .js built artifacts
```

## Integration with Build Architecture
This principle reinforces existing workspace rules:
- **Never edit built artifacts** → Fix source files instead
- **Source-first development** → Root cause analysis traces to source
- **Zero technical debt** → Systematic solutions prevent accumulation
- **Living agent system** → Share root cause knowledge across network

## Vision
By always fixing root causes at the source level, we build a self-healing system that prevents technical debt accumulation and ensures lasting solutions. This principle creates exponential improvements over time as fixes become permanent and systemic.

---
*Story captured from development philosophy discussions and build architecture principles*