import { blogData } from "../blog/data/blog.data.js";
import {UnicodeIcons} from "../assets/icons/unicode.icons.js";

const params = new URLSearchParams(window.location.search);
const path = params.get("id");
const contentEl = document.getElementById("post-element");
const post = blogData.find(p => p.path === path);


init()

function init() {
    if (post) {
        document.title = post.title;

        fetch(post.path)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to load post content.");
                }
                return response.text();
            })
            .then(html => {
                contentEl.innerHTML = "";
                const postBody = document.createElement("div");
                postBody.innerHTML = html;
                contentEl.appendChild(postBody);

                Prism.highlightAll();
                setCopyButtonEvents();
                makeAllCodeContainersCollapsibleAndExpandable();
                makeExpandableImages();
            })
            .catch(error => {
                contentEl.textContent = "Error loading post: " + error.message;
            });
        return;
    }

    contentEl.textContent = "Post not found.";
}

function makeExpandableImages() {
    const images = document.querySelectorAll('.post-img');
    if (images.length === 0) return;

    if (!document.getElementById('modal-div')) {
        const modalHtml = `
        <div id="modal-div" class="modal">
            <span class="close">&times;</span>
            <img class="modal-content" id="img01" alt="">
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    const modal = document.getElementById("modal-div");
    const modalImg = document.getElementById("img01");
    const span = document.getElementsByClassName("close")[0];

    images.forEach(img => {
        img.style.cursor = 'pointer';
        img.onclick = function() {
            modal.style.display = "flex";
            modalImg.src = this.src;
        };
    });

    span.onclick = function() {
        modal.style.display = "none";
    };

    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
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
        if (container.querySelector('.toggle-code')) return;

        const pre = container.querySelector('pre');
        if (!pre) return;

        const buttonElement = document.createElement('button');
        const toggleBtn = Object.assign(buttonElement, {
            className: 'toggle-code',
            type: 'button',
            textContent: UnicodeIcons.DownArrow
        });

        const divElement = document.createElement('div');
        const codeContent = Object.assign(divElement, {
            className: 'code-content'
        });

        // Move all children into codeContent
        Array.from(container.children).forEach(child => codeContent.appendChild(child));

        container.replaceChildren(toggleBtn, codeContent);

        setupCodePreview(pre, toggleBtn);
        setupToggleEvent(toggleBtn, codeContent);
    });
}

function setupCodePreview(pre, toggleBtn) {
    const code = pre.querySelector('code');
    if (!code) return;

    const lines = code.innerHTML.split('\n');
    if (lines.length > 5) {
        Object.assign(code.dataset, {
            full: code.innerHTML,
            preview: lines.slice(0, 5).join('\n')
        });
        code.innerHTML = code.dataset.preview + '\n...';
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
        code.innerHTML = expanded ? code.dataset.full : code.dataset.preview + '\n...';
        toggleBtn.textContent = expanded ? UnicodeIcons.UpArrow : UnicodeIcons.DownArrow;
    });
}
