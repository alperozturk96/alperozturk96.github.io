import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blogData } from '../blog/data/blog.data.js';
import { parsePostDate } from '../blog/data/post-date.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const feedPath = path.join(root, 'rss.xml');
const siteUrl = 'https://alperozturk.me';
const author = 'Alper Öztürk';

function escapeXml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function decodeXml(value) {
    const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

    return value.replace(/&(amp|lt|gt|quot|apos);/g, (_, entity) => entities[entity]);
}

function previousGuids(feed) {
    const guids = new Map();
    for (const [item] of feed.matchAll(/<item>[\s\S]*?<\/item>/g)) {
        const link = /<link>([^<]+)<\/link>/.exec(item)?.[1];
        const guid = /<guid\b([^>]*)>([^<]+)<\/guid>/.exec(item);
        if (!link || !guid) continue;
        const id = new URL(decodeXml(link)).searchParams.get('id');
        if (!id) continue;
        guids.set(id.replace(/\.md$/, ''), {
            value: decodeXml(guid[2]),
            isPermaLink: !/isPermaLink=["']false["']/.test(guid[1])
        });
    }

    return guids;
}

function generate() {
    const previousFeed = fs.existsSync(feedPath) ? fs.readFileSync(feedPath, 'utf8') : '';
    const previous = previousGuids(previousFeed);
    const paths = new Set();
    const guids = new Set();
    const posts = blogData.map(post => {
        if (!post.title || typeof post.path !== 'string' || path.basename(post.path) !== post.path || !post.path.endsWith('.md')) {
            throw new Error(`Invalid post metadata: ${post.title}`);
        }
        if (paths.has(post.path)) throw new Error(`Duplicate post: ${post.path}`);
        if (!fs.statSync(path.join(root, 'post', post.path)).isFile()) throw new Error(`Missing post: ${post.path}`);
        paths.add(post.path);
        const url = `${siteUrl}/post/?id=${encodeURIComponent(post.path)}`;
        const guid = previous.get(post.path.replace(/\.md$/, '')) || { value: url, isPermaLink: true };
        if (guids.has(guid.value)) throw new Error(`Duplicate RSS GUID: ${guid.value}`);
        guids.add(guid.value);

        return { post, url, guid, date: parsePostDate(post.date) };
    }).sort((first, second) => second.date - first.date);
    const items = posts.map(({ post, url, guid, date }) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="${guid.isPermaLink}">${escapeXml(guid.value)}</guid>
      <pubDate>${date.toUTCString()}</pubDate>
      <description>${escapeXml(post.summary)}</description>
    </item>`).join('\n');
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(author)} - Blog</title>
    <link>${siteUrl}/blog</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>${escapeXml(`Latest posts from ${author}`)}</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
    const withoutBuildDate = feed => feed.replace(/<lastBuildDate>[^<]*<\/lastBuildDate>/, '');
    if (withoutBuildDate(previousFeed) === withoutBuildDate(rss)) {
        console.log('RSS feed is unchanged.');
        return;
    }
    fs.writeFileSync(feedPath, rss, 'utf8');

    console.log('RSS feed updated.');
}

try {
    generate();
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
