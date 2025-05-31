import {blogData} from "../data/blog_data.js";
import {BlogType} from "../data/blog_type.js";

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

function renderPosts(posts, container) {
    container.innerHTML = "";

    posts.forEach(post => {
        const card = document.createElement("div");
        card.className = "blog-card";
        card.dataset.type = post.type;

        card.innerHTML = `
            <div class="card-content">
                <h2>${post.title}</h2>
                <p>${post.summary}</p>
                 <div class="date-label">
                    <p>${post.date}</p>
                </div>
                
                <div class="continue-link">
                    <a href="post/post.html?path=${encodeURIComponent(post.path)}">
                        Continue Reading
                    </a>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

function filterPosts(filterLinks, blogData, container, renderPosts) {
    filterLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            filterLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            const type = link.dataset.filter;
            const filtered = type === BlogType.All ? blogData : blogData.filter(p => p.type === type);
            renderPosts(filtered, container);
        });
    });
}
