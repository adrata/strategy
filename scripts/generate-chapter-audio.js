#!/usr/bin/env node
/**
 * Q4 Novel - Multi-Voice Audiobook Generator
 * 
 * Uses ElevenLabs to generate audiobook with different voices for each character.
 * 
 * Usage:
 *   node scripts/generate-chapter-audio.js
 */

const fs = require('fs');
const path = require('path');

const ELEVENLABS_API_KEY = '6cd0b1a66c70e335ae812cdc6e9ff5c23211f6e373de9dc5602fecb3e0842946';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Voice IDs - Using high-quality ElevenLabs voices
const VOICES = {
  // Niko (Narrator) - Warm captivating storyteller, perfect for audiobooks
  narrator: {
    id: 'JBFqnCBsd6RMkjVDRZzb', // "George" - Warm, Captivating Storyteller (British, narrative_story)
    name: 'Niko (Narrator)',
    description: 'First-person narrator, VP of Sales - warm storytelling voice'
  },
  
  // Marco Valenti - CEO, authoritative commanding
  marco: {
    id: 'VR6AewLTigWG4xSOukaG', // "American Bold" - Strong, commanding American voice
    name: 'Marco Valenti',
    description: 'CEO, commanding presence'
  },
  
  // Sofia Chen - CFO, professional female
  sofia: {
    id: 'EXAVITQu4vr4xnSDxMaL', // "American Friendly" - Soft, friendly voice
    name: 'Sofia Chen',
    description: 'CFO, precise, data-driven'
  },
  
  // Dr. Eli Voss - Physicist mentor, British professional
  eli: {
    id: 'N2lVS1w4EtoT3dr4eOWO', // "British Professional" - Clear British diction
    name: 'Dr. Eli Voss',
    description: 'Physicist turned consultant, Socratic wisdom'
  },
  
  // Adrian Marchetti - Customer CTO, energetic
  adrian: {
    id: 'TxGEqnHWrfWFTfGW9XjX', // "American Energetic" - Young, energetic American
    name: 'Adrian Marchetti',
    description: 'Customer CTO, enthusiastic'
  }
};

// Extract content from HTML
function extractContent() {
  const chapterPath = path.join(__dirname, '../strategy/book/chapter-1-the-number.html');
  const htmlContent = fs.readFileSync(chapterPath, 'utf-8');
  
  // Extract content between readable-content div and closing script
  const contentMatch = htmlContent.match(/<div class="readable-content"[^>]*id="content"[^>]*>([\s\S]*?)<\/div>\s*<script>/);
  if (!contentMatch) {
    console.error('Could not find readable-content div');
    return null;
  }
  
  return contentMatch[1];
}

// Parse HTML to segments with speaker identification
function parseToSegments(htmlContent) {
  const segments = [];
  
  // Clean HTML
  let text = htmlContent
    .replace(/<div class="dashboard">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g, '')
    .replace(/<div class="scene-break">[\s\S]*?<\/div>/g, '\n\n[PAUSE]\n\n')
    .replace(/<em>([^<]+)<\/em>/g, '$1')
    .replace(/<strong>([^<]+)<\/strong>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
  
  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim() && p.trim() !== '[PAUSE]');
  
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    
    // Detect speaker for dialogue
    const speaker = detectSpeaker(trimmed);
    segments.push({
      type: 'speech',
      voice: speaker,
      text: trimmed.replace(/\s+/g, ' ')
    });
  }
  
  return segments;
}

// Detect who is speaking based on context
function detectSpeaker(text) {
  // Marco's lines
  if (text.match(/Marco (says|gestures|continues)/i) ||
      text.includes('"Niko. Have a seat"') ||
      text.includes('"I\'ll cut to it"') ||
      text.includes('"We have $4.2 million"') ||
      text.includes('"Meridian grew') ||
      text.includes('"Here\'s where we are"') ||
      text.includes('Nico, this is Dr. Eli Thorne')) {
    return 'marco';
  }
  
  // Sofia's lines
  if (text.match(/Sofia (cuts in|says|adds)/i) ||
      text.includes('The gap has been widening')) {
    return 'sofia';
  }
  
  // Eli's lines
  if (text.match(/Eli (says|speaks|continues|pauses)/i) ||
      text.includes('The best physicists') ||
      text.includes('What I need from you') ||
      text.includes('In particle physics') ||
      text.includes('That\'s the constraint') ||
      text.includes('Two words') ||
      text.includes('Who else needs to say yes') ||
      text.includes('Pull the call recordings')) {
    return 'eli';
  }
  
  // Adrian's lines (in recording)
  if (text.includes('Adrian Marchetti, our champion, is speaking') ||
      text.includes('This looks great. I\'m really excited')) {
    return 'adrian';
  }
  
  // Default to narrator
  return 'narrator';
}

// Generate audio for one segment
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

// Main function
async function main() {
  console.log('Q4 Novel - Multi-Voice Audiobook Generator');
  console.log('==========================================\n');
  
  // Extract and parse content
  const content = extractContent();
  if (!content) {
    process.exit(1);
  }
  
  const segments = parseToSegments(content);
  
  // Show voice cast
  console.log('Voice Cast:');
  Object.entries(VOICES).forEach(([key, voice]) => {
    console.log(`  ${voice.name}: ${voice.description}`);
  });
  console.log();
  
  // Count segments by voice
  const voiceCounts = {};
  segments.forEach(s => {
    voiceCounts[s.voice] = (voiceCounts[s.voice] || 0) + 1;
  });
  
  console.log('Segments by speaker:');
  Object.entries(voiceCounts).forEach(([voice, count]) => {
    console.log(`  ${VOICES[voice]?.name || voice}: ${count} segments`);
  });
  console.log(`\nTotal: ${segments.length} segments\n`);
  
  // Generate audio
  console.log('Generating audio with ElevenLabs...\n');
  const audioBuffers = [];
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const voice = VOICES[segment.voice];
    const preview = segment.text.substring(0, 60) + (segment.text.length > 60 ? '...' : '');
    
    console.log(`  [${i + 1}/${segments.length}] ${voice.name}: "${preview}"`);
    
    try {
      const audio = await generateAudio(segment.text, voice.id);
      audioBuffers.push(audio);
      
      // Rate limit - wait 300ms between requests
      await new Promise(r => setTimeout(r, 300));
    } catch (error) {
      console.error(`    ❌ Error: ${error.message}`);
    }
  }
  
  // Combine and save
  if (audioBuffers.length > 0) {
    const finalAudio = Buffer.concat(audioBuffers);
    const outputPath = path.join(__dirname, '../strategy/book/chapter-1-the-number.mp3');
    fs.writeFileSync(outputPath, finalAudio);
    
    console.log(`\n✓ Audio saved to: ${outputPath}`);
    console.log(`  File size: ${(finalAudio.length / 1024 / 1024).toFixed(2)} MB\n`);
  } else {
    console.log('\n❌ No audio was generated\n');
  }
}

main().catch(console.error);
