/**
 * Main Composer configuration for @akaoio/core
 * Generates all documentation using atomic composition
 */

module.exports = {
  sources: {
    // Direct source mapping using underscore naming
    project_overview: {
      pattern: 'docs/atoms/project-overview.yaml',
      parser: 'yaml'
    },
    
    team_protocol: {
      pattern: 'docs/atoms/team-protocol.yaml',
      parser: 'yaml'
    },
    
    build_architecture: {
      pattern: 'docs/atoms/build-architecture.yaml',
      parser: 'yaml'
    },
    
    workspace_cleanliness: {
      pattern: 'docs/atoms/workspace-cleanliness.yaml',
      parser: 'yaml'
    },
    
    // Configuration files
    config: {
      pattern: 'config/repos.json',
      parser: 'json'
    },
    
    // Package metadata for version info
    package: {
      pattern: 'package.json',
      parser: 'json'
    }
  },
  
  build: {
    tasks: [],
    helpers: {
      timestamp: () => new Date().toISOString()
    }
  },
  
  outputs: [
    {
      target: 'README.md',
      template: 'docs/templates/README.md.hbs',
      format: 'markdown'
    },
    {
      target: 'CLAUDE.md',
      template: 'docs/templates/CLAUDE.md.hbs',
      format: 'markdown'
    }
  ]
};