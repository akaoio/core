#!/usr/bin/env node
console.log("=== Testing Cross-Dependencies ===\n");

// Test 1: Can Composer use Battle?
try {
  const { Battle } = require("@akaoio/battle");
  console.log("✅ Composer can import Battle");
} catch (e) {
  console.log("❌ Composer cannot import Battle:", e.message);
}

// Test 2: Can Builder be called programmatically?
try {
  const { Builder } = require("@akaoio/builder");
  console.log("✅ Can import Builder programmatically");
} catch (e) {
  console.log("❌ Cannot import Builder:", e.message);
}

// Test 3: Can Composer be used by others?
try {
  const { Composer } = require("@akaoio/composer");
  console.log("✅ Can import Composer");
} catch (e) {
  console.log("❌ Cannot import Composer:", e.message);
}

console.log("\n=== Testing Real Usage ===\n");

// Real test: Use Battle to test something
const { Battle } = require("@akaoio/battle");
const battle = new Battle();
battle.run(async (b) => {
  b.spawn("echo", ["Cross-dependency works!"]);
  await b.expect("Cross-dependency works!");
}).then(result => {
  if (result.success) {
    console.log("✅ Battle actually works for testing!");
  } else {
    console.log("❌ Battle test failed");
  }
}).catch(e => {
  console.log("❌ Battle error:", e.message);
});
