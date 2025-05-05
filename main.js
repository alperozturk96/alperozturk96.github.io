
const techIcons = {
  'Kotlin': 'techStacks/Kotlin.svg',
  'Jetpack Compose': 'techStacks/JetpackCompose.png',
  'Swift': 'techStacks/Swift.webp',
  'SwiftUI': 'techStacks/SwiftUI.png',
  'Java': 'techStacks/Java.svg',
  'XML': 'techStacks/XML.svg',
  'UIKit': 'techStacks/UIKit.jpeg',
  'Dart': 'techStacks/Dart.svg',
  'Flutter': 'techStacks/Flutter.png',
  'Objective-C': 'techStacks/ObjectiveC.webp',
};

import { professionalProjects } from './projects/professionalProjects.js';
import { personalProjects } from './projects/personalProjects.js';


//


window.addEventListener('DOMContentLoaded', function() {
  const main = document.getElementById('portfolio');

  function renderSection(title, projects) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    heading.style.marginTop = '2.5rem';
    heading.style.marginBottom = '1.2rem';
    main.appendChild(heading);
    projects.forEach(project => {
      const section = document.createElement('section');
      section.className = 'project-section';
      // Title
      section.innerHTML = `<div class="project-title">${project.name}</div>`;
      // Description
      const desc = document.createElement('div');
      desc.className = 'project-desc';
      desc.innerHTML = project.description;
      section.appendChild(desc);
      // Tech stack
      const techDiv = document.createElement('div');
      techDiv.className = 'tech-stack';
      project.tech.forEach(tech => {
        const icon = document.createElement('img');
        icon.className = 'tech-icon';
        icon.src = techIcons[tech] || '';
        icon.alt = tech + ' icon';
        techDiv.appendChild(icon);
        const span = document.createElement('span');
        span.textContent = tech;
        techDiv.appendChild(span);
      });
      section.appendChild(techDiv);

      if (project.type === 'professional') {
        // Show link only (if provided)
        if (Array.isArray(project.links) && project.links.length) {
          const linksDiv = document.createElement('div');
          linksDiv.className = 'project-links';
          project.links.forEach(linkObj => {
            const btn = document.createElement('a');
            btn.className = 'project-link-btn';
            btn.href = linkObj.url;
            btn.target = '_blank';
            btn.rel = 'noopener';
            btn.textContent = linkObj.label;
            linksDiv.appendChild(btn);
          });
          section.appendChild(linksDiv);
        }
      } else if (project.type === 'personal') {
        // Show screenshots only
        if (project.screenshots && project.screenshots.length) {
          const shotsDiv = document.createElement('div');
          shotsDiv.className = 'screenshots';
          project.screenshots.forEach(file => {
            const img = document.createElement('img');
            img.src = `projects/${encodeURIComponent(project.name)}/${file}`;
            img.alt = `${project.name} screenshot`;
            img.tabIndex = 0;
            img.addEventListener('mouseover', () => img.classList.add('focused'));
            img.addEventListener('mouseout', () => img.classList.remove('focused'));
            img.addEventListener('focus', () => img.classList.add('focused'));
            img.addEventListener('blur', () => img.classList.remove('focused'));
            // Modal open on click
            img.addEventListener('click', () => {
              modalImg.src = img.src;
              modalImg.alt = img.alt;
              modal.classList.add('open');
              modal.focus();
            });
            shotsDiv.appendChild(img);
          });
          section.appendChild(shotsDiv);
        }
      }
      main.appendChild(section);
    });
  }

  renderSection('Professional Projects', professionalProjects);
  renderSection('Personal Projects', personalProjects);

  // Modal logic
  const modal = document.getElementById('img-modal');
  const modalImg = document.getElementById('modal-img');
  const modalClose = document.getElementById('modal-close');

  // Use arrow buttons from HTML (no need to create them in JS)
  const modalPrev = document.getElementById('modal-prev');
  const modalNext = document.getElementById('modal-next');

  let currentModal = {
    project: null,
    index: 0,
    images: []
  };

  // Update modal image
  function showModalImage(project, index, images) {
    if (!images.length) return;
    currentModal.project = project;
    currentModal.index = (index + images.length) % images.length;
    currentModal.images = images;
    modalImg.src = images[currentModal.index];
    modalImg.alt = `${project.name} screenshot ${currentModal.index+1}`;
  }

  // Open modal from image click
  document.querySelectorAll('.screenshots').forEach(shotsDiv => {
    shotsDiv.addEventListener('click', e => {
      if (e.target.tagName === 'IMG') {
        // Find project and index
        const section = shotsDiv.closest('.project-section');
        const title = section && section.querySelector('.project-title')?.textContent;
        const allProjects = [...professionalProjects, ...personalProjects];
        const project = allProjects.find(p => p.name === title);
        if (!project) return;
        const imgs = Array.from(shotsDiv.querySelectorAll('img')).map(img => img.src);
        const idx = imgs.indexOf(e.target.src);
        showModalImage(project, idx, imgs);
        modal.classList.add('open');
        modal.focus();
      }
    });
  });

  // Modal navigation
  function nextImg() {
    if (!currentModal.images.length) return;
    showModalImage(currentModal.project, currentModal.index + 1, currentModal.images);
  }
  function prevImg() {
    if (!currentModal.images.length) return;
    showModalImage(currentModal.project, currentModal.index - 1, currentModal.images);
  }
  modalNext.onclick = nextImg;
  modalPrev.onclick = prevImg;

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'ArrowRight') {
      nextImg();
    } else if (e.key === 'ArrowLeft') {
      prevImg();
    } else if (e.key === 'Escape') {
      modal.classList.remove('open');
      modalImg.src = '';
    }
  });

  modalClose.addEventListener('click', () => {
    modal.classList.remove('open');
    modalImg.src = '';
  });
  // Close modal on click outside image
  modal.addEventListener('mousedown', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
      modalImg.src = '';
    }
  });
});
