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
            configureSwiftHighlighting();
            Prism.highlightAll();
            setCopyButtonEvents();
            makeExpandableImages();
        })
        .catch(error => {
            contentEl.textContent = "Error loading post: " + error.message;
        });
}

function configureSwiftHighlighting() {
    Prism.languages.swift.keyword = [
        Prism.languages.swift.keyword,
        /\b(?:any|borrowing|consuming|each|package|sending)\b/
    ];

    Prism.languages.insertBefore('swift', 'function', {
        'trailing-closure-function': {
            pattern: /(\.)[a-z_]\w*(?=\s*\{)/,
            lookbehind: true,
            alias: 'function'
        }
    });
}

function makeExpandableImages() {
    const images = contentEl.querySelectorAll('.post-img');
    if (images.length === 0) return;

    const dialog = document.createElement('dialog');
    dialog.className = 'post-image-dialog';
    dialog.setAttribute('aria-label', 'Expanded image');
    dialog.innerHTML = `
        <button type="button" class="post-image-dialog-close" aria-label="Close image">
            <span aria-hidden="true">&times;</span>
        </button>
        <img class="post-image-dialog-image" alt="">
    `;
    document.body.appendChild(dialog);

    const expandedImage = dialog.querySelector('img');
    const closeButton = dialog.querySelector('button');

    function openImage(image) {
        expandedImage.src = image.currentSrc || image.src;
        expandedImage.alt = image.alt;
        document.documentElement.classList.add('post-image-open');

        dialog.showModal();
    }

    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;

        dialog.close();
    });
    dialog.addEventListener('close', () => {
        document.documentElement.classList.remove('post-image-open');
    });

    images.forEach(image => {
        image.tabIndex = 0;
        image.setAttribute('role', 'button');
        image.setAttribute('aria-haspopup', 'dialog');
        image.setAttribute('aria-label', `Enlarge image: ${image.alt || 'Article image'}`);
        image.addEventListener('click', () => openImage(image));
        image.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();

            openImage(image);
        });
    });
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
