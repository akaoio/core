#!/bin/bash

# Rebuild docs command for @akaoio/core
# This script generates documentation for core and working projects

echo "🔄 Rebuilding documentation..."

# Generate core documentation (CLAUDE.md, README.md) 
echo "📁 Generating core documentation..."
cd /home/x/core
npx @akaoio/composer build

if [ $? -eq 0 ]; then
    echo "✅ Core documentation rebuilt successfully"
else
    echo "❌ Core documentation rebuild failed"
    exit 1
fi

# Generate agent documentation
echo "📁 Regenerating agents..."
if [ -f teams/generate-with-composer.cjs ]; then
    node teams/generate-with-composer.cjs
    
    # Auto-activate generated agents
    echo "🔄 Auto-activating generated agents..."
    cp .claude/agents-generated/* .claude/agents/ 2>/dev/null || {
        echo "⚠️ No generated agents to activate"
    }
    echo "✅ Agents regenerated and activated automatically"
else
    echo "⚠️ Agent regeneration script not found - skipping"
fi

echo "🎉 Documentation rebuild complete!"