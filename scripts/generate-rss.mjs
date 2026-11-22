import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { blogData } from "../blog/data/blog.data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = "https://alperozturk.me";
const AUTHOR = "Alper Öztürk";

const MONTHS = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4,  Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

function formatPubDate(dateString) {
  const [day, month, year] = (dateString || "").split(" ");
  const monthIndex = MONTHS[month?.slice(0, 3)];
  const date = new Date(Date.UTC(Number(year), monthIndex, Number(day)));
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid post date: ${dateString}`);

  return date.toUTCString();
}

function escapeXml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function existingFeedGuids() {
  const rssPath = path.resolve(__dirname, "..", "rss.xml");
  if (!fs.existsSync(rssPath)) return new Map();
  const previousFeed = fs.readFileSync(rssPath, "utf8");
  const guids = new Map();
  for (const [, guid] of previousFeed.matchAll(/<guid\b[^>]*>([^<]+)<\/guid>/g)) {
    const id = new URL(guid.replace(/&amp;/g, "&")).searchParams.get("id");
    if (id) guids.set(id.replace(/\.md$/, ""), guid);
  }

  return guids;
}

function makeItem(post, previousGuids) {
  const url = `${SITE_URL}/post/?id=${encodeURIComponent(post.path)}`;
  const guid = previousGuids.get(post.path.replace(/\.md$/, "")) || url;

  return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${guid}</guid>
      <pubDate>${formatPubDate(post.date)}</pubDate>
      <description>${escapeXml(post.summary)}</description>
    </item>`;
}

async function generate() {
  const previousGuids = existingFeedGuids();
  const items = [...blogData]
    .sort((first, second) => Date.parse(formatPubDate(second.date)) - Date.parse(formatPubDate(first.date)))
    .map(post => makeItem(post, previousGuids))
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(AUTHOR)} - Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>${escapeXml("Latest posts from " + AUTHOR)}</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  const outPath = path.resolve(__dirname, "..", "rss.xml");
  fs.writeFileSync(outPath, rss, { encoding: "utf8" });
  console.log("rss.xml generated at:", outPath);
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});