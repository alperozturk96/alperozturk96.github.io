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
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load post content.");
            }
            return response.text();
        })
        .then(html => {
            const postBody = document.createElement("div");
            postBody.innerHTML = html;
            contentEl.appendChild(postBody);

            Prism.highlightAll();
        })
        .catch(error => {
            contentEl.textContent = "Error loading post: " + error.message;
        });
}
