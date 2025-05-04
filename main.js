
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

const projects = [
  {
    name: 'FirePlayer Android',
    description: 'Simple, fast, user friendly music player. Media3 is used. MVVM architecture chosen.',
    tech: ['Kotlin', 'Jetpack Compose'],
    screenshots: ['1.png','2.png','3.png','4.png','5.png']
  },
  {
    name: 'FirePlayer MacOS',
    description: 'Simple, fast, user friendly music player. AVFoundation is used.',
    tech: ['Swift', 'SwiftUI'],
    screenshots: ['1.png','2.png','3.png','4.png']
  },
  {
    name: 'LipaWallet',
    description: 'Secure Bitcoin Lightning wallet for Android & iOS.',
    tech: ['Swift', 'SwiftUI', 'Kotlin', 'Jetpack Compose'],
    screenshots: ['1.webp','2.webp','3.webp','4.webp','5.webp','6.webp']
  },
  {
    name: 'TextLauncher',
    description: 'Simple, fast, user friendly launcher application for Android. You can create folders, add favorite and hidden apps.',
    tech: ['Kotlin', 'Jetpack Compose'],
    screenshots: ['1.png','2.png','3.png','4.png','5.png','6.png','7.png']
  },
  {
    name: 'Emlakjet',
    description: 'Emlakjet is a real estate app for searching, posting, and managing property listings. Users can find apartments, houses, offices, and land for sale or rent, and contact real estate agencies directly. The app offers advanced search, saved searches, favorite listings, and market analysis tools.',
    tech: ['Java', 'XML', 'Objective-C', 'UIKit'],
    screenshots: ['1.webp','2.webp','3.webp','4.webp']
  },
  {
    name: 'MyLocker',
    description: 'Secure offline fast password manager.',
    tech: ['Kotlin', 'Jetpack Compose'],
    screenshots: ['1.png','2.png']
  },
];

window.addEventListener('DOMContentLoaded', function() {
  const main = document.getElementById('portfolio');
  projects.forEach(project => {
    if (!project.screenshots.length) return;
    const section = document.createElement('section');
    section.className = 'project-section';
    // Title
    section.innerHTML = `<div class="project-title">${project.name}</div>`;
    // Description
    const desc = document.createElement('div');
    desc.className = 'project-desc';
    desc.textContent = project.description;
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
    // Screenshots
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
    main.appendChild(section);
  });

  // Modal logic
  const modal = document.getElementById('img-modal');
  const modalImg = document.getElementById('modal-img');
  const modalClose = document.getElementById('modal-close');
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
  // Close modal on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      modal.classList.remove('open');
      modalImg.src = '';
    }
  });
});
