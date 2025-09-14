#!/usr/bin/env node

/**
 * Quick fix for voice integration issues
 */

const fs = require("fs");

console.log("🔧 Fixing voice integration...");

try {
  // Read the AI assistant file
  let content = fs.readFileSync(
    "src/components/ai/UniversalAIAssistant.tsx",
    "utf8",
  );

  // Fix 1: Update voice activation hook call
  content = content.replace(
    /const voiceActivation = useVoiceActivation\(\(command: string, intent: any\) => \{\s*handleVoiceCommand\(command, intent\);\s*\}\);/gs,
    "const voiceActivation = useVoiceActivation();",
  );

  // Fix 2: Make paper plane smaller
  content = content.replace(
    /<PaperAirplaneIcon className="w-4 h-4" \/>/g,
    '<PaperAirplaneIcon className="w-3.5 h-3.5" />',
  );

  // Fix 3: Update voice property references
  content = content.replace(
    /voiceActivation\.isActiveSession/g,
    "voiceActivation.isActive",
  );
  content = content.replace(
    /voiceActivation\.sessionInfo/g,
    "voiceActivation.sessionDuration",
  );

  // Write back
  fs.writeFileSync("src/components/ai/UniversalAIAssistant.tsx", content);

  console.log("✅ Voice integration fixed!");
  console.log("✅ Paper plane made smaller!");
  console.log("✅ Voice properties updated!");
} catch (error) {
  console.error("❌ Fix failed:", error.message);
}
