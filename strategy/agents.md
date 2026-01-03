# Adrata Strategy Content Standards

This document captures the standards and learnings from building the strategy content library.

## Quick Start: Context Bundles

**To give AI agents full context, search "context-bundle" on the search page.** This surfaces all standards docs that should be uploaded together:

1. **Universal Standards** — Voice, archetypes, language calibration
2. **Hook Standards** — 5 hook patterns with examples
3. **Offer Standards** — PULL framework, earned trust
4. **Conversion Standards** — Landing pages, CTAs, LinkedIn
5. **HTML Design Standards** — CSS template, colors, typography
6. **The 10 Archetypes** — Full persona reference with language guides

For any content task, upload: Universal Standards + Archetypes + relevant specialized doc.

## Copy Menu (Ask AI)

All strategy documents include a "Copy" dropdown in the top-right corner. Optimized for non-technical users to easily ask AI about documents.

### Options (in order):
1. **Ask Claude** (Recommended) — Copies document with prompt, opens Claude
2. **Ask ChatGPT** — Copies document with prompt, opens ChatGPT
3. **Ask Perplexity** — Copies document with prompt, opens Perplexity
4. **Copy as text** — Simple copy to clipboard

### Smart Prompt
When copying for AI, the document includes a prompt that primes the AI:
> "I'm sharing a document called "[Title]" below. Please read through it so I can ask you questions about it. After you've read it, let me know you're ready. My goal is to improve and apply what's in this document."

### Usage Instructions (for non-technical users)
1. Click "Copy" button in top right
2. Click "Ask Claude" (or other AI)
3. When AI opens, press Ctrl+V (or Cmd+V) to paste
4. The AI will read the document and be ready for your questions

Include in any HTML document:
```html
<script src="../../js/copy-menu.js"></script>
```

## Design Standards

### Colors
- **Primary Accent**: `#e65100` (orange)
- **Accent Light**: `#ff6d00` (lighter orange for gradients)
- **Avoid**: Green, blue, purple, or other accent colors that clash with orange
- **Grays**: Use consistent gray scale from CSS variables, not hardcoded values

### CSS Variables (Light Mode)
```css
--bg: #fff;
--text: #1a1a1a;
--text-secondary: #333;
--text-muted: #666;
--border: #e5e5e5;
--card-bg: #fafafa;
--highlight-bg: #fff5f0;
```

### CSS Variables (Dark Mode)
```css
--bg: #0a0a0a;
--text: #e5e5e5;
--text-secondary: #ccc;
--text-muted: #999;
--border: #333;
--card-bg: #1a1a1a;
--highlight-bg: #1a1008;
```

### Typography
- **Font**: MiSans (always)
- **h1**: 42px, weight 800
- **h2**: 24px, weight 700
- **h3**: 18px, weight 700
- **body**: 16-17px, weight 400

### Layout
- **Max width**: 800-900px
- **Padding**: 48px 24px
- **Default theme**: Dark mode (`data-theme="dark"`)

## Audio Player Standards

### Default Speed
- Default: **2x**
- Initialize `speechRate = 2` in JavaScript
- Mark 2x as `active` in the speed menu

### Speed Options
- Range: 1x, 1.5x, **2x**, 2.5x, 3x, 4x

### Audio Fallback Pattern
1. Try to load MP3 file first
2. On error, fall back to Web Speech API
3. Always show status to user ("Playing...", "Paused", "Using browser voice")

## Voice Configuration

### ElevenLabs Voices
- **Default Adrata Voice**: `uf0ZrRtyyJlbbGIn43uD` (premium male narrator)
- Use for ALL content (articles, docs, Q4 novel)

### Voice Settings
```javascript
{
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true
}
```

## Article Structure

### Internal Articles (by Adrata)
- Byline: `By Adrata · [Date]`
- No "Back to Library" link
- Share widget at bottom

### External Articles (curated)
- Author attribution
- Source/date info
- Same share widget pattern

### Header Pattern
```html
<div class="page-header">
    <div class="doc-type">Category Label</div>
    <div class="title-row">
        <h1>Title</h1>
        <button class="theme-toggle">...</button>
    </div>
    <div class="subtitle">Subtitle text</div>
    <div class="audio-player">...</div>
</div>
```

## Theme Toggle Icons
- Light mode: Show **moon** icon (to switch to dark)
- Dark mode: Show **sun** icon (to switch to light)

## Share Widget

### Copy
- Headline: "Know someone who'd find this useful?"
- Subtext: "Send this article to a colleague"
- Placeholder: "Their email"
- Button: Right arrow icon

## Audio Generation

### Script Location
- `/scripts/generate-docs-audio.js` - For articles and docs
- `/scripts/generate-chapter-audio.js` - For Q4 novel chapters

### Chunking for Long Content
- Max chunk size: 4500 characters
- Split at sentence boundaries
- Concatenate audio buffers

## Common Mistakes to Avoid

1. **Speed dropdown appearing as circle**: Use `.play-btn` class, not generic `button` selector
2. **Audio not starting at correct speed**: Initialize `speechRate` variable to match UI default
3. **Theme toggle icons inverted**: Moon = light mode, Sun = dark mode
4. **Clashing grays**: Use CSS variables, not hardcoded colors
5. **Missing audio fallback**: Always include Web Speech API fallback
6. **Content ID mismatch**: Audio fallback needs `id="content"` on readable content div

## File Organization

### Folder Structure

```
strategy/
├── book/                    # Q4 novel chapters
├── docs/
│   ├── foundations/         # Timeless reference (archetypes, history)
│   ├── strategy/            # Strategic concepts (conversion, demand)
│   ├── playbooks/           # Tactical how-to guides
│   ├── standards/           # Design and content standards
│   ├── articles/
│   │   ├── internal/        # Adrata-authored
│   │   └── external/        # Curated external
│   ├── talks/               # Conference/video content
│   └── internal-docs/       # Internal strategy docs
├── js/                      # Shared JavaScript (copy-menu.js)
├── landing/                 # LinkedIn ad landing pages
├── schedule/                # Scheduling pages
├── reports/                 # Forecasts and pipeline reports
└── agents.md                # This file
```

### Folder Guidelines
- **Max 5-7 items** per folder for easy scanning
- Group by **purpose**, not format
- Each HTML file should have matching MP3 in same folder
- Create subfolders when a category exceeds 7 items

## Git Repositories

- **Main codebase**: `adrata/adrata` (scripts, platform code)
- **Strategy content**: `adrata/strategy` (GitHub Pages site)

Always push strategy content to `adrata/strategy` for GitHub Pages deployment.

## Cache Busting

Users won't clear their browser cache, so we need strategies to ensure they get the latest version of files.

### When to Cache Bust
- JavaScript files that have been updated (e.g., `copy-menu.js`)
- CSS that has changed significantly
- Critical HTML updates that users must see immediately

### Methods

**1. Query String Versioning (Preferred)**
Add a version query parameter to file references:
```html
<script src="../../js/copy-menu.js?v=2"></script>
<link rel="stylesheet" href="styles.css?v=1.2">
```
Increment the version number when the file changes.

**2. Timestamp Versioning**
For frequently updated files, use a timestamp:
```html
<script src="../../js/copy-menu.js?t=20260103"></script>
```

**3. File Renaming (Breaking Changes)**
For major updates, rename the file:
```
copy-menu.js → copy-menu-v2.js
```

### Implementation Checklist
1. When updating shared JS (like `copy-menu.js`), update the version parameter in ALL HTML files that reference it
2. Use grep to find all references: `grep -r "copy-menu.js" strategy/`
3. Increment version: `?v=1` → `?v=2`

### GitHub Pages Cache
GitHub Pages has a 10-minute cache. After pushing:
- Wait 10 minutes for changes to propagate
- Or use hard refresh (Cmd+Shift+R / Ctrl+Shift+R) to bypass cache

### Current Versioned Files
- `js/copy-menu.js` — Copy menu functionality (version in query string)

When making significant updates to shared JS files, always bump the version number in all referencing HTML files.
