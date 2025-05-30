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
            makeAllCodeContainersCollapsibleAndExpandable();
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

function makeAllCodeContainersCollapsibleAndExpandable() {
    document.querySelectorAll(".code-container").forEach(container => {
        // Avoid adding the toggle if it already exists
        if (container.querySelector('.toggle-code')) return;

        // Find the <pre> block inside the container
        const pre = container.querySelector('pre');
        if (!pre) return;

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-code';
        toggleBtn.type = 'button';
        toggleBtn.textContent = '\u25BC'; // ▼

        const codeContent = document.createElement('div');
        codeContent.className = 'code-content';

        // Move all children except the toggle button into codeContent
        const children = Array.from(container.children);
        children.forEach(child => {
            if (child !== toggleBtn) {
                codeContent.appendChild(child);
            }
        });

        // Clear container and append toggle and codeContent
        container.innerHTML = '';
        container.appendChild(toggleBtn);
        container.appendChild(codeContent);

        // Partial preview logic: show only first 5 lines by default
        if (pre) {
            const code = pre.querySelector('code');
            if (code) {
                const lines = code.innerHTML.split(/\n/);
                if (lines.length > 5) {
                    code.dataset.full = code.innerHTML;
                    code.dataset.preview = lines.slice(0, 5).join('\n');
                    code.innerHTML = code.dataset.preview + '\n...';
                } else {
                    toggleBtn.style.visibility = "hidden";
                }
            }
        }

        let expanded = false;
        toggleBtn.addEventListener('click', () => {
            const pre = codeContent.querySelector('pre');
            const code = pre ? pre.querySelector('code') : null;
            expanded = !expanded;
            if (expanded) {
                if (code && code.dataset.full) {
                    code.innerHTML = code.dataset.full;
                }
                toggleBtn.textContent = '\u25B2'; // ▲
            } else {
                if (code && code.dataset.preview) {
                    code.innerHTML = code.dataset.preview + '\n...';
                }
                toggleBtn.textContent = '\u25BC'; // ▼
            }
        });
    });
}
