export function markdownToHtml(markdown, post) {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const sections = [];
    let curr = [];
    let i = 0;

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function inlineFormat(text) {
        if (!text) return '';
        text = escapeHtml(text);
        text = text.replace(/`([^`]+)`/g, (_, p1) => `<code>${p1}</code>`);
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
        return text;
    }

    function flushParagraph() {
        if (curr.length === 0) return;
        sections.push(`<p>${inlineFormat(curr.join(' '))}</p>`);
        curr = [];
    }

    function formatDateForDatetime(dateStr) {
        const parsed = Date.parse(dateStr);
        if (!isNaN(parsed)) return new Date(parsed).toISOString().split('T')[0];
        const m = dateStr.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
        if (m) {
            const months = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
                            jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
            const month = months[m[2].slice(0, 3).toLowerCase()] || '01';
            return `${m[3]}-${month}-${m[1].padStart(2, '0')}`;
        }
        return dateStr;
    }

    while (i < lines.length) {
        const line = lines[i];

        // Code Fences
        const fenceMatch = line.match(/^```\s*([\w\-+#.]*)\s*$/);
        if (fenceMatch) {
            flushParagraph();
            const lang = fenceMatch[1] || '';
            i++;
            const codeLines = [];
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++;

            sections.push(
                `<div class="code-container">` +
                `<button class="copy-button" title="Copy">Copy</button>` +
                `<pre><code class="language-${lang} lang-${lang}">${escapeHtml(codeLines.join('\n'))}</code></pre>` +
                `</div>`
            );
            continue;
        }

        // Headings
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            flushParagraph();
            const level = headingMatch[1].length;
            const text  = headingMatch[2];
            const tag   = level === 1 ? 'h2' : `h${level + 1}`;
            sections.push(`<${tag}>${inlineFormat(text)}</${tag}>`);
            i++;
            continue;
        }

        // Horizontal Rule
        if (/^\s*(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
            flushParagraph();
            sections.push('<hr>');
            i++;
            continue;
        }

        // Images
        const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)\s*$/);
        if (imageMatch) {
            flushParagraph();
            sections.push(
                `<img src="${escapeHtml(imageMatch[2])}" alt="${escapeHtml(imageMatch[1])}" class="post-img">`
            );
            i++;
            continue;
        }

        // Blockquotes
        if (/^\s*>\s?/.test(line)) {
            flushParagraph();
            const quoteLines = [];
            while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
                quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
                i++;
            }
            sections.push(`<blockquote><p>${inlineFormat(quoteLines.join(' '))}</p></blockquote>`);
            continue;
        }

        // Unordered Lists
        if (/^\s*[-*+]\s+/.test(line)) {
            flushParagraph();
            const items = [];
            while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
                items.push(`<li>${inlineFormat(lines[i].replace(/^\s*[-*+]\s+/, ''))}</li>`);
                i++;
            }
            sections.push(`<ul>${items.join('')}</ul>`);
            continue;
        }

        // Ordered Lists
        if (/^\s*\d+\.\s+/.test(line)) {
            flushParagraph();
            const items = [];
            while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
                items.push(`<li>${inlineFormat(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`);
                i++;
            }
            sections.push(`<ol>${items.join('')}</ol>`);
            continue;
        }

        // Empty Blank Line (UPDATED LOGIC)
        if (/^\s*$/.test(line)) {
            if (curr.length > 0) {
                // If there's pending text, close the paragraph
                flushParagraph();
            } else if (i > 0 && /^\s*$/.test(lines[i - 1])) {
                // If the previous line was ALSO empty, add a visible break
                sections.push('<br>');
            }
            i++;
            continue;
        }

        // Normal text lines get collected to form a paragraph
        curr.push(line);
        i++;
    }

    flushParagraph();

    const sectionHtml = sections.join('\n');

    const timeHtml = post?.date
        ? `<time datetime="${formatDateForDatetime(post.date)}">${escapeHtml(post.date)}</time>`
        : '';
    const title = post?.title ? escapeHtml(post.title) : '';

    return (
        `<article class="post">` +
            `<header class="post-header"><h1>${title}</h1>${timeHtml}</header>` +
            `<main class="post-content">${sectionHtml}</main>` +
        `</article>`
    );
}