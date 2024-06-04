generateSteps('desktop');

// Open Modal
const showModal = (modal) => { 
  const Overlay = getElement("overlay");
  modal.style.display = Overlay.style.display = "block";
  if(modal === transferHistoryModal)
    Overlay.style.display = "none";
}

// Close Modal
const closeModal = (modal) => {
  const Overlay = getElement("overlay");
  modal.style.display = Overlay.style.display = "none";
}

// Close All Modal
const closeAllModal = () => { 
  const overlay = document.getElementById("overlay");
  overlay.style.display = "none";
  document.querySelectorAll(".modal").forEach(modal => {
    modal.style.display = "none";
  });
}

// Modal Close Button
document.querySelectorAll(".modal .close").forEach(closeButton => closeButton.addEventListener('click', function() {
  const modal = this.closest(".modal");
  if(modal !== transferHistoryModal)
  closeModal(modal);
}));


// Find-out Modal
const findOutModal = getElement("myModal");
const findOutBtn = document.querySelector(".find-out");
const findOutSpan = findOutModal.querySelector(".close");
const findOutStepButtons = document.querySelectorAll(".step-button");
const findOutSteps = document.querySelectorAll(".step");

const openFindOutModal = () => { showModal(findOutModal);
  resetFindOutModal();
  const lastClickedStepIndex = localStorage.getItem("lastClickedStepIndex");
  if (lastClickedStepIndex !== null) 
  findOutStepButtons[lastClickedStepIndex]?.click(); 
};

const closeFindOutModal = () => { closeModal(findOutModal); resetFindOutModal(); };
const resetFindOutModal = () => { findOutSteps.forEach(step => step.style.display = "none"); findOutSteps[0].style.display = "block"; };

findOutBtn.onclick = openFindOutModal;
findOutSpan.onclick = closeFindOutModal;

findOutStepButtons.forEach((button, index) => button.addEventListener("click", () =>
{ findOutSteps.forEach(step => step.style.display = "none"); findOutSteps[index].style.display = "block";
  localStorage.setItem("lastClickedStepIndex", index); }));

window.addEventListener('beforeunload', () => localStorage.removeItem("lastClickedStepIndex"));

$(document).ready(function() {
  $(function() {
    const findOutStepButtons = document.querySelectorAll('.step-button');
    findOutStepButtons.forEach(button => button.addEventListener('click', () => {
      const clickedIndex = parseInt(button.getAttribute('data-step')) - 2;
      findOutStepButtons.forEach((btn, index) =>
        btn.classList.toggle('clicked', index <= clickedIndex));
    }));
  });
});

document.querySelectorAll('.step-description').forEach(description =>
description.innerHTML = description.textContent.replace(/(.*?:)/, '<b>$1</b>'));
