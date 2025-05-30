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
            setCopyButtonEvents();
        })
        .catch(error => {
            contentEl.textContent = "Error loading post: " + error.message;
        });
}

function setCopyButtonEvents() {
    document.querySelectorAll(".copy-button").forEach(button => {
        button.addEventListener("click", async () => {
            const code = button.parentElement.querySelector("code");
            if (!code) return;

            await navigator.clipboard.writeText(code.innerText);

            const originalText = button.innerText;
            button.innerText = "Copied";
            setTimeout(() => button.innerText = originalText, 1500);
        });
    });
}
