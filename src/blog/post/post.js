import { blogData } from "../data/blog_data.js";

const params = new URLSearchParams(window.location.search);
const path = params.get("path");
const contentEl = document.getElementById("post-content");

const post = blogData.find(p => p.path === path);

if (!post) {
    contentEl.textContent = "Post not found.";
} else {
    setCopyButtonEvents();
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

function setCopyButtonEvents() {
    document.querySelectorAll(".copy-button").forEach(button => {
        button.addEventListener("click", async () => {
            const code = button.parentElement.querySelector("code");
            if (!code) return;

            await navigator.clipboard.writeText(code.innerText);

            const originalIcon = button.innerHTML;
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="copy-icon" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.485 1.929a1 1 0 0 1 1.415 1.414l-7.778 7.778a1 1 0 0 1-1.414 0L1.1 7.929a1 1 0 1 1 1.414-1.414L6.414 10.1l7.071-7.071z"/>
            </svg>`;

            setTimeout(() => button.innerHTML = originalIcon, 1500);
        });
    });
}
