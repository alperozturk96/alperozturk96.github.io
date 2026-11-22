const initializedRoots = new WeakSet();
let dialog;
let preview;
let controls;
let images = [];
let currentIndex = 0;
let opener;
let wasLocked = false;

function updateImage() {
    const image = images[currentIndex];
    preview.src = image.currentSrc || image.src;

    preview.alt = image.alt;
}

function moveImage(offset) {
    if (images.length < 2) return;
    currentIndex = (currentIndex + offset + images.length) % images.length;

    updateImage();
}

function createDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'post-image-dialog';
    dialog.setAttribute('aria-label', 'Expanded image');
    dialog.innerHTML = `
        <div class="post-image-dialog-toolbar">
            <div class="post-image-dialog-controls" hidden>
                <button type="button" class="post-image-dialog-action" aria-label="Previous image">‹</button>
                <button type="button" class="post-image-dialog-action" aria-label="Next image">›</button>
            </div>
            <button type="button" class="post-image-dialog-close" aria-label="Close image">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <img class="post-image-dialog-image" alt="">
    `;
    document.body.appendChild(dialog);
    preview = dialog.querySelector('img');
    controls = dialog.querySelector('.post-image-dialog-controls');
    dialog.querySelector('[aria-label="Previous image"]').addEventListener('click', () => moveImage(-1));
    dialog.querySelector('[aria-label="Next image"]').addEventListener('click', () => moveImage(1));
    dialog.querySelector('.post-image-dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;

        dialog.close();
    });
    dialog.addEventListener('keydown', event => {
        if (images.length < 2) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();

        moveImage(event.key === 'ArrowLeft' ? -1 : 1);
    });
    dialog.addEventListener('close', () => {
        if (!wasLocked) document.documentElement.classList.remove('post-image-open');
        preview.removeAttribute('src');
        images = [];

        opener?.focus({ preventScroll: true });
    });
}

export function initImagePreview(root, { selector, gallerySelector } = {}) {
    if (!root || !selector) return;
    const interactiveImages = root.querySelectorAll(selector);
    if (interactiveImages.length === 0) return;
    interactiveImages.forEach(image => {
        image.classList.add('image-preview-trigger');
        image.tabIndex = 0;
        image.setAttribute('role', 'button');
        image.setAttribute('aria-haspopup', 'dialog');
        image.setAttribute('aria-label', `Enlarge image: ${image.alt || 'Article image'}`);
    });
    if (initializedRoots.has(root)) return;
    initializedRoots.add(root);

    function openImage(image) {
        createDialog();
        const gallery = gallerySelector ? image.closest(gallerySelector) : null;
        images = gallery ? [...gallery.querySelectorAll(selector)] : [image];
        currentIndex = images.indexOf(image);
        controls.hidden = images.length < 2;
        updateImage();
        if (dialog.open) return;
        opener = image;
        opener.focus({ preventScroll: true });
        wasLocked = document.documentElement.classList.contains('post-image-open');
        document.documentElement.classList.add('post-image-open');

        dialog.showModal();
    }

    root.addEventListener('click', event => {
        const image = event.target instanceof Element ? event.target.closest(selector) : null;
        if (!image || !root.contains(image)) return;
        event.preventDefault();

        openImage(image);
    });
    root.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (!(event.target instanceof Element) || !event.target.matches(selector)) return;
        event.preventDefault();

        openImage(event.target);
    });
}
