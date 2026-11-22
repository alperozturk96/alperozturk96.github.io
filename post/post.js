import { blogData } from '../blog/data/blog.data.js?v=20261122-audit';
import { initImagePreview } from '../asset/image-preview.js';
import { markdownToHtml } from './markdown.renderer.js?v=20261122-audit';

const contentEl = document.getElementById('post-element');
const path = new URLSearchParams(window.location.search).get('id');
const slug = path?.replace(/(?:\/index\.html|\.md|\/)$/, '');
const post = blogData.find(post => post.path.replace(/\.md$/, '') === slug);
const collapsedIcon = '\u25BC';
const expandedIcon = '\u25B2';
const previewLineCount = 5;
const copyFeedbackDuration = 1500;
const copyTimers = new WeakMap();
const allowedTags = new Set('ARTICLE HEADER MAIN H1 H2 H3 H4 H5 H6 TIME P A STRONG EM CODE PRE DIV BUTTON IMG VIDEO SOURCE EMBED UL OL LI BLOCKQUOTE HR BR'.split(' '));
const allowedAttributes = new Set('class src href alt type width height controls preload loop muted autoplay playsinline poster datetime title style loading decoding'.split(' '));
let swiftConfigured = false;

function safeUrl(value, protocols) {
    try {
        return protocols.includes(new URL(value, location.href).protocol);
    } catch {
        return false;
    }
}

function prepareContent(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    for (const element of template.content.querySelectorAll('*')) {
        if (!allowedTags.has(element.tagName)) {
            element.remove();
            continue;
        }
        for (const attribute of [...element.attributes]) {
            if (!allowedAttributes.has(attribute.name)) element.removeAttribute(attribute.name);
        }
        for (const attribute of ['href', 'src', 'poster']) {
            if (!element.hasAttribute(attribute)) continue;
            const protocols = attribute === 'href' ? ['http:', 'https:', 'mailto:', 'tel:'] : ['http:', 'https:'];
            if (!safeUrl(element.getAttribute(attribute), protocols)) element.removeAttribute(attribute);
        }
        if (element.hasAttribute('style')) {
            const style = element.style;
            const dimensions = [...style].filter(name => ['width', 'height', 'max-width', 'max-height'].includes(name))
                .map(name => [name, style.getPropertyValue(name)])
                .filter(([, value]) => /^(?:auto|\d+(?:\.\d+)?(?:px|%|rem|em|vh|vw)?)$/.test(value));
            element.removeAttribute('style');
            for (const [name, value] of dimensions) element.style.setProperty(name, value);
        }
        if (element.tagName === 'BUTTON') element.type = 'button';
    }
    template.content.querySelectorAll('.post-img').forEach((image, index) => {
        image.loading = index === 0 ? 'eager' : 'lazy';
        image.decoding = 'async';
    });
    template.content.querySelectorAll('video').forEach(video => { video.preload = 'metadata'; });

    return template.content;
}

function updateMetadata() {
    const url = new URL('/post/', 'https://alperozturk.me');
    url.searchParams.set('id', post.path);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
    }
    canonical.href = url.href;
    const description = post.summary || contentEl.querySelector('.post-content p')?.textContent.trim() || '';
    for (const [name, content] of [['description', description], ['og:title', post.title], ['og:description', description], ['og:type', 'article'], ['og:url', url.href]]) {
        const attribute = name.startsWith('og:') ? 'property' : 'name';
        let meta = document.querySelector(`meta[${attribute}="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attribute, name);
            document.head.appendChild(meta);
        }
        meta.content = content;
    }
}

async function init() {
    if (!contentEl) return;
    if (!post) {
        contentEl.textContent = 'Post not found.';
        contentEl.setAttribute('aria-busy', 'false');
        const robots = document.querySelector('meta[name="robots"]');
        if (robots) robots.content += ', noindex';
        return;
    }
    document.title = post.title;
    contentEl.setAttribute('aria-busy', 'true');
    try {
        const response = await fetch(`/post/${post.path}`);
        if (!response.ok) throw new Error('Failed to load post content.');
        const text = await response.text();
        contentEl.replaceChildren(prepareContent(markdownToHtml(text, post)));
        prepareCodeControls();
        highlightCode();
        if (!window.Prism) {
            document.querySelector('script[src*="prism.js"]')?.addEventListener('load', highlightCode, { once: true });
        }
        updateMetadata();
        initImagePreview(contentEl, { selector: '.post-img' });
    } catch (error) {
        const message = document.createElement('p');
        message.setAttribute('role', 'alert');
        message.textContent = `Error loading post: ${error.message}`;
        contentEl.replaceChildren(message);
    } finally {
        contentEl.setAttribute('aria-busy', 'false');
    }
}

function highlightCode() {
    if (!window.Prism) return;
    configureSwiftHighlighting();

    Prism.highlightAllUnder(contentEl);
}

function configureSwiftHighlighting() {
    if (swiftConfigured || !Prism.languages.swift) return;
    swiftConfigured = true;
    Prism.languages.swift.keyword = [Prism.languages.swift.keyword, /\b(?:any|borrowing|consuming|each|package|sending)\b/];

    Prism.languages.insertBefore('swift', 'function', {
        'trailing-closure-function': {
            pattern: /(\.)[a-z_]\w*(?=\s*\{)/,
            lookbehind: true,
            alias: 'function'
        }
    });
}

function prepareCodeControls() {
    contentEl.querySelectorAll('.code-container').forEach((container, index) => {
        const pre = container.querySelector('pre');
        const code = pre?.querySelector('code');
        if (!code) return;
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'toggle-code';
        toggle.textContent = collapsedIcon;
        toggle.setAttribute('aria-label', 'Expand code');
        toggle.setAttribute('aria-expanded', 'false');
        const content = document.createElement('div');
        content.className = 'code-content';
        content.id = `code-content-${index}`;
        toggle.setAttribute('aria-controls', content.id);
        content.append(...container.childNodes);
        container.replaceChildren(toggle, content);
        const raw = code.textContent;
        const lines = raw.split('\n');
        if (lines.length <= previewLineCount) {
            toggle.style.visibility = 'hidden';
            return;
        }
        code.dataset.rawFull = raw;
        code.dataset.rawPreview = lines.slice(0, previewLineCount).join('\n') + '\n...';

        code.textContent = code.dataset.rawPreview;
    });
}

function toggleCode(button) {
    const code = button.closest('.code-container')?.querySelector('pre code');
    if (!code || code.dataset.rawFull === undefined) return;
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    code.textContent = expanded ? code.dataset.rawFull : code.dataset.rawPreview;
    button.textContent = expanded ? expandedIcon : collapsedIcon;
    button.setAttribute('aria-label', expanded ? 'Collapse code' : 'Expand code');
    button.setAttribute('aria-expanded', String(expanded));

    if (window.Prism) Prism.highlightElement(code);
}

async function copyCode(button) {
    const code = button.closest('.code-container')?.querySelector('pre code');
    if (!code || button.disabled) return;
    clearTimeout(copyTimers.get(button));
    button.disabled = true;
    try {
        await navigator.clipboard.writeText(code.dataset.rawFull ?? code.textContent);
        button.textContent = 'Copied';
    } catch {
        button.textContent = 'Copy failed';
    } finally {
        button.disabled = false;
        copyTimers.set(button, setTimeout(() => { button.textContent = 'Copy'; }, copyFeedbackDuration));
    }
}

contentEl?.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest('.toggle-code, .copy-button') : null;
    if (!button || !contentEl.contains(button)) return;
    if (button.classList.contains('toggle-code')) {
        toggleCode(button);
        return;
    }

    void copyCode(button);
});

void init();
