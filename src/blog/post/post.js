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

            // Make all .code-container blocks collapsible/expandable for all articles
            document.querySelectorAll(".code-container").forEach(container => {
                // Avoid adding the toggle if it already exists
                if (container.querySelector('.toggle-code')) return;
                // Find the <pre> block inside the container
                const pre = container.querySelector('pre');
                if (!pre) return;
                // Create the toggle button
                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'toggle-code';
                toggleBtn.type = 'button';
                toggleBtn.textContent = 'Show Code';
                // Create code content div
                const codeContent = document.createElement('div');
                codeContent.className = 'code-content';
                codeContent.style.display = 'none';
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
                // Toggle logic
                toggleBtn.addEventListener('click', () => {
                    const isHidden = codeContent.style.display === 'none';
                    codeContent.style.display = isHidden ? 'block' : 'none';
                    toggleBtn.textContent = isHidden ? 'Hide Code' : 'Show Code';
                });
            });
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
