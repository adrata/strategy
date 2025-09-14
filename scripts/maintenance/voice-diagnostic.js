// 🎙️ ADRATA VOICE RECOGNITION DIAGNOSTIC
// Copy and paste this entire script into your browser console

console.log("🎙️ ADRATA VOICE DIAGNOSTIC STARTING...");
console.log("=====================================\n");

async function runVoiceDiagnostic() {
  try {
    // 1. Check Tauri Environment
    console.log("1️⃣ Checking Tauri Environment...");
    const isTauri = typeof window !== "undefined" && window.__TAURI__;
    console.log("   ✅ Tauri Environment:", isTauri);

    if (!isTauri) {
      console.log(
        "   ❌ Not in Tauri - voice recognition requires desktop app",
      );
      return;
    }

    // 2. Check Available Tauri Commands
    console.log("\n2️⃣ Checking Available Tauri Commands...");
    const tauriInvoke = window.__TAURI_INVOKE__;
    console.log("   ✅ Tauri Invoke Available:", !!tauriInvoke);

    // 3. Test Voice Support
    console.log("\n3️⃣ Testing Voice Support...");
    try {
      const supportInfo = await tauriInvoke("check_voice_support");
      console.log("   ✅ Voice Support Response:", supportInfo);
    } catch (error) {
      console.log("   ❌ Voice Support Error:", error);
    }

    // 4. Check Microphone Permission
    console.log("\n4️⃣ Checking Microphone Permission...");
    try {
      const micPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      console.log("   ✅ Microphone Permission: Granted");
      micPermission.getTracks().forEach((track) => track.stop()); // Clean up
    } catch (error) {
      console.log("   ❌ Microphone Permission Error:", error.message);
      console.log(
        "   💡 Try: System Preferences > Security & Privacy > Microphone > Enable for Adrata",
      );
    }

    // 5. Test Voice Session Start
    console.log("\n5️⃣ Testing Voice Session Start...");
    try {
      const startResult = await tauriInvoke("start_native_voice_session");
      console.log("   ✅ Voice Session Start Result:", startResult);
    } catch (error) {
      console.log("   ❌ Voice Session Start Error:", error);
    }

    // 6. Check Voice Status
    console.log("\n6️⃣ Checking Voice Status...");
    try {
      const statusResult = await tauriInvoke("get_native_voice_status");
      console.log("   ✅ Voice Status:", statusResult);
    } catch (error) {
      console.log("   ❌ Voice Status Error:", error);
    }

    // 7. Check useVoiceActivation Hook
    console.log("\n7️⃣ Checking Frontend Voice Hook...");

    // Try to find the voice activation hook in React DevTools
    const reactFiberKey = Object.keys(
      document.querySelector("#__next") || {},
    ).find(
      (key) =>
        key.startsWith("__reactFiber") ||
        key.startsWith("__reactInternalInstance"),
    );

    if (reactFiberKey) {
      console.log(
        "   ✅ React Fiber Detected - Voice Hook Should Be Available",
      );
    } else {
      console.log("   ⚠️ React Fiber Not Found - Check if app is fully loaded");
    }

    // 8. Test Browser Speech Recognition (Fallback)
    console.log("\n8️⃣ Testing Browser Speech Recognition...");
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      console.log("   ✅ Browser Speech Recognition Available");
    } else {
      console.log("   ❌ Browser Speech Recognition Not Available");
    }

    console.log("\n🎯 DIAGNOSIS COMPLETE!");
    console.log("=====================================");

    // Provide next steps
    console.log("\n📋 NEXT STEPS:");
    console.log("1. Check microphone permissions in System Preferences");
    console.log("2. Try manually activating voice with this command:");
    console.log(
      '   await window.__TAURI_INVOKE__("start_native_voice_session")',
    );
    console.log("3. Check the Tauri console logs for any Rust errors");
    console.log("4. Verify the AI assistant panel has a microphone icon");
  } catch (error) {
    console.error("❌ Diagnostic Failed:", error);
  }
}

// Run the diagnostic
runVoiceDiagnostic();
