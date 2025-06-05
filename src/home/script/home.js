import { projectSection } from './project.section.js';
import { professionalProjects } from '../projects/professional.projects.js';
import { personalProjects } from '../projects/personal.projects.js';
import { initModal } from './modal.js';

window.addEventListener('DOMContentLoaded', function() {
  projectSection(professionalProjects, "Professional Projects");
  projectSection(personalProjects, "Personal Projects");
  initModal();
});
