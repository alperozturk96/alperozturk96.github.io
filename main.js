
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

const professionals = [
  {
    name: 'Nextcloud',
    description: `
    <ul style="margin-top:0.7em; margin-bottom:1.2em; padding-left:1.3em; font-size:1em; color:#bdbdbd;">
      <li>Developed and maintained Files & Notes mobile apps reaching 1M+ active users.</li>
      <li>Implemented end-to-end encryption using Bouncy Castle and androidx.security, ensuring secure data transfer, certificate-signature verification.</li>
      <li>Successfully implemented background tasks such as multi-file, folder synchronization, downloads, and uploads using WorkManager.</li>
      <li>Applied the MVVM design pattern and modern Android best practices to maintain a clean, scalable, and testable codebase</li>
      <li>Eliminated anti-patterns in the project by adopting modern Android development practices</li>
      <li>Reduced memory usage by 20% and improved performance by up to 50% through efficient use of Kotlin Coroutines</li>
      <li>Refactored and migrated a legacy Java codebase to Kotlin, improving maintainability and eliminating technical debt</li>
    </ul>`,

    tech: ['Kotlin', 'Java', 'XML', 'Jetpack Compose'],
    screenshots: ['1.png','2.png','3.png','4.png','5.png']
  },
  {
    name: 'LipaWallet',
    description: `<ul style="margin-top:0.7em; margin-bottom:1.2em; padding-left:1.3em; font-size:1em; color:#bdbdbd;">
      <li>Developed a Bitcoin Lightning wallet with native SwiftUI for iOS and Jetpack Compose for Android</li>
      <li>Solved complex data transfer issues by integrating an internally developed Rust library into native Android and iOS apps using platform-specific bindings and an event-driven architecture</li>
      <li>Built an efficient, memory-leak-free, and high-performance networking architecture by leveraging the latest approaches with the Apollo GraphQL client separately for Android and iOS</li>
      <li>Maximized user security by implementing biometric authentication: Touch ID and Face ID on iOS, and biometric authentication on Android</li>
      <li>Designed architecture for background data processing for both Android and iOS platforms</li>
      <li>Created a modular architecture for Android and iOS separately to eliminate code duplication and improve maintainability and reusability used Swift Package Manager (SPM) for iOS and JitPack for Android</li>
      <li>Automated development and release processes using Fastlane</li>
    </ul>`,

    tech: ['Swift', 'SwiftUI', 'Kotlin', 'Jetpack Compose'],
    screenshots: ['1.webp','2.webp','3.webp','4.webp','5.webp','6.webp']
  },
  {
    name: 'Emlakjet',
    description: 'Emlakjet is a real estate app for searching, posting, and managing property listings. Users can find apartments, houses, offices, and land for sale or rent, and contact real estate agencies directly. The app offers advanced search, saved searches, favorite listings, and market analysis tools.',
    tech: ['Java', 'XML', 'Objective-C', 'UIKit'],
    screenshots: ['1.webp','2.webp','3.webp','4.webp']
  },
  {
    name: 'DentalBulut',
    description: 'Designed for dental clinics, serving as a patient tracking and clinic management software. It allows dentists to manage patient information and clinic operations efficiently from mobile devices',
    tech: ['Java', 'XML', 'Swift', 'UIKit'],
    screenshots: ['1.webp','2.webp','3.webp']
  },
];

const personals = [
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
    name: 'TextLauncher',
    description: 'Simple, fast, user friendly launcher application for Android. You can create folders, add favorite and hidden apps.',
    tech: ['Kotlin', 'Jetpack Compose'],
    screenshots: ['1.png','2.png','3.png','4.png','5.png','6.png','7.png']
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

  function renderSection(title, projects) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    heading.style.marginTop = '2.5rem';
    heading.style.marginBottom = '1.2rem';
    main.appendChild(heading);
    projects.forEach(project => {
      if (!project.screenshots.length) return;
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
  }

  renderSection('Professional Projects', professionals);
  renderSection('Personal Projects', personals);

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
