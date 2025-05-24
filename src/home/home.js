import { projectSection } from './project_section.js';
import { professionalProjects } from '../projects/professional_projects.js';
import { personalProjects } from '../projects/personal_projects.js';
import { initModal } from './modal.js';

window.addEventListener('DOMContentLoaded', function() {
  projectSection(professionalProjects, "Professional Projects");
  projectSection(personalProjects, "Personal Projects");
  initModal();
});
