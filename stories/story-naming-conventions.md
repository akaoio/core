# Story Naming Conventions and Organization Protocols

## Established Naming Convention
**Format**: `{topic-slug}.md` using kebab-case (lowercase with hyphens)

## Naming Examples
- **Principles**: `ssl-security-principle.md`, `root-cause-fixing-principle.md`, `no-hardcoded-decorations-principle.md`
- **Architecture**: `multi-agent-system-architecture.md`, `air-based-living-agents.md`
- **Conversations**: `stories-system-implementation.md`
- **Conventions**: `story-naming-conventions.md` (this story)

## Organization Protocol
1. **Descriptive and Clear**: Names should immediately convey the story's content
2. **Searchable**: Use terms that would be natural to search for
3. **Consistent**: Follow the kebab-case pattern consistently
4. **Categorizable**: Include category hints when helpful (principle, architecture, etc.)
5. **Timeless**: Avoid date-based naming unless the story is specifically about a moment in time

## Story Categories
- **Principles**: Core rules and guidelines (`*-principle.md`)
- **Architecture**: System design and structure (`*-architecture.md`, `*-system.md`)
- **Conversations**: Important discussions and decisions (`*-implementation.md`, `*-discussion.md`)
- **Processes**: Workflows and protocols (`*-conventions.md`, `*-protocol.md`)
- **Visions**: Future direction and goals (`*-vision.md`, `*-roadmap.md`)

## Duplication Prevention Protocol
1. **Search existing stories** before creating new ones
2. **Update existing stories** rather than creating duplicates
3. **Merge related content** into comprehensive stories
4. **Reference other stories** when appropriate rather than repeating content
5. **Review periodically** to identify consolidation opportunities

## File Management
- **Location**: `/home/x/core/stories/`
- **Format**: Markdown (.md) for universal readability
- **Encoding**: UTF-8
- **Line endings**: Unix (LF)
- **Max line length**: None specified (readability over technical limits)

## Meta-Story Awareness
This story itself demonstrates the recursive nature of our knowledge management system - we use the stories system to document the stories system conventions, ensuring the protocol is self-documenting and evolvable.

---
*Story capturing the naming conventions and organization protocols established during stories system implementation*