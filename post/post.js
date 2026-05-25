import { blogData } from "../blog/data/blog.data.js";
import { UnicodeIcons } from "../assets/icons/unicode.icons.js";
import { markdownToHtml } from "./markdown.renderer.js";

const params = new URLSearchParams(window.location.search);
const path = params.get("id");
const contentEl = document.getElementById("post-element");
const post = blogData.find(p => p.path === path);

init();

function init() {
    if (!post) {
        contentEl.textContent = "Post not found.";
        return;
    }

    document.title = post.title;

    fetch(post.path)
        .then(response => {
            if (!response.ok) throw new Error("Failed to load post content.");
            return response.text();
        })
        .then(text => {
            contentEl.innerHTML = "";

            const isMarkdown = post.path.endsWith('.md') || /^\s*#/.test(text);
            if (isMarkdown) {
                const html = markdownToHtml(text, post);
                const postBody = document.createElement("div");
                postBody.innerHTML = html;
                contentEl.appendChild(postBody);
            } else {
                const postBody = document.createElement("div");
                postBody.innerHTML = text;
                contentEl.appendChild(postBody);
            }

            makeAllCodeContainersCollapsibleAndExpandable();
            Prism.highlightAll();
            setCopyButtonEvents();
            makeExpandableImages();
        })
        .catch(error => {
            contentEl.textContent = "Error loading post: " + error.message;
        });
}

function makeExpandableImages() {
    const images = document.querySelectorAll('.post-img');
    if (images.length === 0) return;

    if (!document.getElementById('modal-div')) {
        const modalHtml = `
        <div id="modal-div" class="modal" style="display:none;">
            <span class="close">&times;</span>
            <img class="modal-content" id="img01" alt="">
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    const modal = document.getElementById("modal-div");
    const modalImg = document.getElementById("img01");
    const span = modal.querySelector(".close");

    images.forEach(img => {
        img.style.cursor = 'pointer';
        img.onclick = function() {
            modal.style.display = "flex";
            modalImg.src = this.src;
        };
    });

    span.onclick = () => modal.style.display = "none";
    modal.onclick = (event) => {
        if (event.target === modal) modal.style.display = "none";
    };
}

function setCopyButtonEvents() {
    document.querySelectorAll(".copy-button").forEach(button => {
        button.addEventListener("click", async () => {
            const container = button.closest(".code-container");
            const code = container ? container.querySelector("code") : null;
            if (!code) return;

            const textToCopy = code.dataset.rawFull || code.innerText;
            await navigator.clipboard.writeText(textToCopy);

            const originalText = button.innerText;
            button.innerText = "Copied";
            setTimeout(() => button.innerText = originalText, 1500);
        });
    });
}

function makeAllCodeContainersCollapsibleAndExpandable() {
    document.querySelectorAll(".code-container").forEach(container => {
        if (container.querySelector('.toggle-code')) return;

        const pre = container.querySelector('pre');
        if (!pre) return;

        const toggleBtn = document.createElement('button');
        Object.assign(toggleBtn, {
            className: 'toggle-code',
            type: 'button',
            textContent: UnicodeIcons.DownArrow
        });

        const codeContent = document.createElement('div');
        codeContent.className = 'code-content';

        Array.from(container.children).forEach(child => codeContent.appendChild(child));
        container.replaceChildren(toggleBtn, codeContent);

        setupCodePreview(pre, toggleBtn);
        setupToggleEvent(toggleBtn, codeContent);
    });
}

function setupCodePreview(pre, toggleBtn) {
    const code = pre.querySelector('code');
    if (!code) return;

    const rawText = code.textContent;
    const lines = rawText.split('\n');

    if (lines.length > 5) {
        code.dataset.rawFull = rawText;
        code.dataset.rawPreview = lines.slice(0, 5).join('\n') + '\n...';
        code.textContent = code.dataset.rawPreview; // Show shortened text initially
        return;
    }

    toggleBtn.style.visibility = "hidden";
}

function setupToggleEvent(toggleBtn, codeContent) {
    let expanded = false;
    toggleBtn.addEventListener('click', () => {
        const code = codeContent.querySelector('pre code');
        if (!code) return;

        expanded = !expanded;
        code.textContent = expanded ? code.dataset.rawFull : code.dataset.rawPreview;
        toggleBtn.textContent = expanded ? UnicodeIcons.UpArrow : UnicodeIcons.DownArrow;

        if (window.Prism) {
            Prism.highlightElement(code);
        }
    });
}
