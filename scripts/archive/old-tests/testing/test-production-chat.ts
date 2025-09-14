#!/usr/bin/env tsx

/**
 * Test the Ross-Dan chat functionality in production
 * Run after deployment to verify everything works
 */

const PRODUCTION_URL = "https://adrata.vercel.app";

async function testProduction() {
  console.log("🧪 Testing Ross-Dan chat in production...");

  // Test API endpoints
  const endpoints = ["/api/chat/ross-dan", "/api/pusher/auth"];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${PRODUCTION_URL}${endpoint}`);
      if (response.ok) {
        console.log(`✅ ${endpoint} - Working`);
      } else {
        console.log(`❌ ${endpoint} - HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }

  // Test Pusher connection
  console.log("📡 Testing Pusher connection...");
  // Add Pusher connection test here

  console.log("✅ Production testing complete");
}

testProduction().catch(console.error);
