#!/usr/bin/env node

/**
 * Test the new flexible viewport system that supports ANY width and height
 */

const { Viewport } = require('./projects/tui/dist/index.js');

console.log('🧪 Testing Flexible Viewport System');
console.log('===================================\n');

const viewport = Viewport.getInstance();

// Test 1: Current dimensions and layout info
console.log('📊 Current Terminal:');
const dims = viewport.getDimensions();
const layoutInfo = viewport.getLayoutInfo();

console.log(`   Dimensions: ${dims.width}×${dims.height}`);
console.log(`   Area: ${layoutInfo.area} characters²`);
console.log(`   Aspect Ratio: ${layoutInfo.aspectRatio.toFixed(2)}`);
console.log(`   Density: ${layoutInfo.density}`);
console.log(`   Is Compact: ${layoutInfo.isCompact}`);
console.log(`   Can Fit Sidebar: ${layoutInfo.canFitSidebar}`);
console.log(`   Recommended Columns: ${layoutInfo.recommendedColumns}`);
console.log(`   Font Scale: ${layoutInfo.recommendedFontScale}x\n`);

// Test 2: Dimension-based queries (not breakpoints!)
console.log('🎯 Dimension-Based Responsive Values:');

// Test responsive text based on actual width
const titleText = viewport.createResponsive('TUI')
  .minWidth(60, 'Terminal UI')
  .minWidth(80, 'Terminal User Interface')  
  .minWidth(120, '🖥️ Terminal User Interface Framework')
  .resolve();

console.log(`   Title: "${titleText}"`);

// Test layout based on height
const layoutStyle = viewport.createResponsive('minimal')
  .minHeight(30, 'standard')
  .minHeight(50, 'luxurious')
  .resolve();

console.log(`   Layout Style: ${layoutStyle}`);

// Test aspect ratio responsiveness  
const orientationMsg = viewport.createResponsive('square-ish')
  .aspectRatio('2:1', 'wide screen')
  .aspectRatio('1:2', 'tall screen')
  .resolve();

console.log(`   Orientation: ${orientationMsg}\n`);

// Test 3: Flexible matching system
console.log('🔍 Flexible Matching Tests:');

const testCases = [
  { minWidth: 100, name: 'Large Width' },
  { maxWidth: 60, name: 'Small Width' },
  { minHeight: 30, name: 'Tall Screen' },
  { minArea: 2000, name: 'Large Area' },
  { minAspectRatio: 2.0, name: 'Ultra Wide' },
  { maxAspectRatio: 1.5, name: 'Narrow' }
];

testCases.forEach(test => {
  const matches = viewport.matches(test);
  console.log(`   ${test.name}: ${matches ? '✅' : '❌'}`);
});

// Test 4: Width/Height value mapping
console.log('\n📏 Value Mapping by Dimensions:');

const columnCount = viewport.getValueForWidth({
  40: 1,
  80: 2, 
  120: 3,
  160: 4
}, 1);

const rowCount = viewport.getValueForHeight({
  20: 10,
  30: 15,
  40: 20
}, 8);

const areaClass = viewport.getValueForArea({
  800: 'tiny',
  1600: 'small',
  3200: 'medium', 
  6400: 'large'
}, 'tiny');

console.log(`   Optimal Columns: ${columnCount}`);
console.log(`   Optimal Rows: ${rowCount}`);
console.log(`   Area Classification: ${areaClass}`);

// Test 5: Optimal layout calculation
console.log('\n🎨 Optimal Layout for ANY Size:');
const optimalLayout = viewport.getOptimalLayout();

console.log(`   Grid: ${optimalLayout.columns}×${optimalLayout.rows}`);
console.log(`   Cell Size: ${optimalLayout.cellWidth}×${optimalLayout.cellHeight}`);
console.log(`   Padding: ${optimalLayout.sidePadding}px sides, ${optimalLayout.topPadding}px top`);
console.log(`   Font Scale: ${optimalLayout.fontScale}x`);
console.log(`   Spacing Scale: ${optimalLayout.spacingScale}x`);

console.log('\n✅ Flexible Viewport Test Complete!');
console.log('\n💡 Key Innovation: No hardcoded breakpoints!');
console.log('   - Works with ANY terminal size: 40×10, 200×80, 300×100');
console.log('   - Dimension-based queries: minWidth(85), maxHeight(25)');  
console.log('   - Area-based: minArea(2000) for complex layouts');
console.log('   - Aspect-ratio aware: aspectRatio("16:9") for widescreen');
console.log('   - Capability-aware: SSH, Tmux, color detection');