import {techIcons} from "../projects/tech_icons.js";
import {showModalImage} from "./modal.js";
import {ProjectType} from "../projects/project_type.js";

export function projectSection(projects, sectionTitle) {
  const portfolio = document.getElementById('portfolio');
  appendHeading(portfolio, sectionTitle);
  
  projects.forEach(project => {
    const section = document.createElement('section');
    section.className = 'project-section';

    let header = createHeaderRow(project.name, project.tech)
    section.appendChild(header);

    let description = createDescription(project.description)
    section.appendChild(description);

    appendLinkOrScreenshot(section, project);

    portfolio.appendChild(section);
  });
}

function appendHeading(parent, text) {
  let element = document.createElement('h2');
  const heading = Object.assign(element, {
    textContent: text
  });

  Object.assign(heading.style, {
    marginTop: '2.5rem',
    marginBottom: '1.2rem'
  });

  parent.appendChild(heading);
}

function createDescription(description) {
  let element = document.createElement('div');
  return Object.assign(element, {
    className: 'project-desc',
    innerHTML: description
  });
}

function createHeaderRow(name, tech) {
  const headerRow = Object.assign(document.createElement('div'), {
    className: 'project-header-row'
  });

  const titleDiv = Object.assign(document.createElement('div'), {
    className: 'project-title',
    textContent: name
  });

  const techDiv = Object.assign(document.createElement('div'), {
    className: 'tech-stack'
  });

  tech.forEach(t => {
    const icon = Object.assign(document.createElement('img'), {
      className: 'tech-icon',
      src: techIcons[t] || '',
      alt: `${t} icon`
    });

    const label = document.createElement('span');
    label.textContent = t;

    techDiv.append(icon, label);
  });

  headerRow.append(titleDiv, techDiv);
  return headerRow;
}

function createLinks(links) {
  if (!Array.isArray(links) || links.length === 0) return null;

  const linksDiv = Object.assign(document.createElement('div'), {
    className: 'project-links'
  });

  links.forEach(({ url, label }) => {
    const btn = Object.assign(document.createElement('a'), {
      className: 'project-link-btn',
      href: url,
      target: '_blank',
      rel: 'noopener',
      textContent: label
    });
    linksDiv.appendChild(btn);
  });

  return linksDiv;
}

function createScreenshots(screenshots, name) {
  if (!Array.isArray(screenshots) || !screenshots.length) return null;

  const shotsDiv = Object.assign(document.createElement('div'), {
    className: 'screenshots'
  });

  const imgPaths = screenshots.map(file => `/assets/projects/${name}/${file}`);

  screenshots.forEach((_, idx) => {
    const img = Object.assign(document.createElement('img'), {
      className: 'screenshot-img',
      src: imgPaths[idx],
      alt: `${name} screenshot ${idx + 1}`,
      tabIndex: 0
    });

    ['mouseover', 'focus'].forEach(e => img.addEventListener(e, () => img.classList.add('focused')));
    ['mouseout', 'blur'].forEach(e => img.addEventListener(e, () => img.classList.remove('focused')));

    img.addEventListener('click', () => showModalImage({ name, screenshots }, idx, imgPaths));

    shotsDiv.appendChild(img);
  });

  return shotsDiv;
}

function appendLinkOrScreenshot(section, project) {
  switch(project.type) {
    case ProjectType.Professional :
      const links = createLinks(project.links);
      if (links) {
        section.appendChild(links);
      }
      break;
    case ProjectType.Personal:
      const screenshots = createScreenshots(project.screenshots, project.name);
      if (screenshots) {
        section.appendChild(screenshots);
      }
      break;
    default:
  }
}