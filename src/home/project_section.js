import {techIcons} from "../projects/tech_icons.js";
import {showModalImage} from "./modal.js";

export function projectSection(projects, sectionTitle) {
  const main = document.getElementById('portfolio');
  const heading = document.createElement('h2');
  heading.textContent = sectionTitle;
  heading.style.marginTop = '2.5rem';
  heading.style.marginBottom = '1.2rem';
  main.appendChild(heading);
  
  projects.forEach(project => {
    const section = document.createElement('section');
    section.className = 'project-section';

    let header = createHeaderRow(project)
    section.appendChild(header);

    let description = createDescription(project)
    section.appendChild(description);

    if (project.type === 'professional') {
      const linksDiv = createLinks(project);
      if (linksDiv) section.appendChild(linksDiv);
    } else if (project.type === 'personal') {
      const shotsDiv = createScreenshots(project);
      if (shotsDiv) section.appendChild(shotsDiv);
    }
    
    main.appendChild(section);
  });
}

function createDescription(project) {
  const desc = document.createElement('div');
  desc.className = 'project-desc';
  desc.innerHTML = project.description;
  return desc;
}

function createHeaderRow(project) {
  const headerRow = document.createElement('div');
  headerRow.className = 'project-header-row';
  const titleDiv = document.createElement('div');
  titleDiv.className = 'project-title';
  titleDiv.textContent = project.name;
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
  headerRow.appendChild(titleDiv);
  headerRow.appendChild(techDiv);
  return headerRow;
}

function createLinks(project) {
  if (!Array.isArray(project.links) || !project.links.length) return null;
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
  return linksDiv;
}

function createScreenshots(project) {
  if (!project.screenshots || !project.screenshots.length) return null;
  const shotsDiv = document.createElement('div');
  shotsDiv.className = 'screenshots';
  project.screenshots.forEach((screenshot, idx) => {
    const img = document.createElement('img');
    img.className = 'screenshot-img';
    img.src = `/assets/projects/${project.name}/${screenshot}`;
    img.alt = `${project.name} screenshot ${idx+1}`;
    img.tabIndex = 0;
    img.addEventListener('mouseover', () => img.classList.add('focused'));
    img.addEventListener('mouseout', () => img.classList.remove('focused'));
    img.addEventListener('focus', () => img.classList.add('focused'));
    img.addEventListener('blur', () => img.classList.remove('focused'));
    // Modal open on click
    img.addEventListener('click', () => {
      showModalImage(project, idx, project.screenshots.map(s => `/assets/projects/${project.name}/${s}`));
    });
    shotsDiv.appendChild(img);
  });
  return shotsDiv;
}