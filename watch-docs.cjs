#!/usr/bin/env node

/**
 * Auto-watcher for @akaoio/core documentation
 * Watches for changes in source files and automatically rebuilds docs
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chokidar = require('chokidar');

const WATCH_PATHS = [
  'docs/templates/**/*',
  'docs/atoms/**/*', 
  'teams/templates/**/*',
  '.claude/team.config.yaml',
  'composer.config.cjs'
];

const REBUILD_SCRIPT = './rebuild-docs.sh';
const DEBOUNCE_TIME = 2000; // 2 seconds

let rebuildTimer = null;
let isRebuilding = false;

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function debounceRebuild() {
  if (rebuildTimer) {
    clearTimeout(rebuildTimer);
  }
  
  rebuildTimer = setTimeout(() => {
    if (!isRebuilding) {
      rebuild();
    }
  }, DEBOUNCE_TIME);
}

function rebuild() {
  if (isRebuilding) {
    log('⏳ Rebuild already in progress, skipping...');
    return;
  }
  
  isRebuilding = true;
  log('🔄 Source files changed, rebuilding documentation...');
  
  const child = spawn('bash', [REBUILD_SCRIPT], {
    stdio: 'pipe',
    cwd: process.cwd()
  });
  
  let output = '';
  
  child.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    // Stream output in real-time but with prefix
    process.stdout.write(`📝 ${text}`);
  });
  
  child.stderr.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stderr.write(`❌ ${text}`);
  });
  
  child.on('close', (code) => {
    isRebuilding = false;
    if (code === 0) {
      log('✅ Documentation rebuild completed successfully');
    } else {
      log(`❌ Documentation rebuild failed with code ${code}`);
    }
  });
  
  child.on('error', (err) => {
    isRebuilding = false;
    log(`❌ Failed to start rebuild: ${err.message}`);
  });
}

function startWatching() {
  log('🚀 Starting @akaoio/core documentation watcher...');
  log(`👁️  Watching paths: ${WATCH_PATHS.join(', ')}`);
  
  // Initial build
  log('🔄 Performing initial documentation build...');
  rebuild();
  
  const watcher = chokidar.watch(WATCH_PATHS, {
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/*.log',
      '**/tmp/**',
      '.claude/agents-generated/**' // Don't watch generated files
    ],
    persistent: true,
    ignoreInitial: true
  });
  
  watcher.on('change', (filePath) => {
    log(`📝 Changed: ${filePath}`);
    debounceRebuild();
  });
  
  watcher.on('add', (filePath) => {
    log(`➕ Added: ${filePath}`);
    debounceRebuild();
  });
  
  watcher.on('unlink', (filePath) => {
    log(`🗑️  Deleted: ${filePath}`);
    debounceRebuild();
  });
  
  watcher.on('error', (error) => {
    log(`❌ Watcher error: ${error.message}`);
  });
  
  watcher.on('ready', () => {
    log('✅ Documentation watcher ready and active');
    log('🔍 Monitoring for changes to source files...');
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    log('🛑 Shutting down documentation watcher...');
    watcher.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('🛑 Shutting down documentation watcher...');
    watcher.close();
    process.exit(0);
  });
}

// Check if rebuild script exists
if (!fs.existsSync(REBUILD_SCRIPT)) {
  console.error(`❌ Rebuild script not found: ${REBUILD_SCRIPT}`);
  process.exit(1);
}

// Make sure rebuild script is executable
try {
  fs.accessSync(REBUILD_SCRIPT, fs.constants.X_OK);
} catch (err) {
  console.error(`❌ Rebuild script is not executable: ${REBUILD_SCRIPT}`);
  process.exit(1);
}

startWatching();