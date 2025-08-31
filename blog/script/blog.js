import {blogData} from "../data/blog.data.js";
import {BlogType} from "../data/blog.type.js";

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("blog-container");
    renderPosts(blogData, container);

    const filterNav = document.getElementById("filter-nav");
    const types = getExistingBlogTypes();

    if (types.length > 0) {
        addSubNavBar(filterNav, types);
        const filterLinks = filterNav.querySelectorAll("a");
        filterPosts(filterLinks, blogData, container, renderPosts);
    }
});

function getExistingBlogTypes() {
    const knownTypes = new Set(Object.values(BlogType).filter(t => t !== BlogType.All));
    const foundTypes = new Set();

    for (let i = 0; i < blogData.length; i++) {
        const type = blogData[i].type;
        if (knownTypes.has(type)) {
            foundTypes.add(type);
        }

        if (foundTypes.size === knownTypes.size) {
            // All found, exit early
            break;
        }
    }

    return Array.from(foundTypes);
}

function addSubNavBar(filterNav, types) {
    filterNav.innerHTML = `<li><a href="#" class="active" data-filter=${BlogType.All}>${BlogType.All}</a></li>`;

    types.forEach(type => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="#" data-filter="${type}">${type}</a>`;
        filterNav.appendChild(li);
    });
}

// Cache for sorted posts
let sortedPostsCache = null;
let sortedPostsCacheKey = '';

function renderPosts(posts, container) {
    container.innerHTML = "";
    // Cache sorted posts by reference
    const cacheKey = posts === blogData ? 'all' : JSON.stringify(posts.map(p => p.path));
    let sorted;
    if (sortedPostsCache && sortedPostsCacheKey === cacheKey) {
        sorted = sortedPostsCache;
    } else {
        sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
        sortedPostsCache = sorted;
        sortedPostsCacheKey = cacheKey;
    }
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < sorted.length; i++) {
        const post = sorted[i];
        const card = document.createElement("div");
        card.className = "blog-card";
        card.dataset.type = post.type;
        card.innerHTML = `
            <div class="card-content">
                <h2>${post.title}</h2>
                <p>${post.summary}</p>
                <div class="external-link">
                   <a href="/post/index.html?path=${post.path}">
                        Continue Reading
                    </a>
                </div>
            </div>
        `;
        fragment.appendChild(card);
    }
    container.appendChild(fragment);
}

// Use event delegation for filter links
function filterPosts(filterLinks, blogData, container, renderPosts) {
    const filterNav = filterLinks[0]?.closest('ul') || document.getElementById('filter-nav');

    // Remove previous event listeners by replacing parent node
    const newNav = filterNav.cloneNode(true);
    filterNav.parentNode.replaceChild(newNav, filterNav);
    newNav.addEventListener('click', function (e) {
        const link = e.target.closest('a[data-filter]');
        if (!link) return;
        e.preventDefault();
        Array.from(newNav.querySelectorAll('a')).forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const type = link.dataset.filter;
        const filtered = type === BlogType.All ? blogData : blogData.filter(p => p.type === type);
        renderPosts(filtered, container);
    }, {passive: true});
}
