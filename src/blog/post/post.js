import { blogData } from "../data/blog_data.js";

const params = new URLSearchParams(window.location.search);
const path = params.get("path");
const contentEl = document.getElementById("post-content");

const post = blogData.find(p => p.path === path);

if (!post) {
    contentEl.textContent = "Post not found.";
} else {
    document.title = post.title;

    fetch(post.path)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text();
        })
        .then(markdown => {
            contentEl.innerHTML = marked.parse(markdown);
        })
        .catch(err => {
            contentEl.textContent = "Failed to load post.";
            console.error("Error:", err);
        });
}
