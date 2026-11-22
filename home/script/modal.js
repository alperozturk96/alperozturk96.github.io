import { initImagePreview } from '../../asset/image-preview.js';

initImagePreview(document.getElementById('portfolio'), {
    selector: '.screenshot-img',
    gallerySelector: '.screenshots'
});
