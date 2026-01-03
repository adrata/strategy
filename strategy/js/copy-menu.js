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
            <div class="copy-btn-group">
                <button class="copy-main-btn" onclick="copyPageDirect(event)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span class="copy-label">Copy page</span>
                </button>
                <button class="copy-dropdown-btn" onclick="toggleCopyMenu(event)">
                    <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
                </button>
            </div>
            <div class="copy-dropdown" id="copyDropdown">
                <a class="copy-option" href="#" onclick="openInClaude(event)">
                    <div class="option-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div class="option-content">
                        <div class="option-title">Open in Claude <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></div>
                        <div class="option-desc">Ask questions about this page</div>
                    </div>
                </a>
                
                <a class="copy-option" href="#" onclick="openInChatGPT(event)">
                    <div class="option-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                    </div>
                    <div class="option-content">
                        <div class="option-title">Open in ChatGPT <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></div>
                        <div class="option-desc">Ask questions about this page</div>
                    </div>
                </a>
                
                <a class="copy-option" href="#" onclick="openInPerplexity(event)">
                    <div class="option-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </div>
                    <div class="option-content">
                        <div class="option-title">Open in Perplexity <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></div>
                        <div class="option-desc">Ask questions about this page</div>
                    </div>
                </a>
                
                <div class="copy-divider"></div>
                
                <button class="copy-option" onclick="copyPageDirect(event)">
                    <div class="option-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </div>
                    <div class="option-content">
                        <div class="option-title">Copy as Markdown</div>
                        <div class="option-desc">Copy page for pasting into any AI</div>
                    </div>
                </button>
            </div>
        </div>
    `;
    
    // Find the theme toggle and wrap both in a flex container
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        // Create a wrapper div for copy menu and theme toggle
        const wrapper = document.createElement('div');
        wrapper.className = 'header-actions';
        themeToggle.parentNode.insertBefore(wrapper, themeToggle);
        wrapper.innerHTML = menuHtml;
        wrapper.appendChild(themeToggle);
    }
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .header-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }
        .copy-menu {
            position: relative;
            z-index: 100;
        }
        .copy-btn-group {
            display: flex;
            align-items: center;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
        }
        .copy-main-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            background: transparent;
            border: none;
            padding: 8px 12px;
            color: var(--text);
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.15s;
        }
        .copy-main-btn:hover { background: var(--border); }
        .copy-dropdown-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            border-left: 1px solid var(--border);
            padding: 8px 10px;
            color: var(--text-muted);
            cursor: pointer;
            transition: all 0.15s;
        }
        .copy-dropdown-btn:hover { background: var(--border); color: var(--text); }
        .copy-dropdown-btn .chevron { transition: transform 0.2s; }
        .copy-menu.open .copy-dropdown-btn .chevron { transform: rotate(180deg); }
        
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
        
        .option-title { font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 4px; }
        .option-title svg { opacity: 0.5; }
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

function copyPageDirect(e) {
    if (e) e.stopPropagation();
    const content = document.querySelector('#content') || document.body;
    const prompt = getAIPrompt();
    const md = htmlToMarkdown(content);
    const fullText = prompt + md;
    copyToClipboard(fullText);
    
    // Update button to show "Copied" feedback
    const label = document.querySelector('.copy-label');
    if (label) {
        const originalText = label.textContent;
        label.textContent = 'Copied';
        setTimeout(() => {
            label.textContent = originalText;
        }, 2000);
    }
    
    document.querySelector('.copy-menu')?.classList.remove('open');
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
    
    // Use Claude's URL query parameter to pre-fill the prompt
    const encodedPrompt = encodeURIComponent(fullText);
    const claudeUrl = `https://claude.ai/new?q=${encodedPrompt}`;
    
    copyToClipboard(fullText);
    showToast('✓ Opening Claude with document...', 3000);
    setTimeout(() => window.open(claudeUrl, '_blank'), 300);
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

// Global keyboard shortcut: Press / to go to search from any page
document.addEventListener('keydown', (e) => {
    // Don't trigger if user is typing in an input
    const isTyping = document.activeElement?.tagName === 'INPUT' || 
                     document.activeElement?.tagName === 'TEXTAREA' ||
                     document.activeElement?.isContentEditable;
    
    if (e.key === '/' && !isTyping) {
        e.preventDefault();
        // Navigate to search page (calculate relative path based on current location)
        const path = window.location.pathname;
        let searchPath = 'search.html';
        
        // Count directory depth to build correct relative path
        const depth = (path.match(/\//g) || []).length - 1;
        if (path.includes('/docs/')) {
            searchPath = '../../search.html';
        } else if (path.includes('/book/') || path.includes('/reports/')) {
            searchPath = '../search.html';
        } else if (path.includes('/strategy/') && !path.includes('/docs/')) {
            searchPath = 'search.html';
        }
        
        window.location.href = searchPath;
    }
});
