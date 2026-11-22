import { blogData } from '../data/blog.data.js?v=20261122-audit';
import { BlogType } from '../data/blog.type.js';
import { parsePostDate } from '../data/post-date.js';

const sortedPosts = [...blogData].sort((first, second) => parsePostDate(second.date) - parsePostDate(first.date));
const container = document.getElementById('blog-container');
const filterNav = document.getElementById('filter-nav');

function renderPosts(posts) {
    if (!container) return;
    const fragment = document.createDocumentFragment();
    for (const post of posts) {
        const card = document.createElement('article');
        card.className = 'blog-card card';
        card.dataset.type = post.type;
        const content = document.createElement('div');
        content.className = 'card-content';
        const title = document.createElement('h2');
        title.textContent = post.title;
        const date = document.createElement('time');
        date.className = 'blog-date';
        date.textContent = post.date;
        date.dateTime = parsePostDate(post.date).toISOString().slice(0, 10);
        const summary = document.createElement('p');
        summary.textContent = post.summary;
        const links = document.createElement('div');
        links.className = 'external-link';
        const link = document.createElement('a');
        link.href = `/post?id=${encodeURIComponent(post.path)}`;
        link.textContent = 'Continue Reading';
        links.appendChild(link);
        content.append(title, date, summary, links);
        card.appendChild(content);
        fragment.appendChild(card);
    }

    container.replaceChildren(fragment);
}

function initFilters() {
    if (!filterNav) return;
    const knownTypes = new Set(Object.values(BlogType));
    const types = [...new Set(blogData.flatMap(post => post.type))].filter(type => knownTypes.has(type) && type !== BlogType.All);
    const fragment = document.createDocumentFragment();
    for (const type of [BlogType.All, ...types]) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.dataset.filter = type;
        link.textContent = type;
        if (type === BlogType.All) {
            link.className = 'active';
            link.setAttribute('aria-current', 'true');
        }
        item.appendChild(link);
        fragment.appendChild(item);
    }
    filterNav.replaceChildren(fragment);
    filterNav.addEventListener('click', event => {
        const link = event.target instanceof Element ? event.target.closest('a[data-filter]') : null;
        if (!link || !filterNav.contains(link)) return;
        event.preventDefault();
        const previous = filterNav.querySelector('.active');
        previous?.classList.remove('active');
        previous?.removeAttribute('aria-current');
        link.classList.add('active');
        link.setAttribute('aria-current', 'true');
        const type = link.dataset.filter;

        renderPosts(type === BlogType.All ? sortedPosts : sortedPosts.filter(post => [post.type].flat().includes(type)));
    });
}

renderPosts(sortedPosts);
initFilters();
