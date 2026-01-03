/**
 * Adrata Copy Menu Component
 * Optimized for non-technical users to easily ask AI about documents
 */

// Get the production URL for the current page
function getProdUrl() {
    const path = window.location.pathname;
    // Convert localhost or any domain to production URL
    return `https://adrata.github.io/strategy${path.startsWith('/strategy') ? path.replace('/strategy', '') : path}`;
}

// Generate a smart prompt for AI (with document content)
function getAIPrompt() {
    const title = document.querySelector('h1')?.textContent || document.title;
    return `I'm sharing a document called "${title}" below. Please read through it so I can ask you questions about it.

After you've read it, let me know you're ready and I'll ask my questions. My goal is to improve and apply what's in this document.

---

`;
}

// Generate a URL-based prompt for AI platforms that support ?q= parameter
function getUrlPrompt() {
    const url = getProdUrl();
    return `Read from ${url} so I can ask questions about it.`;
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
                <a class="copy-option" href="#" onclick="openInChatGPT(event)">
                    <div class="option-icon brand-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>
                    </div>
                    <div class="option-content">
                        <div class="option-title">Open in ChatGPT <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></div>
                        <div class="option-desc">Ask questions about this page</div>
                    </div>
                </a>
                
                <a class="copy-option" href="#" onclick="openInClaude(event)">
                    <div class="option-icon brand-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.304 4.075l-3.398 11.927-2.242-5.167-5.167-2.242L18.424 5.19a1 1 0 0 0-1.12-1.115zM21.33 3.47a3 3 0 0 0-4.239-.799L4.164 9.073a1.5 1.5 0 0 0-.08 2.509l4.5 1.955 1.955 4.5a1.5 1.5 0 0 0 2.51-.08l6.4-12.926a3 3 0 0 0-.119-1.56z"/></svg>
                    </div>
                    <div class="option-content">
                        <div class="option-title">Open in Claude <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></div>
                        <div class="option-desc">Ask questions about this page</div>
                    </div>
                </a>
                
                <a class="copy-option" href="#" onclick="openInPerplexity(event)">
                    <div class="option-icon brand-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    </div>
                    <div class="option-content">
                        <div class="option-title">Open in Perplexity <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></div>
                        <div class="option-desc">Ask questions about this page</div>
                    </div>
                </a>
                
                <a class="copy-option" href="#" onclick="viewAsMarkdown(event)">
                    <div class="option-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <div class="option-content">
                        <div class="option-title">View as Markdown <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></div>
                        <div class="option-desc">Open raw markdown for this page</div>
                    </div>
                </a>
            </div>
        </div>
    `;
    
    // Find the theme toggle and wrap both in a flex container
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        // Create a wrapper div for copy menu and theme toggle
        const wrapper = document.createElement('div');
        wrapper.className = 'header-actions';
        
        // Find the parent that contains the toggle (could be page-header or breadcrumb row)
        const parent = themeToggle.parentNode;
        
        // Insert wrapper where the toggle currently is
        parent.insertBefore(wrapper, themeToggle);
        wrapper.innerHTML = menuHtml;
        wrapper.appendChild(themeToggle);
        
        // Ensure the wrapper is positioned at the end (right side) of its parent
        if (parent.lastChild !== wrapper) {
            parent.appendChild(wrapper);
        }
    }
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .header-actions {
            position: fixed;
            top: 48px;
            right: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 100;
        }
        @media (max-width: 768px) {
            .header-actions {
                top: 24px;
                right: 16px;
            }
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
        .option-icon.brand-icon svg { color: var(--text-secondary); }
        
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
    
    // Update button to show "Copied" feedback with checkmark icon
    const label = document.querySelector('.copy-label');
    const iconSvg = document.querySelector('.copy-main-btn svg');
    if (label && iconSvg) {
        const originalText = label.textContent;
        const originalIcon = iconSvg.outerHTML;
        
        label.textContent = 'Copied';
        // Replace with Lucide check icon
        iconSvg.outerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
        
        setTimeout(() => {
            label.textContent = originalText;
            document.querySelector('.copy-main-btn svg').outerHTML = originalIcon;
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

function viewAsMarkdown(e) {
    e.preventDefault();
    const content = document.querySelector('#content') || document.body;
    const md = htmlToMarkdown(content);
    const title = document.querySelector('h1')?.textContent || document.title;
    
    // Create a styled markdown viewer page
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Markdown</title>
    <style>
        :root {
            --bg: #0a0a0a;
            --text: #fafafa;
            --text-muted: #888;
            --border: #333;
            --accent: #e65100;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'MiSans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg);
            color: var(--text);
            padding: 48px;
            max-width: 900px;
            margin: 0 auto;
            line-height: 1.6;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border);
        }
        .header h1 {
            font-size: 20px;
            color: var(--accent);
        }
        .header span {
            font-size: 12px;
            color: var(--text-muted);
        }
        .copy-btn {
            background: var(--accent);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            font-family: inherit;
        }
        .copy-btn:hover { opacity: 0.9; }
        pre {
            background: #111;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 24px;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'SF Mono', 'Fira Code', monospace;
            font-size: 13px;
            line-height: 1.7;
        }
        .toast {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--text);
            color: var(--bg);
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            display: none;
        }
        .toast.show { display: block; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>${title}</h1>
            <span>Markdown export from Adrata Strategy</span>
        </div>
        <button class="copy-btn" onclick="copyMarkdown()">Copy Markdown</button>
    </div>
    <pre id="markdown-content"></pre>
    <div class="toast" id="toast">Copied to clipboard!</div>
    <script>
        const markdown = ${JSON.stringify(md)};
        document.getElementById('markdown-content').textContent = markdown;
        
        function copyMarkdown() {
            navigator.clipboard.writeText(markdown).then(() => {
                const toast = document.getElementById('toast');
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2000);
            });
        }
    </script>
</body>
</html>`;
    
    // Open in new tab
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    document.querySelector('.copy-menu')?.classList.remove('open');
}

function openInClaude(e) {
    e.preventDefault();
    const prompt = getUrlPrompt();
    const encodedPrompt = encodeURIComponent(prompt);
    const claudeUrl = `https://claude.ai/new?q=${encodedPrompt}`;
    
    document.querySelector('.copy-menu')?.classList.remove('open');
    window.open(claudeUrl, '_blank');
}

function openInChatGPT(e) {
    e.preventDefault();
    const content = document.querySelector('#content') || document.body;
    const prompt = getAIPrompt();
    const md = htmlToMarkdown(content);
    const fullText = prompt + md;
    
    // ChatGPT doesn't support URL parameters, so copy content and open
    copyToClipboard(fullText);
    document.querySelector('.copy-menu')?.classList.remove('open');
    window.open('https://chat.openai.com/', '_blank');
}

function openInPerplexity(e) {
    e.preventDefault();
    const prompt = getUrlPrompt();
    const encodedPrompt = encodeURIComponent(prompt);
    const perplexityUrl = `https://www.perplexity.ai/?q=${encodedPrompt}`;
    
    document.querySelector('.copy-menu')?.classList.remove('open');
    window.open(perplexityUrl, '_blank');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCopyMenu);
} else {
    initCopyMenu();
}

// Global keyboard shortcuts for all pages
document.addEventListener('keydown', (e) => {
    // Don't trigger if user is typing in an input
    const isTyping = document.activeElement?.tagName === 'INPUT' || 
                     document.activeElement?.tagName === 'TEXTAREA' ||
                     document.activeElement?.isContentEditable;
    
    // Left arrow = browser back
    if (e.key === 'ArrowLeft' && !isTyping) {
        e.preventDefault();
        history.back();
    }
    
    // Right arrow = browser forward
    if (e.key === 'ArrowRight' && !isTyping) {
        e.preventDefault();
        history.forward();
    }
    
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
