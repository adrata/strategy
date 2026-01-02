#!/usr/bin/env node
/**
 * Strategy Docs - ElevenLabs Audio Generator
 * 
 * Generates FULL audio for all strategy documents using ElevenLabs.
 * - Handles long documents by chunking and concatenating audio
 * - Skips files that already have MP3s (use --force to regenerate)
 * - Dynamically discovers files from folder structure
 * 
 * Usage:
 *   node scripts/generate-docs-audio.js           # Generate missing audio only
 *   node scripts/generate-docs-audio.js --force   # Regenerate all audio
 *   node scripts/generate-docs-audio.js --file capabilities.html  # Specific file
 *   node scripts/generate-docs-audio.js --list    # List all docs
 */

const fs = require('fs');
const path = require('path');

// Try to load from .env.local first
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
} catch (e) {
  // dotenv not available
}

// API key from environment or fallback
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY || '6cd0b1a66c70e335ae812cdc6e9ff5c23211f6e373de9dc5602fecb3e0842946';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Default Adrata voice for all articles and documents
const DOC_VOICE_ID = 'uf0ZrRtyyJlbbGIn43uD'; // Adrata default voice - premium male narrator

// Chunk size for ElevenLabs API (stay under 5000 to be safe)
const CHUNK_SIZE = 4500;

// Base path for strategy docs
const STRATEGY_PATH = path.join(__dirname, '../strategy');

// Folders to scan for HTML files (in order)
const DOC_FOLDERS = [
  'docs/foundations',
  'docs/strategy', 
  'docs/playbooks',
  'docs/articles/internal',
  'docs/articles/external',
  'docs/talks',
  'docs/internal-docs',
];

/**
 * Dynamically discover all HTML files from configured folders
 */
function discoverDocs() {
  const docs = [];
  
  for (const folder of DOC_FOLDERS) {
    const folderPath = path.join(STRATEGY_PATH, folder);
    
    if (!fs.existsSync(folderPath)) {
      continue;
    }
    
    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.html'))
      .map(f => `${folder}/${f}`);
    
    docs.push(...files);
  }
  
  return docs;
}

/**
 * Check if MP3 already exists for a given HTML file
 */
function hasExistingAudio(htmlPath) {
  const mp3Path = htmlPath.replace('.html', '.mp3');
  const fullPath = path.join(STRATEGY_PATH, mp3Path);
  return fs.existsSync(fullPath);
}

/**
 * Get file size in human-readable format
 */
function getFileSize(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const stats = fs.statSync(filePath);
  const mb = stats.size / (1024 * 1024);
  return mb > 1 ? `${mb.toFixed(1)} MB` : `${(stats.size / 1024).toFixed(1)} KB`;
}

/**
 * Extract text content from HTML
 */
function extractTextFromHtml(htmlPath) {
  const fullPath = path.join(STRATEGY_PATH, htmlPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`  ❌ File not found: ${fullPath}`);
    return null;
  }
  
  const htmlContent = fs.readFileSync(fullPath, 'utf-8');
  
  // Remove script, style, audio player, share section, newsletter
  let text = htmlContent
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<audio[\s\S]*?<\/audio>/gi, '')
    .replace(/<div class="audio-player[\s\S]*?<\/div>\s*<\/div>/gi, '')
    .replace(/<div class="share-widget[\s\S]*?<\/div>\s*<\/form>\s*<\/div>/gi, '')
    .replace(/<div class="share-section[\s\S]*?<\/div>\s*<\/div>/gi, '')
    .replace(/<div class="newsletter[\s\S]*?<\/div>\s*<\/div>/gi, '')
    .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<a class="back-link[\s\S]*?<\/a>/gi, '');
  
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
  
  return text;
}

/**
 * Split text into chunks at sentence boundaries
 */
function splitIntoChunks(text, maxChunkSize = CHUNK_SIZE) {
  const chunks = [];
  let currentChunk = '';
  
  // Split by sentences (period followed by space or end)
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    // If adding this sentence would exceed the limit
    if (currentChunk.length + sentence.length > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If single sentence is too long, split it by commas or just force split
      if (sentence.length > maxChunkSize) {
        const parts = sentence.split(/(?<=,)\s+/);
        for (const part of parts) {
          if (currentChunk.length + part.length > maxChunkSize) {
            if (currentChunk.length > 0) {
              chunks.push(currentChunk.trim());
              currentChunk = '';
            }
            // Force split very long parts
            if (part.length > maxChunkSize) {
              for (let i = 0; i < part.length; i += maxChunkSize) {
                chunks.push(part.substring(i, i + maxChunkSize).trim());
              }
            } else {
              currentChunk = part;
            }
          } else {
            currentChunk += (currentChunk ? ' ' : '') + part;
          }
        }
      } else {
        currentChunk = sentence;
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Generate audio using ElevenLabs
 */
async function generateAudioChunk(text, voiceId) {
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

/**
 * Generate full audio by chunking and concatenating
 */
async function generateFullAudio(text, voiceId) {
  const chunks = splitIntoChunks(text);
  
  if (chunks.length === 1) {
    // Single chunk, no need to concatenate
    return await generateAudioChunk(chunks[0], voiceId);
  }
  
  console.log(`  📦 Split into ${chunks.length} chunks`);
  
  const audioBuffers = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunkLen = chunks[i].length;
    process.stdout.write(`  🎤 Chunk ${i + 1}/${chunks.length} (${chunkLen} chars)...`);
    
    try {
      const audio = await generateAudioChunk(chunks[i], voiceId);
      audioBuffers.push(audio);
      console.log(' ✓');
    } catch (error) {
      console.log(' ✗');
      throw error;
    }
    
    // Rate limit between chunks
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  // Concatenate all audio buffers
  const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.length, 0);
  const combined = Buffer.concat(audioBuffers, totalLength);
  
  return combined;
}

/**
 * Get output path for audio file
 */
function getOutputPath(htmlPath) {
  const mp3Path = htmlPath.replace('.html', '.mp3');
  return path.join(STRATEGY_PATH, mp3Path);
}

/**
 * Main function
 */
async function main() {
  console.log('Strategy Docs - ElevenLabs Audio Generator');
  console.log('==========================================\n');
  
  // Parse arguments
  const args = process.argv.slice(2);
  const forceRegenerate = args.includes('--force') || args.includes('-f');
  const listOnly = args.includes('--list') || args.includes('-l');
  
  // Discover all docs
  const allDocs = discoverDocs();
  
  if (listOnly) {
    console.log(`Found ${allDocs.length} documents:\n`);
    for (const doc of allDocs) {
      const hasAudio = hasExistingAudio(doc);
      const mp3Path = path.join(STRATEGY_PATH, doc.replace('.html', '.mp3'));
      const size = hasAudio ? getFileSize(mp3Path) : null;
      console.log(`  ${hasAudio ? '✓' : '○'} ${doc}${size ? ` (${size})` : ''}`);
    }
    console.log(`\n✓ = has audio, ○ = missing audio`);
    return;
  }
  
  // Check for specific file
  let docsToProcess = allDocs;
  const fileArgIndex = args.findIndex(a => a === '--file' || a === '--only');
  if (fileArgIndex !== -1 && args[fileArgIndex + 1]) {
    const fileName = args[fileArgIndex + 1];
    docsToProcess = allDocs.filter(d => d.includes(fileName));
    if (docsToProcess.length === 0) {
      console.error(`No matching doc found for: ${fileName}`);
      console.log('Use --list to see all available docs');
      process.exit(1);
    }
  }
  
  // Filter to only missing audio (unless --force)
  if (!forceRegenerate) {
    const before = docsToProcess.length;
    docsToProcess = docsToProcess.filter(d => !hasExistingAudio(d));
    const skipped = before - docsToProcess.length;
    if (skipped > 0) {
      console.log(`⏭️  Skipping ${skipped} docs with existing audio (use --force to regenerate)\n`);
    }
  }
  
  if (docsToProcess.length === 0) {
    console.log('✅ All documents already have audio!');
    console.log('   Use --force to regenerate all audio');
    return;
  }
  
  console.log(`Processing ${docsToProcess.length} documents...\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const docPath of docsToProcess) {
    const docName = path.basename(docPath, '.html');
    const folder = path.dirname(docPath).split('/').pop();
    console.log(`📄 [${folder}] ${docName}`);
    
    // Extract text
    const text = extractTextFromHtml(docPath);
    if (!text) {
      errorCount++;
      continue;
    }
    
    console.log(`  📝 ${text.length.toLocaleString()} characters`);
    
    // Generate audio
    try {
      const audio = await generateFullAudio(text, DOC_VOICE_ID);
      
      // Save audio
      const outputPath = getOutputPath(docPath);
      
      // Ensure directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, audio);
      const size = getFileSize(outputPath);
      console.log(`  ✅ Saved: ${path.basename(outputPath)} (${size})`);
      successCount++;
      
      // Rate limit between documents
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
