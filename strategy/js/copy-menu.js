/**
 * Adrata Copy Menu Component
 * Optimized for non-technical users to easily ask AI about documents
 */

// Generate a smart prompt for AI
function getAIPrompt() {
    const title = document.querySelector('h1')?.textContent || document.title;
    return `I'm sharing a document called "${title}" below. Please read through it so I can ask you questions about it.

After you've read it, let me know you're ready and I'll ask my questions. My goal is to improve and apply what's in this document.

---

`;
}

// Convert HTML content to clean Markdown for AI consumption
function htmlToMarkdown(element) {
    let md = '';
    const title = document.querySelector('h1')?.textContent || document.title;
    const subtitle = document.querySelector('.subtitle')?.textContent || '';
    
    md += `# ${title}\n\n`;
    if (subtitle) md += `*${subtitle}*\n\n`;
    md += `---\n\n`;
    
    // Get main content, excluding nav elements
    const content = element.cloneNode(true);
    
    // Remove elements we don't want in the export
    content.querySelectorAll('.breadcrumb, .theme-toggle, .audio-player, .copy-menu, script, style, .newsletter-section, .share-section').forEach(el => el.remove());
    
    // Process the content
    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }
        
        if (node.nodeType !== Node.ELEMENT_NODE) return '';
        
        const tag = node.tagName.toLowerCase();
        const children = Array.from(node.childNodes).map(processNode).join('');
        
        switch (tag) {
            case 'h1': return `# ${children}\n\n`;
            case 'h2': return `## ${children}\n\n`;
            case 'h3': return `### ${children}\n\n`;
            case 'h4': return `#### ${children}\n\n`;
            case 'p': return `${children}\n\n`;
            case 'strong': case 'b': return `**${children}**`;
            case 'em': case 'i': return `*${children}*`;
            case 'code': return `\`${children}\``;
            case 'pre': return `\`\`\`\n${node.textContent}\n\`\`\`\n\n`;
            case 'a': return `[${children}](${node.href})`;
            case 'ul': return `${children}\n`;
            case 'ol': return `${children}\n`;
            case 'li': return `- ${children}\n`;
            case 'blockquote': return `> ${children}\n\n`;
            case 'br': return '\n';
            case 'hr': return `---\n\n`;
            case 'table': return processTable(node);
            case 'div': case 'section': case 'article': return children;
            default: return children;
        }
    }
    
    function processTable(table) {
        let result = '\n';
        const rows = table.querySelectorAll('tr');
        rows.forEach((row, i) => {
            const cells = row.querySelectorAll('th, td');
            result += '| ' + Array.from(cells).map(c => c.textContent.trim()).join(' | ') + ' |\n';
            if (i === 0) {
                result += '| ' + Array.from(cells).map(() => '---').join(' | ') + ' |\n';
            }
        });
        return result + '\n';
    }
    
    md += processNode(content);
    
    // Clean up extra whitespace
    md = md.replace(/\n{3,}/g, '\n\n').trim();
    
    return md;
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

// Show toast notification
function showToast(message, duration = 3000) {
    const existing = document.querySelector('.copy-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--text);
        color: var(--bg);
        padding: 14px 24px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: fadeIn 0.2s ease;
        max-width: 90%;
        text-align: center;
        line-height: 1.5;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

// Initialize copy menu
function initCopyMenu() {
    const menuHtml = `
        <div class="copy-menu">
            <button class="copy-btn" onclick="toggleCopyMenu(event)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy</span>
                <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div class="copy-dropdown" id="copyDropdown">
                <button class="copy-option primary" onclick="copyAsText()">
                    <div class="option-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </div>
                    <div>
                        <div class="option-title">Copy</div>
                        <div class="option-desc">Copy to clipboard</div>
                    </div>
                </button>
                
                <div class="copy-divider"></div>
                <div class="dropdown-header">Open in AI</div>
                
                <a class="copy-option" href="#" onclick="openInClaude(event)">
                    <div class="option-icon claude">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                    </div>
                    <div>
                        <div class="option-title">Ask Claude</div>
                        <div class="option-desc">Recommended</div>
                    </div>
                </a>
                
                <a class="copy-option" href="#" onclick="openInChatGPT(event)">
                    <div class="option-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <div>
                        <div class="option-title">Ask ChatGPT</div>
                    </div>
                </a>
                
                <a class="copy-option" href="#" onclick="openInPerplexity(event)">
                    <div class="option-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </div>
                    <div>
                        <div class="option-title">Ask Perplexity</div>
                    </div>
                </a>
                
                <div class="copy-divider"></div>
                
                <button class="copy-option" onclick="copyAsMarkdown()">
                    <div class="option-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/></svg>
                    </div>
                    <div>
                        <div class="option-title">Copy as Markdown</div>
                        <div class="option-desc">For AI prompts</div>
                    </div>
                </button>
            </div>
        </div>
    `;
    
    // Find the theme toggle and insert before it
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.insertAdjacentHTML('beforebegin', menuHtml);
    }
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .copy-menu {
            position: relative;
            z-index: 100;
        }
        .copy-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 8px 12px;
            color: var(--text);
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.15s;
        }
        .copy-btn:hover { background: var(--border); }
        .copy-btn .chevron { transition: transform 0.2s; }
        .copy-menu.open .copy-btn .chevron { transform: rotate(180deg); }
        
        .copy-dropdown {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 8px;
            min-width: 280px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            display: none;
            z-index: 101;
        }
        [data-theme="dark"] .copy-dropdown { box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .copy-menu.open .copy-dropdown { display: block; }
        
        .dropdown-header {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: var(--text-muted);
            padding: 8px 12px 4px;
        }
        
        .copy-option {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 8px;
            text-decoration: none;
            color: var(--text);
            cursor: pointer;
            background: none;
            border: none;
            width: 100%;
            text-align: left;
            font-family: inherit;
            transition: all 0.15s;
        }
        .copy-option:hover { background: var(--card-bg); }
        
        .copy-option.primary {
            background: rgba(230, 81, 0, 0.08);
            border: 1px solid rgba(230, 81, 0, 0.2);
        }
        .copy-option.primary:hover { 
            background: rgba(230, 81, 0, 0.12);
            border-color: rgba(230, 81, 0, 0.3);
        }
        .copy-option.primary .option-title { color: #e65100; }
        
        .option-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: var(--card-bg);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .option-icon svg { color: var(--text-muted); }
        .option-icon.claude { background: rgba(230, 81, 0, 0.15); }
        .option-icon.claude svg { color: #e65100; }
        
        .option-title { font-size: 14px; font-weight: 500; }
        .option-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        
        .copy-divider { height: 1px; background: var(--border); margin: 8px 0; }
    `;
    document.head.appendChild(style);
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.copy-menu')) {
            document.querySelector('.copy-menu')?.classList.remove('open');
        }
    });
}

function toggleCopyMenu(e) {
    e.stopPropagation();
    document.querySelector('.copy-menu')?.classList.toggle('open');
}

function copyAsText() {
    const content = document.querySelector('#content') || document.body;
    const md = htmlToMarkdown(content);
    copyToClipboard(md);
    showToast('✓ Copied!');
    document.querySelector('.copy-menu')?.classList.remove('open');
}

function copyAsMarkdown() {
    const content = document.querySelector('#content') || document.body;
    const prompt = getAIPrompt();
    const md = htmlToMarkdown(content);
    const fullText = prompt + md;
    copyToClipboard(fullText);
    showToast('✓ Copied as Markdown with AI prompt!');
    document.querySelector('.copy-menu')?.classList.remove('open');
}

function openInClaude(e) {
    e.preventDefault();
    const content = document.querySelector('#content') || document.body;
    const prompt = getAIPrompt();
    const md = htmlToMarkdown(content);
    const fullText = prompt + md;
    
    copyToClipboard(fullText);
    showToast('✓ Copied! Opening Claude...<br><span style="opacity:0.7">Press Ctrl+V (or Cmd+V) to paste</span>', 4000);
    setTimeout(() => window.open('https://claude.ai/new', '_blank'), 600);
    document.querySelector('.copy-menu')?.classList.remove('open');
}

function openInChatGPT(e) {
    e.preventDefault();
    const content = document.querySelector('#content') || document.body;
    const prompt = getAIPrompt();
    const md = htmlToMarkdown(content);
    const fullText = prompt + md;
    
    copyToClipboard(fullText);
    showToast('✓ Copied! Opening ChatGPT...<br><span style="opacity:0.7">Press Ctrl+V (or Cmd+V) to paste</span>', 4000);
    setTimeout(() => window.open('https://chat.openai.com/', '_blank'), 600);
    document.querySelector('.copy-menu')?.classList.remove('open');
}

function openInPerplexity(e) {
    e.preventDefault();
    const content = document.querySelector('#content') || document.body;
    const prompt = getAIPrompt();
    const md = htmlToMarkdown(content);
    const fullText = prompt + md;
    
    copyToClipboard(fullText);
    showToast('✓ Copied! Opening Perplexity...<br><span style="opacity:0.7">Press Ctrl+V (or Cmd+V) to paste</span>', 4000);
    setTimeout(() => window.open('https://www.perplexity.ai/', '_blank'), 600);
    document.querySelector('.copy-menu')?.classList.remove('open');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCopyMenu);
} else {
    initCopyMenu();
}
