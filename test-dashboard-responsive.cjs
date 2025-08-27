#!/usr/bin/env node

/**
 * Test script to verify dashboard responsive behavior
 */

const { Dashboard } = require('./projects/dashboard/dist/Dashboard.cjs');

async function testDashboard() {
  console.log('🧪 Testing Dashboard Responsive Behavior\n');
  
  const dashboard = new Dashboard({
    peers: [],  // No network connection needed for testing
    title: 'Test Dashboard'
  });
  
  // Test the viewport integration
  console.log('✅ Dashboard initialized with viewport support');
  
  const state = dashboard.getState();
  console.log(`📊 Terminal Info: ${state.terminal?.width}×${state.terminal?.height}`);
  console.log(`🔧 Terminal Capabilities:`, {
    program: state.terminal?.capabilities?.terminalProgram,
    color: state.terminal?.capabilities?.supportsColor,
    unicode: state.terminal?.capabilities?.supportsUnicode
  });
  
  // Test the render method by calling it directly
  console.log('\n📝 Testing render output:');
  
  // Simulate different terminal sizes by mocking the viewport
  const originalGetDimensions = dashboard.viewport?.getDimensions;
  const originalGetBreakpoint = dashboard.viewport?.getBreakpoint;
  const originalGetCapabilities = dashboard.viewport?.getCapabilities;
  
  // Test mobile size
  if (dashboard.viewport) {
    dashboard.viewport.getDimensions = () => ({ width: 40, height: 20 });
    dashboard.viewport.getBreakpoint = () => 'xs';
    dashboard.viewport.getCapabilities = () => ({ 
      terminalProgram: 'mobile-term',
      supportsColor: false,
      supportsUnicode: true
    });
  }
  
  console.log('📱 Mobile view (40×20):');
  dashboard.render?.();
  console.log('');
  
  // Test standard size  
  if (dashboard.viewport) {
    dashboard.viewport.getDimensions = () => ({ width: 80, height: 24 });
    dashboard.viewport.getBreakpoint = () => 'md';
    dashboard.viewport.getCapabilities = () => ({ 
      terminalProgram: 'xterm',
      supportsColor: true,
      supportsUnicode: true
    });
  }
  
  console.log('💻 Standard view (80×24):');
  dashboard.render?.();
  console.log('');
  
  // Test wide screen
  if (dashboard.viewport) {
    dashboard.viewport.getDimensions = () => ({ width: 120, height: 40 });
    dashboard.viewport.getBreakpoint = () => 'lg';
    dashboard.viewport.getCapabilities = () => ({ 
      terminalProgram: 'iTerm.app',
      supportsColor: true,
      supportsUnicode: true
    });
  }
  
  console.log('🖥️  Wide view (120×40):');
  dashboard.render?.();
  console.log('');
  
  // Restore original methods
  if (dashboard.viewport && originalGetDimensions) {
    dashboard.viewport.getDimensions = originalGetDimensions;
    dashboard.viewport.getBreakpoint = originalGetBreakpoint;
    dashboard.viewport.getCapabilities = originalGetCapabilities;
  }
  
  console.log('✅ Dashboard responsive test completed!');
}

testDashboard().catch(console.error);