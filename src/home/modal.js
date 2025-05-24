let currentModal = {
  project: null,
  index: 0,
  images: []
};

let modal, modalImg, modalClose, modalPrev, modalNext;

export function initModal() {
  modal = document.getElementById('img-modal');
  modalImg = document.getElementById('modal-img');
  modalClose = document.getElementById('modal-close');
  modalPrev = document.getElementById('modal-prev');
  modalNext = document.getElementById('modal-next');

  modalNext.onclick = nextImg;
  modalPrev.onclick = prevImg;

  document.addEventListener('keydown', handleKeydown);
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('mousedown', handleClickOutside);
}

export function showModalImage(project, index, images) {
  if (!images.length) return;
  currentModal.project = project;
  currentModal.index = (index + images.length) % images.length;
  currentModal.images = images;
  modalImg.src = images[currentModal.index];
  modalImg.alt = `${project.name} screenshot ${currentModal.index+1}`;
  modal.classList.add('open');
  modal.focus();
}

function nextImg() {
  if (!currentModal.images.length) return;
  showModalImage(currentModal.project, currentModal.index + 1, currentModal.images);
}

function prevImg() {
  if (!currentModal.images.length) return;
  showModalImage(currentModal.project, currentModal.index - 1, currentModal.images);
}

function handleKeydown(e) {
  if (!modal.classList.contains('open')) return;
  if (e.key === 'ArrowRight') {
    nextImg();
  } else if (e.key === 'ArrowLeft') {
    prevImg();
  } else if (e.key === 'Escape') {
    closeModal();
  }
}

function closeModal() {
  modal.classList.remove('open');
  modalImg.src = '';
}

function handleClickOutside(e) {
  if (e.target === modal) {
    closeModal();
  }
}
