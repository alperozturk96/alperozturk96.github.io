// Lightweight markdown -> HTML renderer extracted from post.js
// Exported so post.js can import and use it. Intentionally minimal and tailored to site styles.
export function markdownToHtml(markdown, post) {
    const lines = markdown.replace(/\r\n/g, "\n").split('\n');
    const sections = [];
    let curr = [];
    let i = 0;

    function pushSectionFromLines(linesArr) {
        if (linesArr.length === 0) return;
        const html = linesArr.join('\n');
        sections.push(html);
    }

    while (i < lines.length) {
        const line = lines[i];

        // Code fence
        const fenceMatch = line.match(/^```\s*(\w+)?\s*$/);
        if (fenceMatch) {
            const lang = fenceMatch[1] || '';
            i++;
            const codeLines = [];
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            // skip closing fence
            i++;

            // push any accumulated paragraph before code block
            if (curr.length) { pushSectionFromLines(curr); curr = []; }

            const codeHtml = `<div class="code-container"><button class="copy-button" title="Copy">Copy</button><pre><code class="language-${lang} lang-${lang}">${escapeHtml(codeLines.join('\n'))}</code></pre></div>`;
            sections.push(codeHtml);
            continue;
        }

        // Heading
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2];
            // push previous
            if (curr.length) { pushSectionFromLines(curr); curr = []; }
            // treat top-level heading (#) as section heading (h2) because title is handled separately
            const tag = level === 1 ? 'h2' : 'h' + (level + 1);
            sections.push(`<${tag}>${inlineFormat(text)}</${tag}>`);
            i++;
            continue;
        }

        // Image
        const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)/);
        if (imageMatch) {
            if (curr.length) { pushSectionFromLines(curr); curr = []; }
            const alt = imageMatch[1];
            const src = imageMatch[2];
            sections.push(`<img src="${src}" alt="${escapeHtml(alt)}" class="post-img">`);
            i++;
            continue;
        }

        // Unordered list
        if (line.match(/^\s*[-*+]\s+/)) {
            const items = [];
            while (i < lines.length && lines[i].match(/^\s*[-*+]\s+/)) {
                const item = lines[i].replace(/^\s*[-*+]\s+/, '');
                items.push(`<li>${inlineFormat(item)}</li>`);
                i++;
            }
            if (curr.length) { pushSectionFromLines(curr); curr = []; }
            sections.push(`<ul>${items.join('')}</ul>`);
            continue;
        }

        // blank line -> paragraph break
        if (/^\s*$/.test(line)) {
            if (curr.length) { pushSectionFromLines(curr); curr = []; }
            i++;
            continue;
        }

        // accumulate for paragraph
        curr.push(line);
        i++;
    }

    if (curr.length) pushSectionFromLines(curr);

    // Wrap sections into <section class="post-section"> where appropriate
    const sectionHtml = sections.map(s => {
        // if s already starts with a block-level tag (h2,h3,img,div,ul), keep as-is inside a section where appropriate
        if (/^<(h\d|img|div|ul)/.test(s.trim())) {
            return `<section class="post-section">${s}</section>`;
        }
        // otherwise convert to paragraphs (preserve multiple lines)
        const paragraphs = s.split(/\n{1,}/).map(p => `<p>${inlineFormat(p.trim())}</p>`).join('');
        return `<section class="post-section">${paragraphs}</section>`;
    }).join('\n');

    // Build final article HTML using post metadata when available
    const timeHtml = post && post.date ? `<time datetime="${formatDateForDatetime(post.date)}">${escapeHtml(post.date)}</time>` : '';
    const title = post && post.title ? escapeHtml(post.title) : '';

    return `<article class="post"><header class="post-header"><h1>${title}</h1>${timeHtml}</header><main class="post-content">${sectionHtml}</main></article>`;

    // helpers
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function inlineFormat(text) {
        if (!text) return '';
        // code
        text = text.replace(/`([^`]+)`/g, (m, p1) => `<code>${escapeHtml(p1)}</code>`);
        // bold **
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // italic *
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        // links [text](url)
        text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
        return text;
    }

    function formatDateForDatetime(dateStr) {
        // try to parse formats like '30 May 2025' -> 2025-05-30, fallback to original
        const months = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
        // Try Date.parse
        const parsed = Date.parse(dateStr);
        if (!isNaN(parsed)) {
            const d = new Date(parsed);
            return d.toISOString().split('T')[0];
        }
        // fallback for '30 May 2025'
        const m = dateStr.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
        if (m) {
            const day = m[1].padStart(2,'0');
            const monthName = m[2].slice(0,3);
            const month = Object.keys(months).find(k => k.toLowerCase() === monthName.toLowerCase());
            const monthNum = month ? String(months[month]).padStart(2,'0') : '01';
            return `${m[3]}-${monthNum}-${day}`;
        }
        return dateStr;
    }
}
