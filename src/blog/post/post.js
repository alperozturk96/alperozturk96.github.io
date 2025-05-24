import { blogData } from "../data/blog_data.js";

const params = new URLSearchParams(window.location.search);
const path = params.get("path");
const contentEl = document.getElementById("post-content");

// Match the post based on path
const post = blogData.find(p => p.path === path);

if (!post) {
    contentEl.textContent = "Post not found.";
} else {
    document.title = post.title;

    fetch(post.path)
        .then(res => res.ok ? res.text() : Promise.reject("Fetch failed"))
        .then(markdown => {
            import('https://cdn.jsdelivr.net/npm/marked/marked.min.js').then(({ marked }) => {
                contentEl.innerHTML = marked.parse(markdown);
            });
        })
        .catch(err => {
            contentEl.textContent = "Failed to load post.";
            console.error(err);
        });
}
