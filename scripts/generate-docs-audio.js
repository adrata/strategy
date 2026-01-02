#!/usr/bin/env node
/**
 * Strategy Docs - ElevenLabs Audio Generator
 * 
 * Generates audio for all strategy documents using ElevenLabs.
 * 
 * Usage:
 *   node scripts/generate-docs-audio.js
 *   node scripts/generate-docs-audio.js --file archetypes.html
 */

const fs = require('fs');
const path = require('path');

// Try to load from .env.local first
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
} catch (e) {
  // dotenv not available
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '6cd0b1a66c70e335ae812cdc6e9ff5c23211f6e373de9dc5602fecb3e0842946';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Use a clear, professional voice for documents
const DOC_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // "American Calm" - Professional, clear

// All documents to generate audio for
const DOCS = [
  // Main docs
  'docs/archetypes.html',
  'docs/capabilities.html',
  'docs/contagion.html',
  'docs/conversion.html',
  'docs/daily-sales-playbook.html',
  'docs/demand.html',
  'docs/frameworks.html',
  'docs/greatest-salespeople.html',
  'docs/history-of-sales-technology.html',
  'docs/offers.html',
  'docs/pains-and-challenges.html',
  'docs/storytelling.html',
  
  // Internal Articles (Adrata-authored)
  'docs/articles/internal/ai-agents-for-account-executives.html',
  'docs/articles/internal/ai-agents-for-revops.html',
  'docs/articles/internal/ai-agents-for-sales-leaders.html',
  'docs/articles/internal/ai-agents-for-sales-managers.html',
  'docs/articles/internal/ai-agents-for-sales-teams.html',
  'docs/articles/internal/ai-agents-for-sdrs.html',
  'docs/articles/internal/discovery.html',
  'docs/articles/internal/game-ux.html',
  'docs/articles/internal/pitch.html',
  'docs/articles/internal/pull.html',
  'docs/articles/internal/recursive.html',
  
  // External Articles (curated from Anthropic, OpenAI, etc.)
  'docs/articles/external/10x-revenue-club.html',
  'docs/articles/external/building-effective-agents.html',
  'docs/articles/external/claude-agent-sdk.html',
  'docs/articles/external/deep-research.html',
  'docs/articles/external/long-running-agents.html',
  'docs/articles/external/multi-agent-research.html',
  'docs/articles/external/writing-effective-tools.html',
  
  // Talks
  'docs/talks/software-era-of-ai.html',
  'docs/talks/urgency-profits.html',
];

// Extract text content from HTML
function extractTextFromHtml(htmlPath) {
  const fullPath = path.join(__dirname, '../strategy', htmlPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`  ❌ File not found: ${fullPath}`);
    return null;
  }
  
  const htmlContent = fs.readFileSync(fullPath, 'utf-8');
  
  // Remove script, style, audio player, share section
  let text = htmlContent
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<div class="audio-player[\s\S]*?<\/div>\s*<\/div>/gi, '')
    .replace(/<div class="share-section[\s\S]*?<\/div>\s*<\/div>/gi, '')
    .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '');
  
  // Extract body content
  const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    text = bodyMatch[1];
  }
  
  // Clean HTML tags and entities
  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  
  // Limit to reasonable length for API (roughly 5000 chars = ~5 min audio)
  const MAX_CHARS = 15000;
  if (text.length > MAX_CHARS) {
    console.log(`  ⚠️  Text truncated from ${text.length} to ${MAX_CHARS} chars`);
    text = text.substring(0, MAX_CHARS) + '... End of document preview.';
  }
  
  return text;
}

// Generate audio using ElevenLabs
async function generateAudio(text, voiceId) {
  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_turbo_v2',
      voice_settings: {
        stability: 0.50,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

// Get output path for audio file
function getOutputPath(htmlPath) {
  // Replace .html with .mp3
  const mp3Path = htmlPath.replace('.html', '.mp3');
  return path.join(__dirname, '../strategy', mp3Path);
}

// Main function
async function main() {
  console.log('Strategy Docs - ElevenLabs Audio Generator');
  console.log('==========================================\n');
  
  // Check for specific file argument
  const args = process.argv.slice(2);
  let docsToProcess = DOCS;
  
  if (args.includes('--file') || args.includes('-f')) {
    const fileIndex = args.indexOf('--file') !== -1 ? args.indexOf('--file') : args.indexOf('-f');
    const fileName = args[fileIndex + 1];
    if (fileName) {
      docsToProcess = DOCS.filter(d => d.includes(fileName));
      if (docsToProcess.length === 0) {
        console.error(`No matching doc found for: ${fileName}`);
        console.log('Available docs:', DOCS.map(d => path.basename(d)).join(', '));
        process.exit(1);
      }
    }
  }
  
  console.log(`Processing ${docsToProcess.length} documents...\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const docPath of docsToProcess) {
    const docName = path.basename(docPath, '.html');
    console.log(`📄 ${docName}`);
    
    // Extract text
    const text = extractTextFromHtml(docPath);
    if (!text) {
      errorCount++;
      continue;
    }
    
    console.log(`  📝 Extracted ${text.length} characters`);
    
    // Generate audio
    try {
      console.log(`  🎤 Generating audio with ElevenLabs...`);
      const audio = await generateAudio(text, DOC_VOICE_ID);
      
      // Save audio
      const outputPath = getOutputPath(docPath);
      
      // Ensure directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, audio);
      console.log(`  ✅ Saved: ${path.basename(outputPath)} (${(audio.length / 1024).toFixed(1)} KB)`);
      successCount++;
      
      // Rate limit - wait 500ms between requests
      await new Promise(r => setTimeout(r, 500));
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errorCount++;
    }
    
    console.log();
  }
  
  console.log('==========================================');
  console.log(`✅ Success: ${successCount}/${docsToProcess.length}`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}`);
  }
}

main().catch(console.error);

