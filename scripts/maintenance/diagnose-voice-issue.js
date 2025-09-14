#!/usr/bin/env node

/**
 * 🎙️ VOICE ACTIVATION DIAGNOSTIC TOOL
 *
 * Helps identify and fix voice activation issues in Tauri desktop
 */

console.log("🎙️ VOICE ACTIVATION DIAGNOSTIC");
console.log("===============================\n");

const fs = require("fs");
const path = require("path");

// Check if running
const { exec } = require("child_process");

function checkProcess(name) {
  return new Promise((resolve) => {
    exec(`ps aux | grep -i ${name} | grep -v grep`, (error, stdout) => {
      resolve(stdout.trim().length > 0);
    });
  });
}

async function runDiagnostics() {
  console.log("🔍 CHECKING SYSTEM STATUS...\n");

  // 1. Check if desktop app is running
  const desktopRunning = await checkProcess("adrata");
  console.log(
    `📱 Desktop App: ${desktopRunning ? "✅ Running" : "❌ Not Running"}`,
  );

  const nextRunning = await checkProcess("next");
  console.log(
    `🌐 Next.js Server: ${nextRunning ? "✅ Running" : "❌ Not Running"}`,
  );

  // 2. Check voice files exist
  console.log("\n🔍 CHECKING VOICE FILES...\n");

  const voiceFiles = [
    "src/hooks/useVoiceActivation.ts",
    "src/components/ai/UniversalAIAssistant.tsx",
    "src/app/debug-voice/page.tsx",
    "src-tauri/src/lib.rs",
    "src-tauri/capabilities/default.json",
  ];

  voiceFiles.forEach((file) => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? "✅" : "❌"} ${file}`);
  });

  // 3. Check for voice icon in AI assistant
  console.log("\n🔍 CHECKING VOICE ICON INTEGRATION...\n");

  try {
    const aiAssistantContent = fs.readFileSync(
      "src/components/ai/UniversalAIAssistant.tsx",
      "utf8",
    );
    const hasVoiceIcon = aiAssistantContent.includes("MicrophoneIcon");
    const hasVoiceButton = aiAssistantContent.includes(
      "voiceActivation.isSupported",
    );
    const hasVoiceStates =
      aiAssistantContent.includes("isListening") &&
      aiAssistantContent.includes("isProcessing");

    console.log(`🎤 Voice Icon: ${hasVoiceIcon ? "✅ Present" : "❌ Missing"}`);
    console.log(
      `🔘 Voice Button: ${hasVoiceButton ? "✅ Present" : "❌ Missing"}`,
    );
    console.log(
      `🔄 Voice States: ${hasVoiceStates ? "✅ Present" : "❌ Missing"}`,
    );
  } catch (error) {
    console.log("❌ Could not read AI assistant file");
  }

  // 4. Check Tauri voice commands
  console.log("\n🔍 CHECKING TAURI VOICE COMMANDS...\n");

  const criticalFiles = [
    "src-tauri/src/lib.rs",
    "src-tauri/src/voice/mod.rs",
    "src-tauri/src/database.rs",
    "src-tauri/src/desktop_init.rs",
    "src-tauri/Cargo.toml",
    "src-tauri/tauri.conf.json",
  ];

  console.log("🔍 Checking critical Tauri files...");

  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      console.log(`✅ ${file} (${stats.size} bytes)`);
    } else {
      console.log(`❌ Missing: ${file}`);
    }
  }

  // Check modular structure for voice commands
  console.log("\n🎙️ Checking voice command structure...");

  const libRsPath = "src-tauri/src/lib.rs";
  const voiceModPath = "src-tauri/src/voice/mod.rs";

  if (fs.existsSync(libRsPath) && fs.existsSync(voiceModPath)) {
    const libContent = fs.readFileSync(libRsPath, "utf8");
    const voiceContent = fs.readFileSync(voiceModPath, "utf8");

    // Check for proper modular organization
    if (
      libContent.includes("pub mod voice") &&
      libContent.includes("use voice::{")
    ) {
      console.log("✅ Modular voice structure properly configured");
    } else {
      console.log("❌ Voice module not properly imported in lib.rs");
    }

    // Check for voice command definitions
    const voiceCommands = [
      "start_native_voice_session",
      "get_native_voice_status",
    ];
    let voiceCommandsFound = 0;

    voiceCommands.forEach((cmd) => {
      if (voiceContent.includes(`pub async fn ${cmd}`)) {
        voiceCommandsFound++;
      }
    });

    console.log(
      `✅ Found ${voiceCommandsFound}/${voiceCommands.length} voice commands in voice module`,
    );

    if (libContent.includes(".invoke_handler(tauri::generate_handler![")) {
      console.log("✅ Tauri command handler configured");
    } else {
      console.log("❌ Tauri command handler not found");
    }
  } else {
    console.log("❌ Critical voice files missing");
  }

  console.log("\n🔧 TROUBLESHOOTING STEPS...\n");

  if (!desktopRunning) {
    console.log("❌ ISSUE: Desktop app is not running");
    console.log(
      '💡 SOLUTION: Run "npm run desktop:dev" to start the desktop app',
    );
    return;
  }

  console.log("✅ Desktop app is running correctly!");
  console.log("📍 To test voice activation:");
  console.log("");
  console.log("1. 🌐 Open the desktop app (should be running)");
  console.log("2. 🗂️ Navigate to Action Platform or any page with AI chat");
  console.log("3. 👀 Look for a microphone icon next to the paper plane icon");
  console.log(
    "4. 🖱️ Click the microphone icon (it should ask for permissions)",
  );
  console.log('5. 🗣️ Say "Adrata Start" or "Start Adrata" or "Hey Adrata"');
  console.log("6. ✅ You should see the icon change color/state");
  console.log('7. 🎤 Try commands like "health check" or "open leads"');
  console.log('8. 😴 Say "sleep" to end the voice session');
  console.log("");
  console.log("🔧 If voice icon is missing:");
  console.log("   • Check browser console for errors (F12)");
  console.log("   • Try refreshing the page");
  console.log("   • Make sure you're on HTTPS (voice requires secure context)");
  console.log("");
  console.log("🎯 For debugging, visit: http://localhost:3000/debug-voice");
  console.log("   This page has comprehensive voice system testing tools");
  console.log("");
  console.log("🌐 If desktop voice doesn't work, test in regular browser:");
  console.log("   Open http://localhost:3000 in Chrome/Safari for comparison");
  console.log("");

  // 5. Browser compatibility note
  console.log("📝 BROWSER COMPATIBILITY NOTES:\n");
  console.log("✅ Chrome/Chromium: Full voice recognition support");
  console.log("🟡 Safari: Partial support (may need user interaction)");
  console.log("❌ Firefox: Speech recognition disabled by default");
  console.log("❌ Edge: Limited recognition support");
  console.log(
    "🖥️ Tauri Desktop: Uses webview speech APIs (platform dependent)",
  );
  console.log("");

  console.log("🎉 Voice system should be working! Try the steps above.");
}

runDiagnostics().catch(console.error);
