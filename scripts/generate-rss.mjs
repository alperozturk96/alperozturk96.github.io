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
  const d = new Date(Date.UTC(+year, MONTHS[month], +day));
  if (isNaN(d)) return new Date().toUTCString();
  return d.toUTCString();
}

function escapeXml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function makeItem(post) {
  const url = `${SITE_URL}/post/?id=${encodeURIComponent(post.path)}`;
  return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${formatPubDate(post.date)}</pubDate>
      <description>${escapeXml(post.summary)}</description>
    </item>`;
}

async function generate() {
  const items = blogData.map(makeItem).join("\n");

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