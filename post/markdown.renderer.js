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
        let html = '';
        let plain = '';
        let index = 0;

        function flushText() {
            html += escapeHtml(plain);
            plain = '';
        }

        function closingMarker(marker, start) {
            let position = text.indexOf(marker, start);
            while (position !== -1) {
                let escapes = 0;
                for (let previous = position - 1; previous >= 0 && text[previous] === '\\'; previous--) escapes++;
                if (escapes % 2 === 0) return position;
                position = text.indexOf(marker, position + marker.length);
            }

            return -1;
        }

        while (index < text.length) {
            const character = text[index];
            if (character === '\\' && /[\\`*\[\]()#+.!>|_{}-]/.test(text[index + 1] || '')) {
                plain += text[index + 1];
                index += 2;
                continue;
            }
            if (character === '\n') {
                if (/ {2}$/.test(plain)) {
                    plain = plain.trimEnd();
                    flushText();
                    html += '<br>';
                } else {
                    plain += ' ';
                }
                index++;
                continue;
            }
            if (character === '`') {
                const marker = /^`+/.exec(text.slice(index))[0];
                const end = text.indexOf(marker, index + marker.length);
                if (end !== -1) {
                    let code = text.slice(index + marker.length, end).replace(/\n/g, ' ');
                    if (code.startsWith(' ') && code.endsWith(' ') && /\S/.test(code)) code = code.slice(1, -1);
                    flushText();
                    html += `<code>${escapeHtml(code)}</code>`;
                    index = end + marker.length;
                    continue;
                }
            }
            if (character === '[') {
                const labelEnd = closingMarker(']', index + 1);
                if (labelEnd !== -1 && text[labelEnd + 1] === '(') {
                    const start = labelEnd + 2;
                    let end = start;
                    let destination = '';
                    if (text[start] === '<') {
                        const angleEnd = text.indexOf('>', start + 1);
                        if (angleEnd !== -1 && text[angleEnd + 1] === ')') {
                            destination = text.slice(start + 1, angleEnd);
                            end = angleEnd + 1;
                        }
                    } else {
                        let depth = 1;
                        for (; end < text.length && depth > 0; end++) {
                            if (text[end] === '\\') { end++; continue; }
                            if (text[end] === '(') depth++;
                            if (text[end] === ')') depth--;
                        }
                        if (depth === 0) {
                            end--;
                            destination = text.slice(start, end).trim();
                        }
                    }
                    if (destination) {
                        flushText();
                        html += `<a href="${escapeHtml(destination)}">${inlineFormat(text.slice(index + 1, labelEnd))}</a>`;
                        index = end + 1;
                        continue;
                    }
                }
            }
            if (character === '*') {
                const marker = text[index + 1] === '*' ? '**' : '*';
                const end = closingMarker(marker, index + marker.length);
                if (end > index + marker.length) {
                    const tag = marker.length === 2 ? 'strong' : 'em';
                    flushText();
                    html += `<${tag}>${inlineFormat(text.slice(index + marker.length, end))}</${tag}>`;
                    index = end + marker.length;
                    continue;
                }
            }
            plain += character;
            index++;
        }
        flushText();

        return html;
    }

    function flushParagraph() {
        if (curr.length === 0) return;
        sections.push(`<p>${inlineFormat(curr.join('\n'))}</p>`);
        curr = [];
    }

    function formatDateForDatetime(dateStr) {
        const m = dateStr.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
        if (m) {
            const months = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
                            jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
            const month = months[m[2].slice(0, 3).toLowerCase()] || '01';
            return `${m[3]}-${month}-${m[1].padStart(2, '0')}`;
        }
        const parsed = Date.parse(dateStr);

        return Number.isNaN(parsed) ? dateStr : new Date(parsed).toISOString().split('T')[0];
    }

    while (i < lines.length) {
        const line = lines[i];

        // Code Fences
        const fenceMatch = line.match(/^(`{3,})\s*([\w\-+#.]*)\s*$/);
        if (fenceMatch) {
            flushParagraph();
            const fence = fenceMatch[1];
            const lang = fenceMatch[2] || '';
            i++;
            const codeLines = [];
            while (i < lines.length && lines[i].trim() !== fence) {
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

        // Native media embeds remain valid inside Markdown posts.
        if (/^\s*<video\b/.test(line)) {
            flushParagraph();
            const mediaLines = [line];
            while (!mediaLines.at(-1).includes('</video>') && ++i < lines.length) mediaLines.push(lines[i]);
            sections.push(mediaLines.join('\n'));
            i++;
            continue;
        }
        if (/^\s*<(?:img|embed)\b[^>]*>\s*$/.test(line)) {
            flushParagraph();
            sections.push(line.trim());
            i++;
            continue;
        }

        // Headings
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            flushParagraph();
            const level = headingMatch[1].length;
            const text  = headingMatch[2];
            const tag = `h${Math.min(level + 1, 6)}`;
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
            sections.push(`<ul>${items.join('\n')}</ul>`);
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
            sections.push(`<ol>${items.join('\n')}</ol>`);
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
    const title = escapeHtml(post?.heading || post?.title || '');

    return (
        `<article class="post">` +
            `<header class="post-header"><h1>${title}</h1>${timeHtml}</header>` +
            `<main class="post-content">${sectionHtml}</main>` +
        `</article>`
    );
}