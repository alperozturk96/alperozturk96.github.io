import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { blogData } from '../blog/data/blog.data.js';
import { markdownToHtml } from '../post/markdown.renderer.js';

const root = new URL('../', import.meta.url);

function render(markdown) {
    return markdownToHtml(markdown, { title: 'Example', date: '22 November 2026' });
}

test('reference links preserve parentheses in API URLs', () => {
    const html = render('[Delegate](https://example.test/delegate(_:)) and [View](<https://example.test/view(for:destination:)>)');

    assert.ok(html.includes('<a href="https://example.test/delegate(_:)">Delegate</a>'));
    assert.ok(html.includes('<a href="https://example.test/view(for:destination:)">View</a>'));
});

test('inline code preserves Markdown punctuation without creating emphasis', () => {
    const html = render('Use `A * B [value]` and **`Array<Int>`**.');

    assert.ok(html.includes('<code>A * B [value]</code>'));
    assert.ok(html.includes('<strong><code>Array&lt;Int&gt;</code></strong>'));
    assert.equal((html.match(/<em>/g) || []).length, 0);
});

test('literal list markers remain paragraphs', () => {
    const html = render('\\- Keep this paragraph.\n\n1\\. Keep this one too.');

    assert.ok(html.includes('<p>- Keep this paragraph.</p>'));
    assert.ok(html.includes('<p>1. Keep this one too.</p>'));
    assert.ok(!html.includes('<ul>') && !html.includes('<ol>'));
});

test('hard line breaks and ordinary wrapped paragraphs render differently', () => {
    const html = render('First line  \nSecond line\n\nWrapped\nparagraph');

    assert.ok(html.includes('<p>First line<br>Second line</p>'));
    assert.ok(html.includes('<p>Wrapped paragraph</p>'));
});

test('longer fences retain embedded backticks and exact code whitespace', () => {
    const code = '\nlet text = "```"\n\n';
    const html = render(`\`\`\`\`swift\n${code}\n\`\`\`\``);

    assert.ok(html.includes(`${code.replaceAll('"', '&quot;')}</code>`));
    assert.ok(html.includes('language-swift'));
});

test('native video, PDF, and sized image embeds survive Markdown rendering', () => {
    const video = '<video class="video" controls>\n    <source src="/asset/example/demo.mp4" type="video/mp4">\n    Video fallback\n</video>';
    const pdf = '<embed src="/asset/example/document.pdf" width="420" height="600" type="application/pdf">';
    const image = '<img class="post-img" src="/asset/example/screenshot.png" style="max-width:300px; height:auto;" alt="Example">';
    const html = render(`${video}\n\n${pdf}\n\n${image}`);

    assert.ok(html.includes(video));
    assert.ok(html.includes(pdf));
    assert.ok(html.includes(image));
});

test('display headings and dates remain independent from the blog-list title', () => {
    const html = markdownToHtml('# Section', { title: 'List title', heading: 'Article heading', date: '22 November 2026' });

    assert.ok(html.includes('<h1>Article heading</h1>'));
    assert.ok(html.includes('datetime="2026-11-22"'));
    assert.ok(html.includes('<h2>Section</h2>'));
});

test('ordinary HTML-looking prose stays escaped', () => {
    const html = render('An example: <script>alert("test")</script>');

    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(!html.includes('<script>'));
});

test('every registered article has one Markdown source in post/', async () => {
    const files = await readdir(new URL('post/', root), { withFileTypes: true });
    const markdownFiles = files.filter(file => file.isFile() && file.name.endsWith('.md')).map(file => file.name).sort();
    const registered = blogData.map(post => post.path).sort();
    assert.equal(new Set(registered).size, registered.length);
    assert.ok(registered.every(path => path.endsWith('.md')));
    assert.deepEqual(markdownFiles, registered);

    assert.deepEqual(files.filter(file => file.isFile() && file.name.endsWith('.html')).map(file => file.name), ['index.html']);
});

test('all post media references resolve inside asset/', async () => {
    const referenced = new Set();
    for (const post of blogData) {
        const markdown = await readFile(new URL(`post/${post.path}`, root), 'utf8');
        for (const [, relative] of markdown.matchAll(/(?:\]\(|(?:src|href)=")(?<path>\/asset\/[^\s"<>)]*)/g)) {
            referenced.add(relative);
            await readFile(new URL(relative.slice(1), root));
        }
        assert.ok(!/(?:src|href)="\/post\/[^"\n]+\.(?:png|jpe?g|mp4|webm|pdf)|!\[[^\]]*\]\(\/post\//i.test(markdown), `${post.path} still refers to old media paths`);
    }
    const folders = await readdir(new URL('asset/', root), { withFileTypes: true });
    const stored = [];
    for (const folder of folders) {
        for (const file of await readdir(new URL(`asset/${folder.name}/`, root))) stored.push(`/asset/${folder.name}/${file}`);
    }

    assert.deepEqual([...referenced].sort(), stored.sort());
});
